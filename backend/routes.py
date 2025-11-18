from flask import request, jsonify, Response, stream_with_context
from openai import OpenAI
import os
from models import Conversation, Message
from database import db
import time

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Prompt Variables
CHAR_LIMIT = 300

SYSTEM_PROMPT_BASE = f"""
You are an AI storyteller. Your sole purpose is to craft immersive and engaging narratives. All responses must be in the form of a story told from the reader's perspective, using 'You' as the protagonist.

For the first prompt:
- Begin with a **brief but vivid** description of the setting—establishing time, place, and atmosphere.
- The world can be fantastical or sci-fi, but it must follow an internally consistent logic.
- **Keep descriptions concise and action-driven.**

For all subsequent prompts:
- **Acknowledge the player's input and narrate the immediate consequences** of their actions.
- Responses should be **short and move the story forward.**
- **Do not list multiple paths**; the player decides what happens next.
- **Only provide options if it enhances the story**, and ensure they are brief.
- **Use sensory details, but do not over-describe.**
- Avoid unnecessary exposition—**let actions speak.**

Constraints:
- If an input does not align with storytelling, reinterpret it into the narrative to maintain immersion.
- Responses should be limited to {CHAR_LIMIT} words per interaction.
- The world can contain unreal elements (magic, advanced technology, unknown forces), but they must operate under a consistent set of rules.
- The story should feel dynamic, with logical cause-and-effect relationships guiding the plot.
- Tone, pacing, and stakes should match the unfolding narrative, adapting as needed to maintain engagement.
"""

def construct_system_prompt(conversation_id=None):
    """Construct system prompt, optionally including conversation history"""
    prompt = SYSTEM_PROMPT_BASE

    if conversation_id:
        # Get recent conversation history (last 10 messages)
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.desc()).limit(10).all()

        # DEBUG: Log what messages were found
        print(f"DEBUG construct_system_prompt: Found {len(messages)} messages for conversation {conversation_id}")
        for msg in messages:
            print(f"  - Message ID {msg.id}, Conv ID {msg.conversation_id}, Role: {msg.role}, Text: {msg.text[:50]}...")

        if messages:
            prompt += "\n\nRecent conversation history:\n"
            for msg in reversed(messages):
                role = "Player" if msg.role == "player" else "AI"
                prompt += f"{role}: {msg.text[:100]}...\n"

    return prompt

def register_routes(app):
    """Register all routes with the Flask app"""
    
    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint"""
        return jsonify({"status": "healthy"}), 200
    
    @app.route("/generate", methods=["POST"])
    def generate_response():
        """Generate AI story response"""
        try:
            data = request.get_json()
            user_input = data.get("input", "")
            conversation_id = data.get("conversation_id")
            
            if not user_input:
                return jsonify({"error": "No input provided"}), 400
            
            # Get or create conversation
            if conversation_id:
                conversation = Conversation.query.get(conversation_id)
                if not conversation:
                    return jsonify({"error": "Conversation not found"}), 404
            else:
                conversation = Conversation()
                db.session.add(conversation)
                db.session.commit()
            
            # Save user's message
            user_message = Message(
                conversation_id=conversation.id,
                role="player",
                text=user_input
            )
            db.session.add(user_message)
            db.session.commit()
            
            # Construct system prompt with conversation history
            system_prompt = construct_system_prompt(conversation.id)

            # DEBUG: Log what's being sent to OpenAI
            print(f"\n=== DEBUG: Conversation ID: {conversation.id} ===")
            print(f"System prompt length: {len(system_prompt)} chars")
            print(f"System prompt preview:\n{system_prompt[:500]}...")
            print(f"User input: {user_input}")
            print("=== END DEBUG ===\n")

            # OpenAI API streaming response
            def generate_stream():
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Reader's input: {user_input}"}
                    ],
                    max_tokens=400,
                    stream=True
                )
                
                full_text = ""
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        full_text += chunk.choices[0].delta.content
                        yield chunk.choices[0].delta.content
                        time.sleep(0.02)
                
                # Save AI's response
                ai_message = Message(
                    conversation_id=conversation.id,
                    role="ai",
                    text=full_text
                )
                db.session.add(ai_message)
                db.session.commit()

                yield f"\n<END><CONV_ID>{conversation.id}"
            
            return Response(stream_with_context(generate_stream()), content_type="text/plain")
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @app.route("/conversations", methods=["GET"])
    def list_conversations():
        """List all conversations"""
        try:
            conversations = Conversation.query.order_by(Conversation.created_at.desc()).all()
            return jsonify([{
                "id": c.id,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
                "message_count": len(c.messages)
            } for c in conversations])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @app.route("/conversations/<int:conversation_id>", methods=["GET"])
    def get_conversation(conversation_id):
        """Get a specific conversation with all messages"""
        try:
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404

            messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
            return jsonify({
                "id": conversation.id,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "messages": [{
                    "id": m.id,
                    "role": m.role,
                    "text": m.text,
                    "created_at": m.created_at.isoformat()
                } for m in messages]
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/conversations/<int:conversation_id>", methods=["DELETE"])
    def delete_conversation(conversation_id):
        """Delete a conversation and all its messages"""
        try:
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404

            # Delete all messages in the conversation
            Message.query.filter_by(conversation_id=conversation_id).delete()

            # Delete the conversation
            db.session.delete(conversation)
            db.session.commit()

            return jsonify({"message": "Conversation deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

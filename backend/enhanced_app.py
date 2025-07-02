# enhanced_app.py
"""
Enhanced Flask application with comprehensive database design for story management.

This version includes:
- User profiles and story sessions
- Multi-layered memory management
- Conversation history compaction
- Optimized AI context building
"""

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from openai import OpenAI
import os
import json
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import enhanced models and utilities
from enhanced_models import (
    db, User, Story, Conversation, Message, StoryMemory, 
    MessageSummary, MemoryManager
)
from memory_utils import (
    ConversationCompactor, StoryMemoryExtractor, 
    ContextBuilder, MemoryMaintenanceService
)
from migration_manager import DatabaseInitializer

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///enhanced_stories.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables and handle migration
with app.app_context():
    success = DatabaseInitializer.initialize_fresh_database()
    if not success:
        print("Warning: Database initialization may have failed")

# Prompt configuration
CHAR_LIMIT = 300
BASE_SYSTEM_PROMPT = f"""
You are an AI storyteller crafting immersive narratives. All responses must be stories told from the reader's perspective using 'You' as the protagonist.

For the first prompt:
- Begin with a brief but vivid setting description—time, place, and atmosphere.
- The world can be fantastical or sci-fi with consistent internal logic.
- Keep descriptions concise and action-driven.

For subsequent prompts:
- Acknowledge the player's input and narrate immediate consequences.
- Responses should be short and move the story forward.
- Do not list multiple paths; let the player decide what happens next.
- Use sensory details without over-describing.
- Let actions speak louder than exposition.

Constraints:
- Reinterpret non-story inputs into the narrative to maintain immersion.
- Limit responses to {CHAR_LIMIT} words per interaction.
- Maintain consistent world rules and logical cause-and-effect.
- Adapt tone, pacing, and stakes to match the unfolding narrative.
"""


@app.route("/api/user/session", methods=["POST"])
def create_or_get_user_session():
    """
    Create or retrieve user session for story tracking.
    """
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        display_name = data.get("display_name", "Adventurer")
        
        if not session_id:
            session_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Try to find existing user
        user = User.query.filter_by(session_id=session_id).first()
        
        if not user:
            # Create new user
            user = User(
                session_id=session_id,
                display_name=display_name,
                preferred_story_length=data.get("preferred_story_length", "medium"),
                preferred_genres=json.dumps(data.get("preferred_genres", ["fantasy", "adventure"]))
            )
            db.session.add(user)
            db.session.commit()
        else:
            # Update last active
            user.last_active = datetime.utcnow()
            if display_name != "Adventurer":
                user.display_name = display_name
            db.session.commit()
        
        return jsonify({
            "success": True,
            "user": user.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stories", methods=["GET"])
def get_user_stories():
    """
    Get all stories for a user session.
    """
    try:
        session_id = request.args.get("session_id")
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        user = User.query.filter_by(session_id=session_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        stories = Story.query.filter_by(user_id=user.id).order_by(Story.last_message_at.desc()).all()
        
        return jsonify({
            "success": True,
            "stories": [story.to_dict() for story in stories]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stories", methods=["POST"])
def create_new_story():
    """
    Create a new story session for a user.
    """
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        user = User.query.filter_by(session_id=session_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Create new story
        story = Story(
            user_id=user.id,
            title=data.get("title"),
            genre=data.get("genre", "fantasy"),
            setting_summary=data.get("setting_summary"),
            status="active"
        )
        
        db.session.add(story)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "story": story.to_dict()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stories/<story_id>/generate", methods=["POST"])
def generate_story_response(story_id):
    """
    Generate AI response for a specific story with enhanced context management.
    """
    try:
        data = request.get_json()
        user_input = data.get("input", "")
        session_id = data.get("session_id")
        
        if not user_input:
            return jsonify({"error": "No input provided"}), 400
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        # Verify story belongs to user
        story = db.session.query(Story)\
            .join(User)\
            .filter(Story.id == story_id, User.session_id == session_id)\
            .first()
        
        if not story:
            return jsonify({"error": "Story not found or access denied"}), 404
        
        # Get or create current conversation
        conversation = Conversation.query\
            .filter_by(story_id=story_id)\
            .order_by(Conversation.created_at.desc())\
            .first()
        
        if not conversation or should_start_new_conversation(conversation):
            # Create new conversation session
            conversation = Conversation(
                story_id=story_id,
                session_number=get_next_session_number(story_id)
            )
            db.session.add(conversation)
            db.session.commit()
        
        # Save user message
        importance_score = MemoryManager.classify_message_importance(user_input, "player")
        message_age_hours = 0  # New message
        memory_type = MemoryManager.determine_memory_type(importance_score, message_age_hours)
        
        user_message = Message(
            conversation_id=conversation.id,
            role="player",
            content=user_input,
            importance_score=importance_score,
            memory_type=memory_type
        )
        db.session.add(user_message)
        db.session.commit()
        
        # Build optimized context for AI
        context = ContextBuilder.build_prompt_context(story_id, max_tokens=1500)
        system_prompt = construct_enhanced_system_prompt(context)
        
        # Update story's last message time
        story.last_message_at = datetime.utcnow()
        db.session.commit()
        
        # Generate streaming response
        def generate_stream():
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Player action: {user_input}"}
                ],
                max_tokens=400,
                stream=True
            )
            
            full_text = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_text += content
                    yield content
                    import time
                    time.sleep(0.02)
            
            # Save AI response with enhanced metadata
            ai_importance = MemoryManager.classify_message_importance(full_text, "ai")
            ai_memory_type = MemoryManager.determine_memory_type(ai_importance, 0)
            
            ai_message = Message(
                conversation_id=conversation.id,
                role="ai",
                content=full_text,
                importance_score=ai_importance,
                memory_type=ai_memory_type,
                tokens_used=len(full_text.split()) * 1.3  # Rough estimate
            )
            db.session.add(ai_message)
            db.session.commit()
            
            # Extract memories from this exchange (async)
            try:
                memories = StoryMemoryExtractor.extract_memories_from_conversation(str(conversation.id))
                if memories:
                    print(f"Extracted {len(memories)} new memories from conversation")
            except Exception as e:
                print(f"Error extracting memories: {e}")
            
            # Check if conversation should be summarized
            if should_summarize_conversation(conversation.id):
                try:
                    summary = ConversationCompactor.create_summary(str(conversation.id))
                    if summary:
                        print(f"Created conversation summary with {summary.compression_ratio:.2f}x compression")
                except Exception as e:
                    print(f"Error creating summary: {e}")
            
            yield f"\n<END>{full_text}"
        
        return Response(stream_with_context(generate_stream()), content_type="text/plain")
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stories/<story_id>/context", methods=["GET"])
def get_story_context(story_id):
    """
    Get the current context for a story (for debugging/development).
    """
    try:
        session_id = request.args.get("session_id")
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        # Verify story belongs to user
        story = db.session.query(Story)\
            .join(User)\
            .filter(Story.id == story_id, User.session_id == session_id)\
            .first()
        
        if not story:
            return jsonify({"error": "Story not found or access denied"}), 404
        
        context = ContextBuilder.build_prompt_context(story_id)
        
        return jsonify({
            "success": True,
            "context": context
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stories/<story_id>/memories", methods=["GET"])
def get_story_memories(story_id):
    """
    Get all memories for a story.
    """
    try:
        session_id = request.args.get("session_id")
        memory_type = request.args.get("type")  # Optional filter
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
        
        # Verify story belongs to user
        story = db.session.query(Story)\
            .join(User)\
            .filter(Story.id == story_id, User.session_id == session_id)\
            .first()
        
        if not story:
            return jsonify({"error": "Story not found or access denied"}), 404
        
        query = StoryMemory.query.filter_by(story_id=story_id)
        
        if memory_type:
            query = query.filter_by(memory_type=memory_type)
        
        memories = query.order_by(StoryMemory.importance_score.desc()).all()
        
        return jsonify({
            "success": True,
            "memories": [memory.to_dict() for memory in memories]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/maintenance/cleanup", methods=["POST"])
def run_memory_cleanup():
    """
    Run memory maintenance and cleanup (admin endpoint).
    """
    try:
        # Run cleanup operations
        cleanup_count = MemoryMaintenanceService.cleanup_old_memories(days_old=30)
        update_count = MemoryMaintenanceService.update_memory_importance()
        
        return jsonify({
            "success": True,
            "cleanup": {
                "memories_cleaned": cleanup_count,
                "memories_updated": update_count
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Helper functions
def should_start_new_conversation(conversation):
    """
    Determine if a new conversation session should be started.
    """
    if not conversation:
        return True
    
    # Start new conversation if last message was more than 2 hours ago
    time_threshold = datetime.utcnow() - timedelta(hours=2)
    return conversation.updated_at < time_threshold


def get_next_session_number(story_id):
    """
    Get the next session number for a story.
    """
    last_conversation = Conversation.query\
        .filter_by(story_id=story_id)\
        .order_by(Conversation.session_number.desc())\
        .first()
    
    return (last_conversation.session_number + 1) if last_conversation else 1


def should_summarize_conversation(conversation_id):
    """
    Determine if a conversation should be summarized.
    """
    message_count = Message.query.filter_by(conversation_id=conversation_id).count()
    return message_count >= 20  # Summarize every 20 messages


def construct_enhanced_system_prompt(context):
    """
    Build an enhanced system prompt using context from memory layers.
    """
    prompt_parts = [BASE_SYSTEM_PROMPT]
    
    # Add story setup
    story_setup = context.get("story_setup", {})
    if story_setup:
        prompt_parts.append(f"\nSTORY CONTEXT:")
        prompt_parts.append(f"- Title: {story_setup.get('title', 'Untitled Adventure')}")
        prompt_parts.append(f"- Genre: {story_setup.get('genre', 'fantasy')}")
        prompt_parts.append(f"- Setting: {story_setup.get('setting', 'A mysterious world')}")
        prompt_parts.append(f"- Current Scene: {story_setup.get('current_scene', 'The adventure continues')}")
    
    # Add important memories
    memories = context.get("important_memories", [])
    if memories:
        prompt_parts.append(f"\nIMPORTANT STORY ELEMENTS:")
        for memory in memories[:5]:  # Limit to top 5
            prompt_parts.append(f"- {memory['title']}: {memory['content']}")
    
    # Add recent context summary
    summaries = context.get("conversation_summary", [])
    if summaries:
        prompt_parts.append(f"\nRECENT EVENTS:")
        for summary in summaries[:2]:  # Most recent summaries
            prompt_parts.append(f"- {summary['summary']}")
    
    # Add immediate recent context
    recent = context.get("recent_context", [])
    if recent:
        prompt_parts.append(f"\nIMMEDIATE CONTEXT (last few exchanges):")
        for msg in recent[-5:]:  # Last 5 messages
            role_label = "Player" if msg['role'] == "player" else "Story"
            prompt_parts.append(f"- {role_label}: {msg['content'][:100]}...")
    
    return "\n".join(prompt_parts)


# Legacy endpoint for compatibility
@app.route("/generate", methods=["POST"])
def legacy_generate():
    """
    Legacy endpoint that creates a temporary user and story for compatibility.
    """
    try:
        data = request.get_json()
        user_input = data.get("input", "")
        
        if not user_input:
            return jsonify({"error": "No input provided"}), 400
        
        # Create temporary user and story
        temp_session_id = f"temp_{uuid.uuid4().hex[:8]}"
        
        user = User(
            session_id=temp_session_id,
            display_name="Temporary Adventurer"
        )
        db.session.add(user)
        db.session.commit()
        
        story = Story(
            user_id=user.id,
            title="Quick Adventure",
            genre="fantasy",
            status="active"
        )
        db.session.add(story)
        db.session.commit()
        
        # Create conversation
        conversation = Conversation(
            story_id=story.id,
            session_number=1
        )
        db.session.add(conversation)
        db.session.commit()
        
        # Forward to the enhanced endpoint
        request.json["session_id"] = temp_session_id
        return generate_story_response(str(story.id))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
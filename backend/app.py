from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()
print("DATABASE_URL:", os.getenv("DATABASE_URL"))


# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Flask app and configure DB (update DATABASE_URL in your .env)
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define database models
class Conversation(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='conversation', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # "player" or "ai"
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

# Prompt Variables
char_limit = 300  # Reduced limit for concise storytelling

system_prompt_base = f"""
You are an AI storyteller. Your sole purpose is to craft immersive and engaging narratives. All responses must be in the form of a story told from the reader's perspective, using ‘You’ as the protagonist.

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
- Responses should be limited to {char_limit} words per interaction.
- The world can contain unreal elements (magic, advanced technology, unknown forces), but they must operate under a consistent set of rules.
- The story should feel dynamic, with logical cause-and-effect relationships guiding the plot.
- Tone, pacing, and stakes should match the unfolding narrative, adapting as needed to maintain engagement.
"""

# (Keep your summarization and memory functions here if needed for future features)

def construct_system_prompt():
    # For now, we keep the same prompt; later, you could augment it with DB-fetched history
    return system_prompt_base

@app.route("/generate", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_input = data.get("input", "")
        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        # Create a new conversation for this request
        conversation = Conversation()
        db.session.add(conversation)
        db.session.commit()  # commit to get conversation.id

        # Save user's message
        user_message = Message(
            conversation_id=conversation.id,
            role="player",
            text=user_input
        )
        db.session.add(user_message)
        db.session.commit()

        # Construct system prompt (you can later include conversation history from DB)
        system_prompt = construct_system_prompt()

        # OpenAI API streaming response
        def generate_stream():
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Reader's input: {user_input}"}
                ],
                max_tokens=400,
                stream=True  # Enable streaming response
            )

            full_text = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    full_text += chunk.choices[0].delta.content
                    yield chunk.choices[0].delta.content
                    import time
                    time.sleep(0.02)  # Simulate a streaming effect

            # Save AI's response
            ai_message = Message(
                conversation_id=conversation.id,
                role="ai",
                text=full_text
            )
            db.session.add(ai_message)
            db.session.commit()

            yield f"\n<END>{full_text}"

        return Response(stream_with_context(generate_stream()), content_type="text/plain")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

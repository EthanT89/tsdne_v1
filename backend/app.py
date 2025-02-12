from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Prompt Variables:
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

# Memory Tiers
short_term_memory = []  # Stores the last 10 exchanges (word for word)
mid_term_memory = []  # Stores summarized story segments
long_term_memory = []  # Stores condensed key moments

# Memory Configuration
SHORT_TERM_LIMIT = 30
MID_TERM_LIMIT = 20
LONG_TERM_LIMIT = 20

# Function to generate a summarized story segment
def summarize_story_segment(segment):
    """Summarizes a given text into a concise narrative form."""
    if not segment:
        return "No relevant past events."

    prompt = f"Summarize these story events in a concise but immersive manner, retaining all KEY details:\n{segment}"

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=400
    )
    print(response.choices[0].message.content)

    return response.choices[0].message.content

# Function to manage memory compression
def update_memory():
    global short_term_memory, mid_term_memory, long_term_memory

    # If short-term exceeds limit, summarize and move excess to mid-term
    if len(short_term_memory) > SHORT_TERM_LIMIT:
        excess = short_term_memory[:5]  # Take the first 5
        summary = summarize_story_segment("\n".join(excess))
        mid_term_memory.append(summary)
        short_term_memory = short_term_memory[5:]  # Keep the latest 10

    # If mid-term exceeds limit, summarize and move excess to long-term
    if len(mid_term_memory) > MID_TERM_LIMIT:
        excess = mid_term_memory[:3]  # Take the first 3
        summary = summarize_story_segment("\n".join(excess))
        long_term_memory.append(summary)
        mid_term_memory = mid_term_memory[3:]  # Keep the latest 7

    # If long-term exceeds limit, compact and replace last 5 entries
    if len(long_term_memory) > LONG_TERM_LIMIT:
        excess = long_term_memory[-5:]  # Take the last 5
        summary = summarize_story_segment("\n".join(excess))
        long_term_memory = long_term_memory[:-5] + [summary]  # Replace last 5 with summary

# Function to construct system prompt with memory
def construct_system_prompt():
    update_memory()  # Ensure memory is updated before constructing prompt

    memory_summary = "\n\n".join(long_term_memory + mid_term_memory)
    recent_history = "\n\n".join(short_term_memory)

    system_prompt = system_prompt_base + f"""
    \n\nLong-Term Story Recap:
    {memory_summary if memory_summary else "No prior key events recorded."}
    \n\nMid-Term Story Recap:
    {recent_history if recent_history else "No recent interactions stored."}
    """
    
    return system_prompt

@app.route("/generate", methods=["POST"])
def generate_response():
    try:
        print(short_term_memory, '\n\nEND OF SHORT TERM\n\n', mid_term_memory, '\n\nEND OF MID TERM\n\n', long_term_memory, '\n\nEND OF LONG TERM\n\n')
        data = request.get_json()
        user_input = data.get("input", "")

        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        # Append user input to short-term memory
        short_term_memory.append(f"User: {user_input}")

        # Construct the updated system prompt
        system_prompt = construct_system_prompt()

        # OpenAI API streaming response
        def generate_stream():
            print('Calling OpenAI API...')
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f'Reader\'s input: {user_input}'}
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

            # Save AI response in short-term memory
            short_term_memory.append(f"AI: {full_text}")

            yield f"\n<END>{full_text}"

        return Response(stream_with_context(generate_stream()), content_type="text/plain")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
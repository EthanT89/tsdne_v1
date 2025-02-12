from openai import OpenAI
import os
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Instantiate OpenAI client

def test_openai():
    prompt = "Write a short sci-fi story about an AI exploring space."

    try:
        response = client.chat.completions.create(  # Updated syntax
            model="gpt-3.5-turbo",  # Use "gpt-4" if needed
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )

        print("✅ OpenAI Response:")
        print(response.choices[0].message.content.strip())  # Corrected response parsing

    except Exception as e:
        print("❌ Error communicating with OpenAI:", e)

# Run the test
if __name__ == "__main__":
    test_openai()

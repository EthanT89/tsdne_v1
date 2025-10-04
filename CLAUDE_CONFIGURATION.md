# Claude API Configuration Guide

This document provides guidance on how to configure and adjust Claude API settings for the "This Story Does Not Exist" application.

## Getting Your Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

## Installation Requirements

The application requires the Anthropic SDK version 0.39.0 or later. The dependencies are managed in `backend/requirements.txt`.

**Important:** If you encounter issues with httpx compatibility, ensure you're using httpx version 0.27.x (not 0.28.x). The requirements.txt file specifies compatible versions.

To install all dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Setting Up the API Key

Add your Claude API key to the `backend/.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Important:** Never commit your API key to version control. The `.env` file is in `.gitignore` by default.

## Model Configuration

The application currently uses **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`), which offers:
- Excellent creative writing capabilities
- Strong context understanding
- Fast response times
- Good balance of quality and cost

### Available Claude Models

You can adjust the model in `backend/routes.py` (line 97):

```python
model="claude-3-5-sonnet-20241022"  # Current model
```

Alternative models:
- `claude-3-5-sonnet-20241022` - Best balance (recommended)
- `claude-3-opus-20240229` - Highest quality, slower, more expensive
- `claude-3-haiku-20240307` - Fastest, most cost-effective, good quality

### When to Use Different Models

- **Claude 3.5 Sonnet** (Default): Best for most use cases, excellent storytelling
- **Claude 3 Opus**: Use for premium experiences requiring maximum creativity
- **Claude 3 Haiku**: Use for high-volume scenarios where speed matters most

## Adjusting Response Length

The `max_tokens` parameter controls the maximum length of responses:

```python
max_tokens=400  # Current setting
```

Recommended values:
- **Short responses**: 200-300 tokens
- **Medium responses** (current): 400 tokens
- **Long responses**: 600-1000 tokens

Note: The system prompt already constrains responses to ~300 words. Adjust both the `max_tokens` and `CHAR_LIMIT` variable for consistency.

## System Prompt Customization

The system prompt in `backend/routes.py` defines how Claude behaves as a storyteller. You can adjust:

1. **Tone and Style**: Modify the instructions to change narrative voice
2. **Response Length**: Adjust the `CHAR_LIMIT` variable (currently 300 words)
3. **Story Elements**: Add/remove constraints about world-building, pacing, etc.

Example modification for more descriptive stories:
```python
CHAR_LIMIT = 400  # Increase from 300
```

## Managing Conversation Context

The application includes conversation history in the system prompt:

```python
def construct_system_prompt(conversation_id=None):
    # Get recent conversation history (last 10 messages)
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.desc()).limit(10).all()
```

### Adjusting Context Window

To change how much history is included:
- **More context**: Increase `.limit(10)` to `.limit(20)` or higher
- **Less context**: Decrease to `.limit(5)` or lower
- **No context**: Set to `.limit(0)` or remove the history section

**Trade-offs:**
- More context = Better continuity, higher token usage, slower responses
- Less context = Faster, cheaper, but may lose story coherence

## Streaming Configuration

Claude's streaming is configured in the `generate_stream()` function:

```python
with client.messages.stream(
    model="claude-3-5-sonnet-20241022",
    max_tokens=400,
    messages=[...]
) as stream:
    for text in stream.text_stream:
        full_text += text
        yield text
        time.sleep(0.02)  # Adjust typing speed
```

### Adjusting Typing Speed

Change `time.sleep(0.02)` to control the streaming speed:
- **Faster**: `time.sleep(0.01)` or `time.sleep(0.005)`
- **Slower**: `time.sleep(0.05)` or `time.sleep(0.1)`
- **No delay**: Remove the line entirely

## Temperature and Other Parameters

Claude's Messages API supports additional parameters for fine-tuning:

```python
with client.messages.stream(
    model="claude-3-5-sonnet-20241022",
    max_tokens=400,
    temperature=1.0,  # Add this (0.0 to 1.0)
    messages=[...]
) as stream:
```

**Temperature values:**
- `0.0` - More deterministic, consistent responses
- `1.0` - Default, balanced creativity
- Higher values not officially supported but may work

## Error Handling

The application handles Claude API errors generically. For better error messages, you can enhance the error handling:

```python
try:
    # API call
except anthropic.APIError as e:
    return jsonify({"error": f"Claude API error: {str(e)}"}), 500
except Exception as e:
    return jsonify({"error": str(e)}), 500
```

## Rate Limits and Quotas

Claude API has rate limits based on your plan:
- Monitor your usage in the [Anthropic Console](https://console.anthropic.com/)
- Consider implementing rate limiting in your application for production use
- Cache responses when appropriate to reduce API calls

## Cost Optimization Tips

1. **Use appropriate models**: Haiku for high-volume, Sonnet for quality balance
2. **Limit context**: Reduce conversation history to minimize input tokens
3. **Set reasonable max_tokens**: Don't request more tokens than needed
4. **Implement caching**: Cache common responses or story templates
5. **Monitor usage**: Track API costs using Anthropic's dashboard

## Testing Claude Integration

To test the Claude integration:

1. Start the backend server
2. Use curl to test the `/generate` endpoint:

```bash
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "I want to explore a mysterious castle"}'
```

3. Check for streaming responses
4. Verify database storage of messages

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
- Ensure `.env` file exists in `backend/` directory
- Verify the key name is exactly `ANTHROPIC_API_KEY`
- Restart the Flask server after changing `.env`

### "Invalid API key"
- Verify the key is correct in the Anthropic Console
- Ensure the key starts with `sk-ant-`
- Check that your account has available credits

### "Rate limit exceeded"
- Wait a few moments and retry
- Upgrade your Anthropic plan if needed
- Implement request throttling in your application

### "Context too long"
- Reduce conversation history limit
- Decrease max_tokens
- Shorten system prompt

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)
- [Best Practices for Prompting](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [API Reference](https://docs.anthropic.com/claude/reference/messages_post)

## Support

For issues with:
- **Claude API**: Contact [Anthropic Support](https://support.anthropic.com/)
- **This Application**: Open an issue on [GitHub](https://github.com/EthanT89/tsdne_v1)

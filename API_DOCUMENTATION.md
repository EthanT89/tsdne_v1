# TSDNE API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Story Generation](#story-generation)
   - [Conversations](#conversations)
8. [WebSocket Streaming](#websocket-streaming)
9. [SDK and Examples](#sdk-and-examples)
10. [Changelog](#changelog)

## Overview

The TSDNE (This Story Does Not Exist) API provides endpoints for AI-powered interactive storytelling. The API allows users to generate stories, manage conversations, and track narrative progress through a RESTful interface with streaming capabilities.

### Key Features

- **AI-Powered Story Generation**: Generate unique narrative content based on user input
- **Conversation Management**: Track and manage multiple story sessions
- **Real-time Streaming**: Receive story content as it's generated
- **Context Awareness**: Maintain narrative continuity across interactions
- **Error Handling**: Comprehensive error responses with actionable feedback

## Authentication

Currently, the API is open and does not require authentication. This may change in future versions.

## Base URL

```
Development: http://localhost:5000
Production: https://api.tsdne.com (when deployed)
```

## Response Format

All API responses use JSON format with the following structure:

### Success Response
```json
{
  "data": {}, // Response data
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE (optional)",
  "details": {} // Additional error details (optional)
}
```

## Error Handling

The API uses standard HTTP status codes:

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "Input cannot be empty",
  "code": "VALIDATION_ERROR"
}
```

#### Rate Limit Error (429)
```json
{
  "error": "Too many requests. Please wait before trying again.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 60
  }
}
```

## Rate Limiting

- **Story Generation**: 10 requests per minute per IP
- **Other Endpoints**: 100 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Endpoints

### Health Check

Check if the API is running and healthy.

#### Request
```http
GET /health
```

#### Response
```json
{
  "status": "healthy",
  "message": "TSDNE API is running",
  "version": "1.0.0",
  "timestamp": "2025-01-05T12:00:00Z"
}
```

### Story Generation

Generate AI-powered story content based on user input.

#### Request
```http
POST /generate
Content-Type: application/json

{
  "input": "User's story input text",
  "conversation_id": 123 // Optional: continue existing conversation
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| input | string | Yes | User input text (1-1000 characters) |
| conversation_id | integer | No | ID of existing conversation to continue |

#### Response

**Streaming Response** (Content-Type: text/plain)

The response streams story content as it's generated:

```
Story content chunk 1...
Story content chunk 2...
More content...
<END>Full story content here
```

#### Headers

| Header | Description |
|--------|-------------|
| X-Conversation-ID | ID of the conversation (new or existing) |
| Content-Type | text/plain |

#### Example

```javascript
const response = await fetch('/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "I find myself in a mysterious forest..."
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  if (chunk.includes('<END>')) {
    // Story generation complete
    break;
  }
  
  console.log(chunk); // Display chunk to user
}
```

### Conversations

Manage story conversations and retrieve conversation history.

#### List Conversations

Get a list of recent conversations.

```http
GET /conversations
```

**Response:**
```json
{
  "conversations": [
    {
      "id": 123,
      "created_at": "2025-01-05T12:00:00Z",
      "updated_at": "2025-01-05T12:30:00Z",
      "message_count": 5
    }
  ]
}
```

#### Get Conversation

Retrieve a specific conversation with all messages.

```http
GET /conversations/{conversation_id}
```

**Response:**
```json
{
  "conversation": {
    "id": 123,
    "created_at": "2025-01-05T12:00:00Z",
    "updated_at": "2025-01-05T12:30:00Z",
    "message_count": 5
  },
  "messages": [
    {
      "id": 1,
      "conversation_id": 123,
      "role": "player",
      "text": "I explore the ancient ruins...",
      "created_at": "2025-01-05T12:00:00Z"
    },
    {
      "id": 2,
      "conversation_id": 123,
      "role": "ai",
      "text": "As you step through the crumbling archway...",
      "created_at": "2025-01-05T12:01:00Z"
    }
  ]
}
```

#### Delete Conversation

Delete a conversation and all its messages.

```http
DELETE /conversations/{conversation_id}
```

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

## WebSocket Streaming

For real-time bidirectional communication, you can use WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  // Send story input
  ws.send(JSON.stringify({
    type: 'generate',
    data: {
      input: "I venture into the unknown...",
      conversation_id: 123
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'story_chunk':
      console.log(message.data.chunk);
      break;
    case 'story_complete':
      console.log('Story generation complete');
      break;
    case 'error':
      console.error(message.data.error);
      break;
  }
};
```

## SDK and Examples

### JavaScript/TypeScript SDK

```bash
npm install @tsdne/api-client
```

```javascript
import { TSDNEClient } from '@tsdne/api-client';

const client = new TSDNEClient('http://localhost:5000');

// Generate story with streaming
const stream = await client.generateStory({
  input: "I discover a hidden door..."
});

for await (const chunk of stream) {
  console.log(chunk);
}

// Get conversations
const conversations = await client.getConversations();
console.log(conversations);
```

### Python SDK

```bash
pip install tsdne-client
```

```python
from tsdne_client import TSDNEClient

client = TSDNEClient('http://localhost:5000')

# Generate story
async for chunk in client.generate_story("I climb the mountain..."):
    print(chunk, end='')

# Get conversations
conversations = client.get_conversations()
print(conversations)
```

### cURL Examples

#### Generate Story
```bash
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "I enter the mysterious cave..."}' \
  --no-buffer
```

#### Get Conversations
```bash
curl http://localhost:5000/conversations
```

#### Delete Conversation
```bash
curl -X DELETE http://localhost:5000/conversations/123
```

## Input Validation

### Story Input Requirements

- **Length**: 1-1000 characters
- **Content**: Any text that can be interpreted as story input
- **Encoding**: UTF-8

### Input Sanitization

The API automatically:
- Trims whitespace
- Validates length
- Checks for potentially harmful content
- Escapes special characters for safety

## Performance Considerations

### Streaming Optimization

- Use streaming endpoints for real-time user experience
- Implement proper backpressure handling
- Consider client-side buffering for smooth display

### Caching

- Conversation data is cached for 24 hours
- Story generation responses are not cached (always unique)
- Health check responses are cached for 1 minute

### Timeouts

- Story generation: 30 seconds maximum
- Other endpoints: 10 seconds maximum
- WebSocket connections: 5 minutes idle timeout

## Security

### Input Validation

- All inputs are validated and sanitized
- SQL injection protection
- XSS prevention
- Rate limiting to prevent abuse

### Data Privacy

- No user data is stored permanently (configurable)
- Conversations can be automatically deleted after inactivity
- No personally identifiable information is logged

## Monitoring and Analytics

### Health Metrics

Monitor these endpoints for system health:

- `GET /health` - Basic health check
- `GET /metrics` - Detailed system metrics (if enabled)
- `GET /status` - Service status and dependencies

### Logging

The API logs:
- Request/response times
- Error rates
- Story generation metrics
- Rate limiting events

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Story generation endpoint
- Conversation management
- Streaming support
- Error handling
- Rate limiting

### Planned Features

- Authentication and user accounts
- Story templates and genres
- Advanced conversation management
- Multi-language support
- Story export functionality
- Analytics and insights

## Support

For API support and questions:

- Documentation: [https://docs.tsdne.com](https://docs.tsdne.com)
- GitHub Issues: [https://github.com/EthanT89/tsdne_v1/issues](https://github.com/EthanT89/tsdne_v1/issues)
- Email: support@tsdne.com

## License

This API is provided under the MIT License. See LICENSE file for details.
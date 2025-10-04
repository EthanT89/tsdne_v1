# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                   (React + TypeScript)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Title   │  │  Settings │  │  Output  │  │ UserInput  │ │
│  │Component │  │   Panel   │  │   Box    │  │ Component  │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            App.tsx (State Management)                    ││
│  │  - Messages State                                        ││
│  │  - Settings State (theme, font, speed)                   ││
│  │  - API Communication (fetch + streaming)                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            │ (POST /generate, GET /conversations)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                             │
│                     (Flask + Python)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                      app.py                              ││
│  │            Application Factory Pattern                   ││
│  │         create_app(config_name) → Flask App              ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                  │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼              │
│  ┌───────────┐      ┌──────────┐      ┌──────────┐         │
│  │ config.py │      │routes.py │      │models.py │         │
│  │           │      │          │      │          │         │
│  │Development│      │/generate │      │Conversation       │
│  │Production │      │/health   │      │Message   │         │
│  │Config     │      │/conversations   │          │         │
│  └───────────┘      └──────────┘      └──────────┘         │
│                            │                  │              │
│                            ▼                  │              │
│                     ┌──────────┐             │              │
│                     │database.py            │              │
│                     │    (db)   │            │              │
│                     └──────────┘             │              │
│                            │                  │              │
└────────────────────────────┼──────────────────┼─────────────┘
                             │                  │
         ┌───────────────────┼──────────────────┘
         │                   │
         ▼                   ▼
┌──────────────┐    ┌─────────────────┐
│   Claude     │    │    Database     │
│     API      │    │ (SQLite / PG)   │
│              │    │                 │
│ Claude 3.5   │    │ conversations   │
│ Sonnet       │    │ messages        │
└──────────────┘    └─────────────────┘
```

## Component Interactions

### 1. User Story Generation Flow

```
User Input
    │
    ▼
App.tsx (sendMessage)
    │
    ├─ Add message to state
    │
    ▼
POST /generate
    │
    ▼
routes.py (generate_response)
    │
    ├─ Save user message to DB
    ├─ Get conversation history
    ├─ Build AI prompt with context
    │
    ▼
Claude API (streaming)
    │
    ├─ Stream chunks back to frontend
    │
    ▼
App.tsx (stream handler)
    │
    ├─ Display chunks in real-time
    │
    ▼
routes.py
    │
    └─ Save AI response to DB
```

### 2. Data Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User types message
       ▼
┌─────────────┐
│  App.tsx    │  Messages: [{ role, text }]
└──────┬──────┘
       │
       │ 2. POST { input: "..." }
       ▼
┌─────────────┐
│ routes.py   │
│ /generate   │
└──────┬──────┘
       │
       │ 3. Store in DB
       ▼
┌─────────────┐
│  Database   │  Conversation → Messages
└──────┬──────┘
       │
       │ 4. Fetch history
       ▼
┌─────────────┐
│ routes.py   │  Build context
└──────┬──────┘
       │
       │ 5. Generate story
       ▼
┌─────────────┐
│   Claude    │  Claude 3.5 Sonnet
└──────┬──────┘
       │
       │ 6. Stream response
       ▼
┌─────────────┐
│  Browser    │  Display with animation
└─────────────┘
```

## Module Dependencies

```
app.py
  ├── config (Config classes)
  ├── database (db instance)
  ├── routes (register_routes)
  └── flask_cors (CORS)

routes.py
  ├── models (Conversation, Message)
  ├── database (db session)
  └── anthropic (Anthropic client)

models.py
  └── database (db instance)

database.py
  └── flask_sqlalchemy (SQLAlchemy)

config.py
  └── python-dotenv (load_dotenv)
```

## Database Schema

```sql
┌─────────────────────────────────────┐
│         conversations                │
├─────────────────────────────────────┤
│ id (PK)          INTEGER             │
│ created_at       DATETIME            │
│ updated_at       DATETIME            │
└───────────┬─────────────────────────┘
            │
            │ 1:N
            │
┌───────────▼─────────────────────────┐
│           messages                   │
├─────────────────────────────────────┤
│ id (PK)              INTEGER         │
│ conversation_id (FK) INTEGER         │
│ role                 VARCHAR(10)     │
│ text                 TEXT            │
│ created_at           DATETIME        │
└─────────────────────────────────────┘
```

## API Endpoints

### POST /generate
**Purpose:** Generate AI story response with streaming

**Request:**
```json
{
  "input": "I explore the ancient temple",
  "conversation_id": 123  // optional
}
```

**Response:** Text stream with chunks
```
You push open the heavy stone doors...
The air inside is thick with dust...
<END>Full text here
```

### GET /conversations
**Purpose:** List all conversation sessions

**Response:**
```json
[
  {
    "id": 1,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T11:45:00",
    "message_count": 15
  }
]
```

### GET /conversations/<id>
**Purpose:** Retrieve full conversation with messages

**Response:**
```json
{
  "id": 1,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T11:45:00",
  "messages": [
    {
      "id": 1,
      "role": "player",
      "text": "I want to explore a mysterious forest",
      "created_at": "2024-01-15T10:30:00"
    },
    {
      "id": 2,
      "role": "ai",
      "text": "You find yourself at the edge of...",
      "created_at": "2024-01-15T10:30:15"
    }
  ]
}
```

### GET /health
**Purpose:** Health check for monitoring

**Response:**
```json
{
  "status": "healthy"
}
```

## Configuration Environments

### Development
- SQLite database (file-based)
- Debug mode enabled
- Verbose error messages
- CORS: Allow all origins

### Production
- PostgreSQL database (server)
- Debug mode disabled
- Minimal error messages
- CORS: Specific origins only
- WSGI server (gunicorn)

## Technology Stack Details

### Frontend Stack
- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Heroicons** - Icons

### Backend Stack
- **Flask 3.1** - Web framework
- **Flask-SQLAlchemy** - ORM
- **Flask-CORS** - Cross-origin requests
- **Anthropic SDK** - AI integration
- **python-dotenv** - Environment variables

### Database Options
- **SQLite** - Development (file-based)
- **PostgreSQL** - Production (recommended)

### Deployment Options
- **Backend:** AWS Elastic Beanstalk, Heroku, DigitalOcean
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Database:** AWS RDS, Heroku Postgres, Supabase

## Security Considerations

1. **API Keys**
   - Never commit .env files
   - Use environment variables
   - Rotate keys regularly

2. **CORS**
   - Configure allowed origins in production
   - Don't allow * in production

3. **Database**
   - Use connection pooling
   - Validate all inputs
   - Use parameterized queries (SQLAlchemy handles this)

4. **Rate Limiting**
   - Consider adding Flask-Limiter
   - Protect against abuse
   - Monitor API usage

## Performance Optimizations

1. **Database**
   - Index conversation_id on messages table
   - Limit conversation history queries
   - Use connection pooling

2. **Frontend**
   - Lazy load components
   - Optimize bundle size
   - Use React.memo for expensive renders

3. **API**
   - Stream responses (already implemented)
   - Cache static content
   - Use CDN for frontend assets

## Monitoring & Observability

### Recommended Tools
- **Backend:** Flask logging, Sentry (errors)
- **Frontend:** Vercel Analytics, Sentry
- **Database:** Query performance monitoring
- **API:** Response times, error rates

### Key Metrics to Track
- API response times
- Claude API latency
- Database query performance
- Frontend load times
- Error rates by endpoint
- User session duration

## Scalability Considerations

### Current Limits
- Single server instance
- File-based SQLite (dev)
- No caching layer
- No load balancing

### Scaling Path
1. Move to PostgreSQL
2. Add Redis for caching
3. Implement horizontal scaling
4. Add load balancer
5. Use CDN for static assets
6. Consider serverless architecture

## Development Workflow

```
1. Clone repo
2. Backend setup (pip install)
3. Frontend setup (npm install)
4. Start backend (python app.py)
5. Start frontend (npm run dev)
6. Develop features
7. Test locally
8. Create PR
9. CI/CD runs tests
10. Deploy to staging
11. Test staging
12. Deploy to production
```

## Testing Strategy

### Unit Tests
- Test individual functions
- Mock database calls
- Mock Claude API

### Integration Tests
- Test API endpoints
- Test database operations
- Test with test database

### End-to-End Tests
- Test full user flows
- Test in real browsers
- Test with real API (test keys)

## Future Architecture Enhancements

1. **Microservices**
   - Separate AI service
   - Separate auth service
   - Message queue (RabbitMQ/Redis)

2. **Real-time Features**
   - WebSocket for live updates
   - Real-time collaboration
   - Live story sharing

3. **Advanced AI**
   - Multiple AI models
   - Custom fine-tuned models
   - AI memory/summarization system

4. **User Management**
   - Authentication service
   - User profiles
   - Story collections
   - Social features

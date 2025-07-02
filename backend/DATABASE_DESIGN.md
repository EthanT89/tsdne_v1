# Database Design Documentation

## Overview

This document outlines the enhanced database design for the story management system, addressing the requirements for user profiles, memory layers, and conversation history compaction.

## Architecture

The enhanced database design implements a multi-layered memory management system that balances storage efficiency with AI context quality.

### Core Principles

1. **Memory Layering**: Short-term, mid-term, and long-term memory management
2. **User-Centric Design**: Future-ready for authentication while supporting current session-based approach
3. **Story Continuity**: Persistent story sessions with context preservation
4. **Efficient AI Context**: Optimized prompt building with token management
5. **Scalable Architecture**: Designed to handle growing conversation histories

## Database Schema

### Users Table (`users`)

Manages user profiles and preferences. Future-ready for authentication integration.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) DEFAULT 'Adventurer',
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    preferred_story_length VARCHAR(20) DEFAULT 'medium',
    preferred_genres TEXT -- JSON array
);
```

**Purpose**: Central user management with session-based identification (for now) and preferences storage.

### Stories Table (`stories`)

Individual story sessions with metadata and state tracking.

```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200),
    genre VARCHAR(50),
    setting_summary TEXT,
    status VARCHAR(20) DEFAULT 'active',
    current_scene TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Organizes conversations into distinct story arcs with persistent metadata.

### Conversations Table (`conversations`)

Sessions within stories, allowing for natural conversation breaks.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id),
    session_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Groups messages into logical conversation sessions (e.g., separate gaming sessions).

### Messages Table (`messages`)

Enhanced message storage with memory classification and importance scoring.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(10) NOT NULL, -- 'player', 'ai', 'system'
    content TEXT NOT NULL,
    importance_score FLOAT DEFAULT 1.0, -- 0.0-10.0
    memory_type VARCHAR(20) DEFAULT 'short', -- 'short', 'medium', 'long', 'critical'
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_memory_type_importance ON messages(memory_type, importance_score);
```

**Purpose**: Core message storage with intelligent classification for memory management.

### Story Memories Table (`story_memories`)

Distilled story elements for long-term context without overwhelming the AI.

```sql
CREATE TABLE story_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id),
    memory_type VARCHAR(20) NOT NULL, -- 'character', 'location', 'event', 'rule', 'relationship'
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    importance_score FLOAT DEFAULT 5.0, -- 1.0-10.0
    relevance_tags TEXT, -- JSON array
    source_message_ids TEXT, -- JSON array of source message IDs
    created_from_conversation UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    last_referenced TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_story_memory_type ON story_memories(story_id, memory_type);
CREATE INDEX idx_importance_score ON story_memories(importance_score);
```

**Purpose**: Stores extracted story elements (characters, locations, events, rules) for efficient AI context building.

### Message Summaries Table (`message_summaries`)

Compressed conversation history for mid-term memory management.

```sql
CREATE TABLE message_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    summary_text TEXT NOT NULL,
    original_message_count INTEGER NOT NULL,
    start_message_id UUID,
    end_message_id UUID,
    time_range_start TIMESTAMP,
    time_range_end TIMESTAMP,
    compression_ratio FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Provides compressed conversation history when full message history becomes too large for AI context.

## Memory Management System

### Memory Layers

1. **Short-term Memory (2 hours)**: Recent messages, full detail
2. **Medium-term Memory (1-7 days)**: Summarized conversations
3. **Long-term Memory (permanent)**: Extracted story elements
4. **Critical Memory (permanent)**: High-importance elements that should always be available

### Importance Scoring

Messages are automatically scored (0.0-10.0) based on:

- **Player actions**: Generally important (base score: 3.0)
- **Action keywords**: Attack, cast, use, etc. (+1.0)
- **AI plot developments**: Sudden events, reveals (+2.0)
- **Response length**: Longer responses may contain more information (+0.5)

### Memory Classification

Messages are classified into memory types based on importance and age:

- **Critical**: Importance ≥ 7.0 (always kept)
- **Long**: Importance ≥ 5.0 (kept indefinitely)
- **Medium**: Age 2-24 hours (summarized after 24h)
- **Short**: Age < 2 hours (full detail)

## AI Context Building

### Context Structure

The AI receives optimized context in this priority order:

1. **Story Setup**: Title, genre, setting, current scene
2. **Important Memories**: Top-ranked story elements (characters, locations, events)
3. **Recent Summaries**: Compressed mid-term history
4. **Immediate Context**: Last 5-10 messages in full detail

### Token Management

Context is trimmed to stay within token limits (~2000 tokens):

1. Story setup (always included)
2. Recent context (last 5 messages)
3. Top 4 important memories
4. 2 most recent summaries

## Database Utilities

### ConversationCompactor

Automatically creates summaries when conversations exceed 20 messages:

- Extracts scene information
- Identifies important events
- Summarizes player actions
- Calculates compression ratios

### StoryMemoryExtractor

Extracts structured memories from conversations:

- **Characters**: Named entities and their roles
- **Locations**: Places visited or described
- **Events**: Significant plot developments
- **Rules**: World mechanics and constraints

### MemoryMaintenanceService

Periodic cleanup and optimization:

- Archives old, low-importance memories (30+ days, importance < 4.0)
- Updates importance scores based on access patterns
- Consolidates duplicate memories
- Optimizes database performance

## Migration Strategy

### From Basic Schema

The system includes migration tools to upgrade from the basic conversation/message schema:

1. **Backup**: Creates backup tables before migration
2. **User Creation**: Creates default users for existing data
3. **Story Creation**: Groups conversations into default stories
4. **Message Enhancement**: Adds importance scores and memory types
5. **Memory Extraction**: Generates initial story memories
6. **Rollback**: Ability to revert if migration fails

### Fresh Installation

For new installations:

1. Creates enhanced schema directly
2. Adds sample data for development
3. Sets up proper indexes and constraints

## API Endpoints

### User Management

- `POST /api/user/session` - Create or retrieve user session
- `GET /api/stories` - Get user's stories

### Story Management

- `POST /api/stories` - Create new story
- `POST /api/stories/{id}/generate` - Generate AI response with enhanced context
- `GET /api/stories/{id}/context` - Get current story context (debug)
- `GET /api/stories/{id}/memories` - Get story memories

### Maintenance

- `POST /api/maintenance/cleanup` - Run memory cleanup

## Performance Considerations

### Indexing Strategy

- Conversation + timestamp indexes for recent message queries
- Memory type + importance indexes for context building
- Story + memory type indexes for efficient memory retrieval

### Query Optimization

- Use of CTEs for complex memory queries
- Proper JOIN ordering for multi-table queries
- Pagination for large result sets

### Memory Management

- Automatic cleanup of old, unimportant memories
- Compression ratios to track storage efficiency
- Token estimation for context size management

## Future Enhancements

### Authentication Integration

The schema is designed to easily add authentication:

- Add `username`, `email`, `password_hash` to users table
- Keep `session_id` for guest users
- Add `auth_provider` for OAuth integration

### Advanced Memory Features

- Semantic similarity for memory consolidation
- Machine learning for importance scoring
- Temporal decay of memory importance
- Cross-story memory sharing for related narratives

### Analytics and Insights

- Story progression tracking
- User engagement metrics
- Memory effectiveness analysis
- AI response quality monitoring

## Security Considerations

### Data Privacy

- UUIDs prevent enumeration attacks
- Session-based isolation
- No sensitive data in memory extracts

### Database Security

- Prepared statements prevent SQL injection
- Role-based access control ready
- Audit logging capabilities

### API Security

- Rate limiting on generation endpoints
- Input validation and sanitization
- CORS configuration for frontend integration

## Monitoring and Maintenance

### Health Checks

- Database connection monitoring
- Memory usage tracking
- Cleanup job scheduling
- Performance metric collection

### Alerting

- Failed memory extractions
- Database size thresholds
- Long-running queries
- Memory cleanup failures

This enhanced database design provides a robust foundation for scalable story management while maintaining efficiency and performance.
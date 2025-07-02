# Quick Start Guide - Enhanced Database System

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements_enhanced.txt
```

### 2. Set Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///stories.db  # For development
# DATABASE_URL=postgresql://user:pass@localhost/stories  # For production
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Enhanced Application

```bash
python enhanced_app.py
```

The system will automatically:
- Create the enhanced database schema
- Migrate any existing data (if present)
- Set up sample data for testing

## 📡 API Usage

### Create User Session

```bash
curl -X POST http://localhost:5000/api/user/session \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user_001",
    "display_name": "Adventure Seeker",
    "preferred_story_length": "medium",
    "preferred_genres": ["fantasy", "adventure"]
  }'
```

### Create New Story

```bash
curl -X POST http://localhost:5000/api/stories \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user_001",
    "title": "The Mystic Quest",
    "genre": "fantasy",
    "setting_summary": "A world of magic and ancient mysteries"
  }'
```

### Generate Story Response

```bash
curl -X POST http://localhost:5000/api/stories/{story_id}/generate \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user_001",
    "input": "I explore the ancient castle ruins"
  }'
```

### Get Story Context (Debug)

```bash
curl "http://localhost:5000/api/stories/{story_id}/context?session_id=user_001"
```

### Get Story Memories

```bash
curl "http://localhost:5000/api/stories/{story_id}/memories?session_id=user_001&type=character"
```

## 🔧 Testing

Run the comprehensive test suite:

```bash
python test_enhanced_system.py
```

This will test all functionality including:
- Database schema creation
- Memory extraction and management
- Conversation summarization
- Context building
- API compatibility

## 📊 Monitoring

### Check Memory Usage

```bash
curl -X POST http://localhost:5000/api/maintenance/cleanup
```

Returns cleanup statistics and memory usage info.

### Database Status

The enhanced system provides better insight into story data:

- **User Stories**: See all stories per user
- **Memory Layers**: Track short/medium/long-term memories
- **Conversation Summaries**: Monitor compression ratios
- **Importance Scores**: Understand content priority

## 🔄 Migration from Old System

If you have existing data in the old format:

1. **Backup First**: The system creates automatic backups
2. **Run Enhanced App**: Migration happens automatically on first run
3. **Verify Data**: Check that conversations and messages migrated correctly
4. **Update Frontend**: Use new session-based API endpoints

### Migration Process

```bash
# The system will detect old schema and migrate automatically
python enhanced_app.py

# Or run migration manually
python migration_manager.py
```

## 📁 File Structure

```
backend/
├── enhanced_app.py           # Main application (use this instead of app.py)
├── enhanced_models.py        # Database models
├── memory_utils.py          # Memory management utilities
├── migration_manager.py     # Database migration tools
├── test_enhanced_system.py  # Test suite
├── DATABASE_DESIGN.md       # Technical documentation
├── IMPLEMENTATION_SUMMARY.md # Overview of features
└── requirements_enhanced.txt # Dependencies
```

## 🔍 Key Features

### Automatic Memory Management

The system automatically:
- **Scores message importance** based on content and context
- **Extracts story elements** (characters, locations, events, rules)
- **Summarizes conversations** when they get too long
- **Builds optimized AI context** within token limits

### Persistent Story Sessions

- **User profiles** with preferences
- **Story continuity** across multiple conversations
- **Session management** for natural conversation breaks
- **Memory preservation** for long-term storytelling

### Performance Optimization

- **Intelligent context building** prioritizes important information
- **Token management** keeps AI prompts efficient
- **Database indexing** for fast queries
- **Automatic cleanup** prevents storage bloat

## 🛠️ Customization

### Adjust Memory Thresholds

Edit `enhanced_models.py`:

```python
# Modify importance scoring in MemoryManager.classify_message_importance()
# Adjust memory type classification in determine_memory_type()
```

### Conversation Summary Triggers

Edit `enhanced_app.py`:

```python
def should_summarize_conversation(conversation_id):
    message_count = Message.query.filter_by(conversation_id=conversation_id).count()
    return message_count >= 20  # Change this threshold
```

### Context Token Limits

Edit context building in `memory_utils.py`:

```python
def build_prompt_context(story_id: str, max_tokens: int = 2000):  # Adjust max_tokens
```

## 🔐 Production Deployment

### Database Setup

For production, use PostgreSQL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/stories_db
```

### Security Considerations

- Set up proper CORS policies
- Add rate limiting to generation endpoints
- Implement proper authentication when ready
- Use environment variables for all secrets

### Monitoring

Monitor these metrics:
- Database size growth
- Memory extraction success rate
- Conversation compression ratios
- API response times
- User engagement patterns

## 🆘 Troubleshooting

### Common Issues

1. **Migration Errors**: Check database permissions and backup data first
2. **Memory Extraction Fails**: Verify OpenAI API key and check for content issues
3. **Context Too Large**: Adjust token limits or increase summarization frequency
4. **Slow Queries**: Check database indexes and consider adding more

### Debug Mode

Run with debug logging:

```bash
export FLASK_DEBUG=1
python enhanced_app.py
```

### Reset Database

For development testing:

```bash
rm stories.db  # Remove SQLite database
python enhanced_app.py  # Will recreate with sample data
```

## 📞 Support

The enhanced system includes:
- **Comprehensive test suite** for validation
- **Detailed documentation** in `DATABASE_DESIGN.md`
- **Migration tools** for safe upgrades
- **Rollback capabilities** if needed

For technical questions, refer to the implementation files and documentation. The codebase is thoroughly commented and tested.

**Happy storytelling! 📚✨**
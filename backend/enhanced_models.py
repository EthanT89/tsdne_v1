# enhanced_models.py
"""
Enhanced database models for story management with memory layers and user profiles.

This module provides a comprehensive database design for:
- User profiles (future-ready for authentication)
- Story sessions with persistent context
- Multi-layered memory management (short/mid/long term)
- Conversation history compaction and summarization
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from sqlalchemy import Text, Index, func, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import json

db = SQLAlchemy()

# Use String for UUID in SQLite, PostgreSQL UUID in production
def get_uuid_column():
    """Get appropriate UUID column type based on database."""
    return String(36)  # For SQLite compatibility


class User(db.Model):
    """
    User profiles for story management.
    Future-ready for authentication integration.
    """
    __tablename__ = 'users'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    # For now, we'll use session-based identification, later add username/email
    session_id = db.Column(db.String(255), unique=True, nullable=False)
    display_name = db.Column(db.String(100), default="Adventurer")
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Preferences
    preferred_story_length = db.Column(db.String(20), default="medium")  # short, medium, long
    preferred_genres = db.Column(Text)  # JSON array of preferred genres
    
    # Relationships
    stories = db.relationship('Story', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'session_id': self.session_id,
            'display_name': self.display_name,
            'created_at': self.created_at.isoformat(),
            'last_active': self.last_active.isoformat(),
            'preferred_story_length': self.preferred_story_length,
            'preferred_genres': json.loads(self.preferred_genres or '[]')
        }


class Story(db.Model):
    """
    Individual story sessions with metadata and state tracking.
    Each story represents a complete narrative arc.
    """
    __tablename__ = 'stories'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(get_uuid_column(), db.ForeignKey('users.id'), nullable=False)
    
    # Story metadata
    title = db.Column(db.String(200))  # Auto-generated or user-provided
    genre = db.Column(db.String(50))  # fantasy, sci-fi, horror, etc.
    setting_summary = db.Column(Text)  # Brief description of the world/setting
    
    # State tracking
    status = db.Column(db.String(20), default="active")  # active, paused, completed, archived
    current_scene = db.Column(Text)  # Current scene description for context
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    conversations = db.relationship('Conversation', backref='story', lazy=True, cascade='all, delete-orphan')
    memory_entries = db.relationship('StoryMemory', backref='story', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'title': self.title,
            'genre': self.genre,
            'setting_summary': self.setting_summary,
            'status': self.status,
            'current_scene': self.current_scene,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_message_at': self.last_message_at.isoformat()
        }


class Conversation(db.Model):
    """
    Updated conversation model linked to stories and users.
    Represents a single session within a story.
    """
    __tablename__ = 'conversations'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = db.Column(get_uuid_column(), db.ForeignKey('stories.id'), nullable=False)
    
    # Session metadata
    session_number = db.Column(db.Integer, default=1)  # For tracking story sessions
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')


class Message(db.Model):
    """
    Enhanced message model with memory classification and importance scoring.
    """
    __tablename__ = 'messages'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(get_uuid_column(), db.ForeignKey('conversations.id'), nullable=False)
    
    # Message content
    role = db.Column(db.String(10), nullable=False)  # "player", "ai", "system"
    content = db.Column(Text, nullable=False)
    
    # Memory classification
    importance_score = db.Column(db.Float, default=1.0)  # 0.0-10.0, higher = more important
    memory_type = db.Column(db.String(20), default="short")  # short, medium, long, critical
    
    # Metadata
    tokens_used = db.Column(db.Integer)  # For tracking API usage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Indexing for efficient queries
    __table_args__ = (
        Index('idx_conversation_created', 'conversation_id', 'created_at'),
        Index('idx_memory_type_importance', 'memory_type', 'importance_score'),
    )
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'conversation_id': str(self.conversation_id),
            'role': self.role,
            'content': self.content,
            'importance_score': self.importance_score,
            'memory_type': self.memory_type,
            'tokens_used': self.tokens_used,
            'created_at': self.created_at.isoformat()
        }


class StoryMemory(db.Model):
    """
    Distilled memory entries for long-term story context.
    Used to maintain story continuity without overwhelming the AI with full history.
    """
    __tablename__ = 'story_memories'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = db.Column(get_uuid_column(), db.ForeignKey('stories.id'), nullable=False)
    
    # Memory content
    memory_type = db.Column(db.String(20), nullable=False)  # character, location, event, rule, relationship
    title = db.Column(db.String(200), nullable=False)  # Brief title for the memory
    content = db.Column(Text, nullable=False)  # Summarized content
    
    # Importance and relevance
    importance_score = db.Column(db.Float, default=5.0)  # 1.0-10.0
    relevance_tags = db.Column(Text)  # JSON array of tags for quick filtering
    
    # Source tracking
    source_message_ids = db.Column(Text)  # JSON array of source message IDs
    created_from_conversation = db.Column(get_uuid_column())  # Source conversation
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_referenced = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Indexing
    __table_args__ = (
        Index('idx_story_memory_type', 'story_id', 'memory_type'),
        Index('idx_importance_score', 'importance_score'),
    )
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'story_id': str(self.story_id),
            'memory_type': self.memory_type,
            'title': self.title,
            'content': self.content,
            'importance_score': self.importance_score,
            'relevance_tags': json.loads(self.relevance_tags or '[]'),
            'source_message_ids': json.loads(self.source_message_ids or '[]'),
            'created_at': self.created_at.isoformat(),
            'last_referenced': self.last_referenced.isoformat()
        }


class MessageSummary(db.Model):
    """
    Summarized message blocks for efficient history management.
    Used to compress conversation history while preserving important context.
    """
    __tablename__ = 'message_summaries'
    
    id = db.Column(get_uuid_column(), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(get_uuid_column(), db.ForeignKey('conversations.id'), nullable=False)
    
    # Summary content
    summary_text = db.Column(Text, nullable=False)
    original_message_count = db.Column(db.Integer, nullable=False)
    
    # Range information
    start_message_id = db.Column(get_uuid_column())
    end_message_id = db.Column(get_uuid_column())
    time_range_start = db.Column(db.DateTime)
    time_range_end = db.Column(db.DateTime)
    
    # Metadata
    compression_ratio = db.Column(db.Float)  # original_length / summary_length
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'conversation_id': str(self.conversation_id),
            'summary_text': self.summary_text,
            'original_message_count': self.original_message_count,
            'compression_ratio': self.compression_ratio,
            'time_range_start': self.time_range_start.isoformat() if self.time_range_start else None,
            'time_range_end': self.time_range_end.isoformat() if self.time_range_end else None,
            'created_at': self.created_at.isoformat()
        }


# Utility functions for memory management
class MemoryManager:
    """
    Utility class for managing conversation history and memory layers.
    """
    
    @staticmethod
    def classify_message_importance(message_content, role):
        """
        Classify the importance of a message for memory retention.
        This is a simple heuristic that can be enhanced with ML models.
        """
        importance = 1.0  # Base importance
        
        if role == "player":
            # Player actions are generally important
            importance += 2.0
            
            # Check for important action keywords
            action_keywords = ["attack", "cast", "use", "go", "take", "say", "ask", "search", "open"]
            if any(keyword in message_content.lower() for keyword in action_keywords):
                importance += 1.0
                
        elif role == "ai":
            # AI responses with character interactions or plot developments
            plot_keywords = ["suddenly", "appears", "reveals", "discovers", "dies", "transforms"]
            if any(keyword in message_content.lower() for keyword in plot_keywords):
                importance += 2.0
            
            # Long responses might contain more important information
            if len(message_content) > 200:
                importance += 0.5
        
        return min(importance, 10.0)  # Cap at 10.0
    
    @staticmethod
    def determine_memory_type(importance_score, message_age_hours):
        """
        Determine the memory type based on importance and age.
        """
        if importance_score >= 7.0:
            return "critical"
        elif importance_score >= 5.0:
            return "long"
        elif message_age_hours <= 2:
            return "short"
        elif message_age_hours <= 24:
            return "medium"
        else:
            return "long"
    
    @staticmethod
    def get_context_for_ai(story_id, max_tokens=2000):
        """
        Build optimized context for AI prompts using memory layers.
        Returns a structured context that balances recency with importance.
        """
        story = Story.query.get(story_id)
        if not story:
            return {"error": "Story not found"}
        
        context = {
            "story_metadata": {
                "title": story.title,
                "genre": story.genre,
                "setting": story.setting_summary,
                "current_scene": story.current_scene
            },
            "recent_messages": [],
            "important_memories": [],
            "summary": []
        }
        
        # Get recent messages (short-term memory)
        recent_messages = db.session.query(Message)\
            .join(Conversation)\
            .filter(Conversation.story_id == story_id)\
            .filter(Message.created_at >= datetime.utcnow() - timedelta(hours=2))\
            .order_by(Message.created_at.desc())\
            .limit(10)\
            .all()
        
        context["recent_messages"] = [msg.to_dict() for msg in recent_messages]
        
        # Get important memories (long-term memory)
        important_memories = StoryMemory.query\
            .filter_by(story_id=story_id)\
            .filter(StoryMemory.importance_score >= 6.0)\
            .order_by(StoryMemory.importance_score.desc())\
            .limit(5)\
            .all()
        
        context["important_memories"] = [mem.to_dict() for mem in important_memories]
        
        # Get recent summaries (medium-term memory)
        summaries = db.session.query(MessageSummary)\
            .join(Conversation)\
            .filter(Conversation.story_id == story_id)\
            .filter(MessageSummary.time_range_end >= datetime.utcnow() - timedelta(days=1))\
            .order_by(MessageSummary.time_range_end.desc())\
            .limit(3)\
            .all()
        
        context["summary"] = [summ.to_dict() for summ in summaries]
        
        return context
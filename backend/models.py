"""
Database models for the TSDNE application.

This module contains all database models and related functionality.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

# Initialize SQLAlchemy instance
db = SQLAlchemy()


class Conversation(db.Model):
    """Model representing a conversation/story session."""
    
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationship to messages
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self) -> str:
        return f'<Conversation {self.id}>'
    
    def to_dict(self) -> dict:
        """Convert conversation to dictionary representation."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'message_count': len(self.messages) if self.messages else 0
        }
    
    @classmethod
    def get_recent_conversations(cls, limit: int = 10) -> List['Conversation']:
        """Get the most recent conversations."""
        return cls.query.order_by(cls.updated_at.desc()).limit(limit).all()


class Message(db.Model):
    """Model representing a message in a conversation."""
    
    __tablename__ = 'messages'
    
    # Valid message roles
    ROLE_PLAYER = 'player'
    ROLE_AI = 'ai'
    VALID_ROLES = [ROLE_PLAYER, ROLE_AI]
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, 
        db.ForeignKey('conversations.id'), 
        nullable=False
    )
    role = db.Column(db.String(10), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self) -> str:
        return f'<Message {self.id} - {self.role}>'
    
    def to_dict(self) -> dict:
        """Convert message to dictionary representation."""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'text': self.text,
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def create_message(cls, conversation_id: int, role: str, text: str) -> 'Message':
        """Create a new message with validation."""
        if role not in cls.VALID_ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {cls.VALID_ROLES}")
        
        if not text or not text.strip():
            raise ValueError("Message text cannot be empty")
        
        return cls(
            conversation_id=conversation_id,
            role=role,
            text=text.strip()
        )


def init_db(app) -> None:
    """Initialize the database with the Flask app."""
    db.init_app(app)
    
    with app.app_context():
        db.create_all()


def get_conversation_history(conversation_id: int, limit: Optional[int] = None) -> List[Message]:
    """Get conversation history for a given conversation ID."""
    query = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at)
    
    if limit:
        query = query.limit(limit)
    
    return query.all()


def cleanup_old_conversations(days_old: int = 30) -> int:
    """Clean up conversations older than specified days."""
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    old_conversations = Conversation.query.filter(
        Conversation.updated_at < cutoff_date
    ).all()
    
    count = len(old_conversations)
    
    for conversation in old_conversations:
        db.session.delete(conversation)
    
    db.session.commit()
    return count

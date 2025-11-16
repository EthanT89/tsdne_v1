from models import Conversation, Message
from database import db
import pytest

def test_conversation_creation(app):
    """Test conversation model creation"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()

        assert conv.id is not None
        assert conv.created_at is not None
        assert conv.updated_at is not None

def test_message_creation(app, sample_conversation):
    """Test message model creation"""
    with app.app_context():
        msg = Message(
            conversation_id=sample_conversation.id,
            role='player',
            text='Test message'
        )
        db.session.add(msg)
        db.session.commit()

        assert msg.id is not None
        assert msg.role == 'player'
        assert msg.text == 'Test message'

def test_conversation_messages_relationship(app, sample_conversation):
    """Test conversation-messages relationship"""
    with app.app_context():
        conv = Conversation.query.get(sample_conversation.id)
        assert len(conv.messages) == 2
        assert conv.messages[0].role in ['player', 'ai']
        assert conv.messages[1].role in ['player', 'ai']

def test_message_requires_conversation_id(app):
    """Test that message requires a conversation_id"""
    with app.app_context():
        msg = Message(role='player', text='Test')
        db.session.add(msg)

        # This should raise an error due to foreign key constraint
        with pytest.raises(Exception):
            db.session.commit()

def test_multiple_conversations(app):
    """Test creating multiple conversations"""
    with app.app_context():
        conv1 = Conversation()
        conv2 = Conversation()
        db.session.add_all([conv1, conv2])
        db.session.commit()

        assert conv1.id != conv2.id
        assert conv1.id is not None
        assert conv2.id is not None

def test_conversation_cascade_delete(app, sample_conversation):
    """Test that deleting a conversation deletes its messages"""
    with app.app_context():
        conv_id = sample_conversation.id

        # Verify messages exist
        messages = Message.query.filter_by(conversation_id=conv_id).all()
        assert len(messages) == 2

        # Delete conversation
        conv = Conversation.query.get(conv_id)
        db.session.delete(conv)
        db.session.commit()

        # Verify messages are deleted
        messages_after = Message.query.filter_by(conversation_id=conv_id).all()
        assert len(messages_after) == 0

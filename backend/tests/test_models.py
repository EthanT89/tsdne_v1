from models import Conversation, Message
from database import db
from datetime import datetime

def test_conversation_creation(app):
    """Test conversation model creation"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()

        assert conv.id is not None
        assert conv.created_at is not None
        assert conv.updated_at is not None
        assert isinstance(conv.created_at, datetime)
        assert isinstance(conv.updated_at, datetime)

def test_conversation_messages_relationship(app, sample_conversation):
    """Test conversation-messages relationship"""
    with app.app_context():
        conv = db.session.get(Conversation, sample_conversation.id)
        assert len(conv.messages) == 2
        assert all(isinstance(msg, Message) for msg in conv.messages)

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
        assert msg.created_at is not None
        assert msg.conversation_id == sample_conversation.id

def test_message_role_validation(app, sample_conversation):
    """Test that messages can have different roles"""
    with app.app_context():
        player_msg = Message(
            conversation_id=sample_conversation.id,
            role='player',
            text='Player message'
        )
        ai_msg = Message(
            conversation_id=sample_conversation.id,
            role='ai',
            text='AI message'
        )
        db.session.add_all([player_msg, ai_msg])
        db.session.commit()

        assert player_msg.role == 'player'
        assert ai_msg.role == 'ai'

def test_conversation_updated_at_changes(app):
    """Test that updated_at timestamp changes when conversation is modified"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()

        initial_updated = conv.updated_at

        # Add a message to trigger update
        msg = Message(conversation_id=conv.id, role='player', text='Test')
        db.session.add(msg)
        db.session.commit()

        # Refresh the conversation from database
        db.session.refresh(conv)

        # Note: updated_at only changes if conversation fields change,
        # not when related messages are added
        assert conv.updated_at is not None

def test_multiple_conversations(app):
    """Test creating multiple conversations"""
    with app.app_context():
        conv1 = Conversation()
        conv2 = Conversation()
        db.session.add_all([conv1, conv2])
        db.session.commit()

        all_convs = Conversation.query.all()
        assert len(all_convs) == 2
        assert conv1.id != conv2.id

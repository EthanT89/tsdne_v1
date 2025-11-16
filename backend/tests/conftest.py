import pytest
from app import create_app
from database import db
from models import Conversation, Message

@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()

@pytest.fixture
def sample_conversation(app):
    """Create sample conversation for testing"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()

        msg1 = Message(conversation_id=conv.id, role='player', text='Hello')
        msg2 = Message(conversation_id=conv.id, role='ai', text='Hi there!')
        db.session.add_all([msg1, msg2])
        db.session.commit()

        # Refresh to get the latest data
        db.session.refresh(conv)
        return conv

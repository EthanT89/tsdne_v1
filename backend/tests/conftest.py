import pytest
from app import create_app
from database import db
from models import Conversation, Message

@pytest.fixture
def app():
    """Create and configure a test application instance"""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client for the app"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test CLI runner"""
    return app.test_cli_runner()

@pytest.fixture
def sample_conversation(app):
    """Create a sample conversation with messages for testing"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()
        conv_id = conv.id

        msg1 = Message(conversation_id=conv_id, role='player', text='Hello')
        msg2 = Message(conversation_id=conv_id, role='ai', text='Hi there!')
        db.session.add_all([msg1, msg2])
        db.session.commit()

        # Create a simple object to return the ID
        class ConvData:
            id = conv_id

        return ConvData()

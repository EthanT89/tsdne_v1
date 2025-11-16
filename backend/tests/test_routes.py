import json
from unittest.mock import patch, MagicMock
from models import Conversation, Message
from database import db

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {'status': 'healthy'}

def test_list_conversations_empty(client):
    """Test listing conversations when none exist"""
    response = client.get('/conversations')
    assert response.status_code == 200
    assert response.json == []

def test_list_conversations_with_data(client, sample_conversation):
    """Test listing conversations with data"""
    response = client.get('/conversations')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['id'] == sample_conversation.id
    assert response.json[0]['message_count'] == 2
    assert 'created_at' in response.json[0]
    assert 'updated_at' in response.json[0]

def test_get_conversation_by_id(client, sample_conversation):
    """Test getting specific conversation"""
    response = client.get(f'/conversations/{sample_conversation.id}')
    assert response.status_code == 200
    data = response.json
    assert data['id'] == sample_conversation.id
    assert len(data['messages']) == 2
    assert data['messages'][0]['role'] == 'player'
    assert data['messages'][0]['text'] == 'Hello'
    assert data['messages'][1]['role'] == 'ai'
    assert data['messages'][1]['text'] == 'Hi there!'

def test_get_nonexistent_conversation(client):
    """Test getting conversation that doesn't exist"""
    response = client.get('/conversations/999')
    assert response.status_code == 404
    assert 'error' in response.json

def test_delete_conversation(client, sample_conversation):
    """Test deleting a conversation"""
    conv_id = sample_conversation.id
    response = client.delete(f'/conversations/{conv_id}')
    assert response.status_code == 200
    assert 'message' in response.json

    # Verify conversation was deleted
    response = client.get(f'/conversations/{conv_id}')
    assert response.status_code == 404

def test_delete_nonexistent_conversation(client):
    """Test deleting a conversation that doesn't exist"""
    response = client.delete('/conversations/999')
    assert response.status_code == 404
    assert 'error' in response.json

def test_delete_conversation_cascade(client, app, sample_conversation):
    """Test that deleting a conversation also deletes its messages"""
    with app.app_context():
        conv_id = sample_conversation.id
        # Verify messages exist before deletion
        messages_before = Message.query.filter_by(conversation_id=conv_id).all()
        assert len(messages_before) == 2

    response = client.delete(f'/conversations/{conv_id}')
    assert response.status_code == 200

    with app.app_context():
        # Verify messages are deleted
        messages_after = Message.query.filter_by(conversation_id=conv_id).all()
        assert len(messages_after) == 0

@patch('routes.client')
def test_generate_response_new_conversation(mock_openai, client, app):
    """Test generating response for new conversation"""
    # Mock OpenAI streaming response
    mock_chunk1 = MagicMock()
    mock_chunk1.choices = [MagicMock()]
    mock_chunk1.choices[0].delta.content = 'Test '

    mock_chunk2 = MagicMock()
    mock_chunk2.choices = [MagicMock()]
    mock_chunk2.choices[0].delta.content = 'response'

    mock_chunk3 = MagicMock()
    mock_chunk3.choices = [MagicMock()]
    mock_chunk3.choices[0].delta.content = None

    mock_openai.chat.completions.create.return_value = [
        mock_chunk1, mock_chunk2, mock_chunk3
    ]

    response = client.post('/generate',
        json={'input': 'Test input'},
        headers={'Content-Type': 'application/json'}
    )

    assert response.status_code == 200

    # Verify conversation and messages were created
    with app.app_context():
        conversations = Conversation.query.all()
        assert len(conversations) == 1

        messages = Message.query.all()
        assert len(messages) == 2
        assert messages[0].role == 'player'
        assert messages[0].text == 'Test input'
        assert messages[1].role == 'ai'

@patch('routes.client')
def test_generate_response_existing_conversation(mock_openai, client, app, sample_conversation):
    """Test generating response for existing conversation"""
    # Mock OpenAI streaming response
    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock()]
    mock_chunk.choices[0].delta.content = 'Response'

    mock_chunk_end = MagicMock()
    mock_chunk_end.choices = [MagicMock()]
    mock_chunk_end.choices[0].delta.content = None

    mock_openai.chat.completions.create.return_value = [
        mock_chunk, mock_chunk_end
    ]

    response = client.post('/generate',
        json={
            'input': 'Follow-up message',
            'conversation_id': sample_conversation.id
        },
        headers={'Content-Type': 'application/json'}
    )

    assert response.status_code == 200

    # Verify new messages were added to existing conversation
    with app.app_context():
        conversations = Conversation.query.all()
        assert len(conversations) == 1

        messages = Message.query.filter_by(
            conversation_id=sample_conversation.id
        ).all()
        assert len(messages) == 4  # 2 original + 1 player + 1 ai

def test_generate_response_missing_input(client):
    """Test generating response without input"""
    response = client.post('/generate',
        json={},
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400
    assert 'error' in response.json

def test_generate_response_empty_input(client):
    """Test generating response with empty input"""
    response = client.post('/generate',
        json={'input': ''},
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400
    assert 'error' in response.json

def test_generate_response_invalid_conversation_id(client):
    """Test generating response with invalid conversation ID"""
    response = client.post('/generate',
        json={
            'input': 'Test',
            'conversation_id': 999
        },
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 404
    assert 'error' in response.json

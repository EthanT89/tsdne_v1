"""
Unit tests for the TSDNE application.

This module contains comprehensive unit tests for all components.
"""

import pytest
import json
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from flask import Flask
from models import db, Conversation, Message
from services import StoryService, ValidationService, StoryGenerationError
from config_new import TestingConfig


class TestConfig:
    """Test configuration class."""
    
    def test_config_creation(self):
        """Test configuration creation."""
        config = TestingConfig()
        assert config.TESTING is True
        assert config.DATABASE_URL == "sqlite:///:memory:"
        assert config.OPENAI_API_KEY == "test-api-key"
    
    def test_config_validation(self):
        """Test configuration validation."""
        config = TestingConfig()
        # Should not raise any exception
        config.validate_config()
        
        # Test with missing API key by creating a temporary config
        class TempConfig(TestingConfig):
            OPENAI_API_KEY = None
        
        temp_config = TempConfig()
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            temp_config.validate_config()


class TestModels:
    """Test database models."""
    
    @pytest.fixture
    def app(self):
        """Create test app."""
        from app_new import create_app
        
        # Set test environment variable
        os.environ['OPENAI_API_KEY'] = 'test-api-key'
        os.environ['FLASK_ENV'] = 'testing'
        
        app = create_app()
        app.config.from_object(TestingConfig)
        
        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()
    
    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return app.test_client()
    
    def test_conversation_creation(self, app):
        """Test conversation model creation."""
        with app.app_context():
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            
            assert conversation.id is not None
            assert conversation.created_at is not None
            assert conversation.updated_at is not None
    
    def test_conversation_to_dict(self, app):
        """Test conversation to dictionary conversion."""
        with app.app_context():
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            
            conv_dict = conversation.to_dict()
            assert 'id' in conv_dict
            assert 'created_at' in conv_dict
            assert 'updated_at' in conv_dict
            assert 'message_count' in conv_dict
    
    def test_message_creation(self, app):
        """Test message model creation."""
        with app.app_context():
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            
            message = Message.create_message(
                conversation.id, 
                Message.ROLE_PLAYER, 
                "Test message"
            )
            db.session.add(message)
            db.session.commit()
            
            assert message.id is not None
            assert message.role == Message.ROLE_PLAYER
            assert message.text == "Test message"
    
    def test_message_validation(self, app):
        """Test message validation."""
        with app.app_context():
            # Test invalid role
            with pytest.raises(ValueError, match="Invalid role"):
                Message.create_message(1, "invalid_role", "Test message")
            
            # Test empty text
            with pytest.raises(ValueError, match="Message text cannot be empty"):
                Message.create_message(1, Message.ROLE_PLAYER, "")
            
            # Test whitespace-only text
            with pytest.raises(ValueError, match="Message text cannot be empty"):
                Message.create_message(1, Message.ROLE_PLAYER, "   ")
    
    def test_message_to_dict(self, app):
        """Test message to dictionary conversion."""
        with app.app_context():
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            
            message = Message.create_message(
                conversation.id, 
                Message.ROLE_PLAYER, 
                "Test message"
            )
            db.session.add(message)
            db.session.commit()
            
            msg_dict = message.to_dict()
            assert 'id' in msg_dict
            assert 'conversation_id' in msg_dict
            assert 'role' in msg_dict
            assert 'text' in msg_dict
            assert 'created_at' in msg_dict


class TestValidationService:
    """Test validation service."""
    
    def test_validate_user_input(self):
        """Test user input validation."""
        service = ValidationService()
        
        # Valid input
        result = service.validate_user_input("  Hello world  ")
        assert result == "Hello world"
        
        # Empty input
        with pytest.raises(ValueError, match="Input cannot be empty"):
            service.validate_user_input("")
        
        # Whitespace only
        with pytest.raises(ValueError, match="Input cannot be empty"):
            service.validate_user_input("   ")
        
        # None input
        with pytest.raises(ValueError, match="Input cannot be empty"):
            service.validate_user_input(None)
        
        # Too long input
        long_input = "a" * 1001
        with pytest.raises(ValueError, match="Input too long"):
            service.validate_user_input(long_input)
    
    def test_validate_conversation_id(self):
        """Test conversation ID validation."""
        service = ValidationService()
        
        # Valid ID
        result = service.validate_conversation_id("123")
        assert result == 123
        
        # Valid integer
        result = service.validate_conversation_id(456)
        assert result == 456
        
        # Invalid ID
        with pytest.raises(ValueError, match="must be a valid integer"):
            service.validate_conversation_id("abc")
        
        # Negative ID
        with pytest.raises(ValueError, match="must be positive"):
            service.validate_conversation_id("-1")
        
        # Zero ID
        with pytest.raises(ValueError, match="must be positive"):
            service.validate_conversation_id("0")
        
        # None ID
        with pytest.raises(ValueError, match="Conversation ID is required"):
            service.validate_conversation_id(None)


class TestStoryService:
    """Test story service."""
    
    @pytest.fixture
    def app(self):
        """Create test app."""
        from app_new import create_app
        
        # Set test environment variable
        os.environ['OPENAI_API_KEY'] = 'test-api-key'
        os.environ['FLASK_ENV'] = 'testing'
        
        app = create_app()
        app.config.from_object(TestingConfig)
        
        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()
    
    @pytest.fixture
    def story_service(self, app):
        """Create story service."""
        with app.app_context():
            config = TestingConfig()
            return StoryService(config)
    
    def test_create_conversation(self, app, story_service):
        """Test conversation creation."""
        with app.app_context():
            conversation = story_service.create_conversation()
            assert conversation.id is not None
            assert isinstance(conversation, Conversation)
    
    def test_save_message(self, app, story_service):
        """Test message saving."""
        with app.app_context():
            conversation = story_service.create_conversation()
            message = story_service.save_message(
                conversation.id, 
                Message.ROLE_PLAYER, 
                "Test message"
            )
            assert message.id is not None
            assert message.text == "Test message"
    
    @patch('services.OpenAI')
    def test_generate_story_response(self, mock_openai, app, story_service):
        """Test story response generation."""
        with app.app_context():
            # Mock OpenAI response
            mock_chunk = Mock()
            mock_chunk.choices = [Mock()]
            mock_chunk.choices[0].delta.content = "Test response"
            
            mock_response = [mock_chunk]
            mock_openai.return_value.chat.completions.create.return_value = mock_response
            
            conversation = story_service.create_conversation()
            
            # Generate response
            response_generator = story_service.generate_story_response(
                "Test input", 
                conversation.id
            )
            
            # Collect response chunks
            chunks = list(response_generator)
            assert len(chunks) > 0
            assert "Test response" in chunks[0]


class TestAPIRoutes:
    """Test API routes."""
    
    @pytest.fixture
    def app(self):
        """Create test app."""
        from app_new import create_app
        
        # Set test environment variable
        os.environ['OPENAI_API_KEY'] = 'test-api-key'
        os.environ['FLASK_ENV'] = 'testing'
        
        app = create_app()
        app.config.from_object(TestingConfig)
        
        with app.app_context():
            db.create_all()
            yield app
            db.drop_all()
    
    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return app.test_client()
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get('/')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'message' in data
        assert 'version' in data
    
    def test_api_health_check(self, client):
        """Test API health check endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'message' in data
    
    def test_get_conversations(self, client):
        """Test get conversations endpoint."""
        response = client.get('/conversations')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'conversations' in data
        assert isinstance(data['conversations'], list)
    
    @patch('routes_new.get_story_service')
    def test_generate_story_valid_input(self, mock_service, client):
        """Test story generation with valid input."""
        # Mock the story service
        mock_service_instance = Mock()
        mock_service_instance.create_conversation.return_value = Mock(id=1)
        mock_service_instance.save_message.return_value = Mock()
        mock_service_instance.generate_story_response.return_value = iter(["Test response"])
        mock_service.return_value = mock_service_instance
        
        response = client.post('/generate', 
                              json={'input': 'Test input'})
        
        assert response.status_code == 200
        assert response.content_type == 'text/plain; charset=utf-8'
    
    def test_generate_story_invalid_input(self, client):
        """Test story generation with invalid input."""
        # Empty input
        response = client.post('/generate', json={'input': ''})
        assert response.status_code == 400
        
        # No input
        response = client.post('/generate', json={})
        assert response.status_code == 400
        
        # No JSON
        response = client.post('/generate')
        assert response.status_code == 400


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
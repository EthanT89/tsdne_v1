"""
API routes for the TSDNE application.

This module contains all API endpoints and routing logic.
"""

import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context
from services import get_story_service, get_validation_service, StoryGenerationError
from models import Message
from config_new import Config

logger = logging.getLogger(__name__)

# Create blueprint for API routes
api_bp = Blueprint('api', __name__)

# Initialize services
validation_service = get_validation_service()


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'TSDNE API is running'
    }), 200


@api_bp.route('/generate', methods=['POST'])
def generate_story():
    """
    Generate a story response based on user input.
    
    Expected JSON payload:
    {
        "input": "user input text",
        "conversation_id": optional_conversation_id
    }
    
    Returns:
        Streaming response with generated story content
    """
    try:
        # Parse and validate request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate user input
        user_input = data.get('input', '')
        try:
            user_input = validation_service.validate_user_input(user_input)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Get configuration and create story service
        config = Config()
        story_service = get_story_service(config)
        
        # Handle conversation ID
        conversation_id = data.get('conversation_id')
        if conversation_id:
            try:
                conversation_id = validation_service.validate_conversation_id(conversation_id)
            except ValueError as e:
                return jsonify({'error': str(e)}), 400
        else:
            # Create new conversation
            conversation = story_service.create_conversation()
            conversation_id = conversation.id
        
        # Save user message
        story_service.save_message(conversation_id, Message.ROLE_PLAYER, user_input)
        
        # Generate streaming response
        def generate_stream():
            try:
                for chunk in story_service.generate_story_response(user_input, conversation_id):
                    yield chunk
            except StoryGenerationError as e:
                logger.error(f"Story generation error: {str(e)}")
                yield f"ERROR: {str(e)}"
            except Exception as e:
                logger.error(f"Unexpected error in story generation: {str(e)}")
                yield f"ERROR: An unexpected error occurred"
        
        return Response(
            stream_with_context(generate_stream()),
            content_type='text/plain',
            headers={'X-Conversation-ID': str(conversation_id)}
        )
        
    except Exception as e:
        logger.error(f"Error in generate_story endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Get recent conversations."""
    try:
        from models import Conversation
        conversations = Conversation.get_recent_conversations(limit=10)
        return jsonify({
            'conversations': [conv.to_dict() for conv in conversations]
        }), 200
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversations'}), 500


@api_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get a specific conversation with its messages."""
    try:
        # Validate conversation ID
        conversation_id = validation_service.validate_conversation_id(conversation_id)
        
        # Get configuration and create story service
        config = Config()
        story_service = get_story_service(config)
        
        # Get conversation with messages
        result = story_service.get_conversation_with_messages(conversation_id)
        if not result:
            return jsonify({'error': 'Conversation not found'}), 404
        
        conversation, messages = result
        
        return jsonify({
            'conversation': conversation.to_dict(),
            'messages': [msg.to_dict() for msg in messages]
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error fetching conversation {conversation_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversation'}), 500


@api_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation and all its messages."""
    try:
        # Validate conversation ID
        conversation_id = validation_service.validate_conversation_id(conversation_id)
        
        from models import Conversation, db
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        db.session.delete(conversation)
        db.session.commit()
        
        logger.info(f"Deleted conversation {conversation_id}")
        return jsonify({'message': 'Conversation deleted successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete conversation'}), 500


@api_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@api_bp.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return jsonify({'error': 'Method not allowed'}), 405


@api_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


def register_routes(app):
    """Register all routes with the Flask app."""
    app.register_blueprint(api_bp)
    logger.info("API routes registered successfully")
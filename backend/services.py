"""
Business logic services for the TSDNE application.

This module contains all business logic separated from routing and database concerns.
"""

import time
import logging
from typing import Generator, Optional, Tuple
from openai import OpenAI
from config_new import Config
from models import db, Conversation, Message

logger = logging.getLogger(__name__)


class StoryGenerationError(Exception):
    """Custom exception for story generation errors."""
    pass


class StoryService:
    """Service class for handling story generation logic."""
    
    def __init__(self, config: Config):
        """Initialize the story service with configuration."""
        self.config = config
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)
    
    def create_conversation(self) -> Conversation:
        """Create a new conversation and save it to database."""
        try:
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            logger.info(f"Created new conversation with ID: {conversation.id}")
            return conversation
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            db.session.rollback()
            raise StoryGenerationError(f"Failed to create conversation: {str(e)}")
    
    def save_message(self, conversation_id: int, role: str, text: str) -> Message:
        """Save a message to the database."""
        try:
            message = Message.create_message(conversation_id, role, text)
            db.session.add(message)
            db.session.commit()
            logger.info(f"Saved {role} message for conversation {conversation_id}")
            return message
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            db.session.rollback()
            raise StoryGenerationError(f"Failed to save message: {str(e)}")
    
    def generate_story_response(self, user_input: str, conversation_id: int) -> Generator[str, None, None]:
        """
        Generate a story response using OpenAI API.
        
        Args:
            user_input: The user's input text
            conversation_id: The conversation ID for context
            
        Yields:
            Chunks of the generated story response
            
        Raises:
            StoryGenerationError: If story generation fails
        """
        try:
            # Get the system prompt
            system_prompt = self.config.get_system_prompt()
            
            # Create the messages for the API call
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Reader's input: {user_input}"}
            ]
            
            # Make the API call with streaming
            response = self.client.chat.completions.create(
                model=self.config.OPENAI_MODEL,
                messages=messages,
                max_tokens=self.config.STORY_MAX_TOKENS,
                stream=True
            )
            
            full_text = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_text += content
                    yield content
                    time.sleep(self.config.STORY_STREAM_DELAY)
            
            # Save the AI response to database
            if full_text:
                self.save_message(conversation_id, Message.ROLE_AI, full_text)
            
            # Yield the end marker with full text
            yield f"\n<END>{full_text}"
            
        except Exception as e:
            logger.error(f"Error generating story response: {str(e)}")
            raise StoryGenerationError(f"Failed to generate story: {str(e)}")
    
    def get_conversation_with_messages(self, conversation_id: int) -> Optional[Tuple[Conversation, list]]:
        """Get a conversation with its messages."""
        try:
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                return None
            
            messages = Message.query.filter_by(conversation_id=conversation_id)\
                             .order_by(Message.created_at)\
                             .all()
            
            return conversation, messages
        except Exception as e:
            logger.error(f"Error fetching conversation {conversation_id}: {str(e)}")
            return None


class ValidationService:
    """Service class for input validation."""
    
    @staticmethod
    def validate_user_input(user_input: str) -> str:
        """
        Validate and sanitize user input.
        
        Args:
            user_input: The raw user input
            
        Returns:
            Cleaned and validated input
            
        Raises:
            ValueError: If input is invalid
        """
        if not user_input:
            raise ValueError("Input cannot be empty")
        
        # Strip whitespace
        cleaned_input = user_input.strip()
        
        if not cleaned_input:
            raise ValueError("Input cannot be empty")
        
        # Check length limits
        if len(cleaned_input) > 1000:
            raise ValueError("Input too long (max 1000 characters)")
        
        if len(cleaned_input) < 1:
            raise ValueError("Input too short (min 1 character)")
        
        return cleaned_input
    
    @staticmethod
    def validate_conversation_id(conversation_id: any) -> int:
        """
        Validate conversation ID.
        
        Args:
            conversation_id: The conversation ID to validate
            
        Returns:
            Validated conversation ID as integer
            
        Raises:
            ValueError: If conversation ID is invalid
        """
        if not conversation_id:
            raise ValueError("Conversation ID is required")
        
        try:
            conv_id = int(conversation_id)
        except (ValueError, TypeError):
            raise ValueError("Conversation ID must be a valid integer")
        
        if conv_id <= 0:
            raise ValueError("Conversation ID must be positive")
        
        return conv_id


def get_story_service(config: Config) -> StoryService:
    """Factory function to create a StoryService instance."""
    return StoryService(config)


def get_validation_service() -> ValidationService:
    """Factory function to create a ValidationService instance."""
    return ValidationService()
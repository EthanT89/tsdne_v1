"""
Configuration management for the TSDNE application.

This module handles all configuration settings including environment variables,
database configuration, and application settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class with common settings."""
    
    # Flask settings
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database settings
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///tsdne.db")
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # Story generation settings
    STORY_CHAR_LIMIT = int(os.getenv("STORY_CHAR_LIMIT", "300"))
    STORY_MAX_TOKENS = int(os.getenv("STORY_MAX_TOKENS", "400"))
    STORY_STREAM_DELAY = float(os.getenv("STORY_STREAM_DELAY", "0.02"))
    
    # CORS settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    @classmethod
    def validate_config(cls) -> None:
        """Validate that all required configuration is present."""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required")
    
    @classmethod
    def get_system_prompt(cls) -> str:
        """Get the system prompt for story generation."""
        return f"""
You are an AI storyteller. Your sole purpose is to craft immersive and engaging narratives. All responses must be in the form of a story told from the reader's perspective, using 'You' as the protagonist.

For the first prompt:
- Begin with a **brief but vivid** description of the setting—establishing time, place, and atmosphere.
- The world can be fantastical or sci-fi, but it must follow an internally consistent logic.
- **Keep descriptions concise and action-driven.**

For all subsequent prompts:
- **Acknowledge the player's input and narrate the immediate consequences** of their actions.
- Responses should be **short and move the story forward.**
- **Do not list multiple paths**; the player decides what happens next.
- **Only provide options if it enhances the story**, and ensure they are brief.
- **Use sensory details, but do not over-describe.**
- Avoid unnecessary exposition—**let actions speak.**

Constraints:
- If an input does not align with storytelling, reinterpret it into the narrative to maintain immersion.
- Responses should be limited to {cls.STORY_CHAR_LIMIT} words per interaction.
- The world can contain unreal elements (magic, advanced technology, unknown forces), but they must operate under a consistent set of rules.
- The story should feel dynamic, with logical cause-and-effect relationships guiding the plot.
- Tone, pacing, and stakes should match the unfolding narrative, adapting as needed to maintain engagement.
"""


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///tsdne_dev.db")
    SQLALCHEMY_DATABASE_URI = DATABASE_URL


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
    @classmethod
    def validate_config(cls) -> None:
        """Additional validation for production environment."""
        super().validate_config()
        if cls.SECRET_KEY == "dev-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed in production")


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DATABASE_URL = "sqlite:///:memory:"
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    OPENAI_API_KEY = "test-api-key"  # For testing purposes


def get_config() -> Config:
    """Get the appropriate configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development")
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()
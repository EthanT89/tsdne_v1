"""
Main application module for the TSDNE (This Story Does Not Exist) application.

This is the main entry point for the Flask application with proper separation of concerns.
"""

import logging
from flask import Flask
from flask_cors import CORS
from config_new import get_config
from models import init_db
from routes_new import register_routes
from logging_config import setup_logging

logger = logging.getLogger(__name__)


def create_app(config_name: str = None) -> Flask:
    """
    Application factory function.
    
    Args:
        config_name: Configuration name ('development', 'production', 'testing')
        
    Returns:
        Configured Flask application instance
    """
    # Create Flask application
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Set up logging
    setup_logging(app)
    
    # Validate configuration
    try:
        config.validate_config()
        logger.info("Configuration validated successfully")
    except ValueError as e:
        logger.error(f"Configuration validation failed: {str(e)}")
        raise
    
    # Initialize database
    init_db(app)
    logger.info("Database initialized successfully")
    
    # Set up CORS
    CORS(app, origins=config.CORS_ORIGINS)
    logger.info(f"CORS configured for origins: {config.CORS_ORIGINS}")
    
    # Register routes
    register_routes(app)
    logger.info("Routes registered successfully")
    
    # Add health check at root
    @app.route('/')
    def health_check():
        """Root endpoint health check."""
        return {
            'status': 'healthy',
            'message': 'TSDNE API is running',
            'version': '1.0.0'
        }
    
    # Global error handlers
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unexpected exceptions."""
        logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }, 500
    
    logger.info("Application created successfully")
    return app


# Create application instance
app = create_app()


if __name__ == '__main__':
    """Run the application in development mode."""
    try:
        logger.info("Starting TSDNE application in development mode")
        app.run(
            debug=app.config.get('DEBUG', False),
            host='0.0.0.0',
            port=5000
        )
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}", exc_info=True)
        raise
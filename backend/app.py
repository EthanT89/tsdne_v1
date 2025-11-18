from flask import Flask
from flask_cors import CORS
import os
from config import config
from database import db
from routes import register_routes
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize Sentry for production error tracking
    if config_name == 'production':
        sentry_dsn = os.getenv('SENTRY_DSN')
        if sentry_dsn:
            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[FlaskIntegration()],
                traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
                environment=config_name
            )

    # Configure CORS based on environment
    if config_name == 'production':
        # Production: Restrict CORS to specific origins
        allowed_origins = os.getenv('ALLOWED_ORIGINS', '').split(',')
        CORS(app, origins=allowed_origins, supports_credentials=True)
    else:
        # Development/Testing: Allow all origins
        CORS(app)

    # Initialize database
    db.init_app(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Register routes
    register_routes(app)
    
    return app

if __name__ == "__main__":
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    app.run(debug=True, port=5000)

from flask import Flask
from flask_cors import CORS
import os
from config import config
from database import db
from routes import register_routes

def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
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

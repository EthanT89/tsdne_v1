#!/usr/bin/env python3
"""
Database initialization script for production.

This script initializes the database schema by creating all tables.
It should be run once after the first deployment.

Usage:
    python init_db.py
"""
import os
from app import create_app
from database import db

def init_database():
    """Initialize the database by creating all tables"""
    # Get environment (default to production for safety)
    env = os.getenv('FLASK_ENV', 'production')

    print(f"Initializing database for {env} environment...")

    # Create application instance
    app = create_app(env)

    # Create tables within app context
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created successfully!")

        # Print table info
        print("\nCreated tables:")
        print("- conversations")
        print("- messages")

        print("\nDatabase initialization complete!")

if __name__ == "__main__":
    init_database()

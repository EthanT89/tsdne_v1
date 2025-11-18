from app import create_app
import os

# Create application instance for Elastic Beanstalk
# EB looks for an 'application' object in application.py
application = create_app(os.getenv('FLASK_ENV', 'production'))

# For local development
if __name__ == "__main__":
    application.run()

# migration_manager.py
"""
Database migration manager for upgrading from basic to enhanced models.

This module handles:
- Safe migration from existing Conversation/Message tables
- Data preservation during schema upgrades
- Rollback capabilities
- Schema version tracking
"""

import os
import uuid
from datetime import datetime
from sqlalchemy import text, inspect
from enhanced_models import db, User, Story, Conversation, Message, StoryMemory
from models import Conversation as OldConversation, Message as OldMessage


class MigrationManager:
    """
    Manages database schema migrations and data preservation.
    """
    
    @staticmethod
    def check_migration_needed():
        """
        Check if migration from old schema to new schema is needed.
        """
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        # Check if we have old schema
        has_old_schema = 'conversations' in existing_tables and 'messages' in existing_tables
        
        # Check if we have new schema
        has_new_schema = 'users' in existing_tables and 'stories' in existing_tables
        
        return {
            'has_old_schema': has_old_schema,
            'has_new_schema': has_new_schema,
            'migration_needed': has_old_schema and not has_new_schema,
            'existing_tables': existing_tables
        }
    
    @staticmethod
    def create_enhanced_schema():
        """
        Create the enhanced database schema.
        """
        try:
            # Import all models to ensure they're registered
            from enhanced_models import User, Story, Conversation, Message, StoryMemory, MessageSummary
            
            # Create all tables
            db.create_all()
            
            print("Enhanced database schema created successfully.")
            return True
            
        except Exception as e:
            print(f"Error creating enhanced schema: {e}")
            return False
    
    @staticmethod
    def migrate_existing_data():
        """
        Migrate data from old schema to new enhanced schema.
        """
        try:
            migration_status = MigrationManager.check_migration_needed()
            
            if not migration_status['migration_needed']:
                print("No migration needed.")
                return True
            
            print("Starting data migration...")
            
            # Step 1: Create a default user for existing conversations
            default_user = MigrationManager._create_default_user()
            
            # Step 2: Create a default story for existing conversations
            default_story = MigrationManager._create_default_story(default_user.id)
            
            # Step 3: Migrate conversations
            migrated_conversations = MigrationManager._migrate_conversations(default_story.id)
            
            # Step 4: Migrate messages
            migrated_messages = MigrationManager._migrate_messages()
            
            # Step 5: Generate initial memories from migrated data
            MigrationManager._generate_initial_memories(default_story.id)
            
            print(f"Migration completed successfully!")
            print(f"- Migrated {migrated_conversations} conversations")
            print(f"- Migrated {migrated_messages} messages")
            print(f"- Created default user and story")
            
            return True
            
        except Exception as e:
            print(f"Error during migration: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def _create_default_user():
        """Create a default user for existing data."""
        default_user = User(
            session_id=f"migrated_user_{uuid.uuid4().hex[:8]}",
            display_name="Legacy User",
            created_at=datetime.utcnow(),
            last_active=datetime.utcnow(),
            preferred_story_length="medium",
            preferred_genres='["fantasy", "adventure"]'
        )
        
        db.session.add(default_user)
        db.session.commit()
        
        print(f"Created default user: {default_user.session_id}")
        return default_user
    
    @staticmethod
    def _create_default_story(user_id):
        """Create a default story for existing conversations."""
        default_story = Story(
            user_id=user_id,
            title="Legacy Adventure",
            genre="adventure",
            setting_summary="A continuation of previous adventures",
            status="active",
            current_scene="The story continues...",
            created_at=datetime.utcnow()
        )
        
        db.session.add(default_story)
        db.session.commit()
        
        print(f"Created default story: {default_story.title}")
        return default_story
    
    @staticmethod
    def _migrate_conversations(default_story_id):
        """Migrate conversations from old schema to new schema."""
        # Query old conversations directly using raw SQL to avoid model conflicts
        old_conversations = db.session.execute(
            text("SELECT id, created_at FROM conversations ORDER BY created_at")
        ).fetchall()
        
        migrated_count = 0
        session_number = 1
        
        for old_conv in old_conversations:
            try:
                # Create new conversation with enhanced structure
                new_conversation = Conversation(
                    id=old_conv[0],  # Keep the same ID for message relationships
                    story_id=default_story_id,
                    session_number=session_number,
                    created_at=old_conv[1],
                    updated_at=old_conv[1]
                )
                
                db.session.add(new_conversation)
                session_number += 1
                migrated_count += 1
                
            except Exception as e:
                print(f"Error migrating conversation {old_conv[0]}: {e}")
                continue
        
        db.session.commit()
        return migrated_count
    
    @staticmethod
    def _migrate_messages():
        """Migrate messages from old schema to new schema with enhanced features."""
        # Query old messages directly using raw SQL
        old_messages = db.session.execute(
            text("SELECT id, conversation_id, role, text, created_at FROM messages ORDER BY created_at")
        ).fetchall()
        
        migrated_count = 0
        
        for old_msg in old_messages:
            try:
                # Calculate importance score and memory type
                from memory_utils import MemoryManager
                
                importance = MemoryManager.classify_message_importance(old_msg[3], old_msg[2])
                
                # Calculate message age for memory type classification
                msg_age = datetime.utcnow() - old_msg[4]
                memory_type = MemoryManager.determine_memory_type(importance, msg_age.total_seconds() / 3600)
                
                # Create new message with enhanced structure
                new_message = Message(
                    id=old_msg[0],  # Keep the same ID
                    conversation_id=old_msg[1],
                    role=old_msg[2],
                    content=old_msg[3],
                    importance_score=importance,
                    memory_type=memory_type,
                    created_at=old_msg[4]
                )
                
                db.session.add(new_message)
                migrated_count += 1
                
            except Exception as e:
                print(f"Error migrating message {old_msg[0]}: {e}")
                continue
        
        db.session.commit()
        return migrated_count
    
    @staticmethod
    def _generate_initial_memories(story_id):
        """Generate initial story memories from migrated conversations."""
        try:
            from memory_utils import StoryMemoryExtractor
            
            # Get all conversations for this story
            conversations = Conversation.query.filter_by(story_id=story_id).all()
            
            total_memories = 0
            for conversation in conversations:
                memories = StoryMemoryExtractor.extract_memories_from_conversation(str(conversation.id))
                total_memories += len(memories)
            
            print(f"Generated {total_memories} initial story memories")
            
        except Exception as e:
            print(f"Error generating initial memories: {e}")
    
    @staticmethod
    def backup_old_schema():
        """
        Create backup tables of the old schema before migration.
        """
        try:
            # Create backup tables
            db.session.execute(text("""
                CREATE TABLE conversations_backup AS 
                SELECT * FROM conversations;
            """))
            
            db.session.execute(text("""
                CREATE TABLE messages_backup AS 
                SELECT * FROM messages;
            """))
            
            db.session.commit()
            print("Backup tables created successfully.")
            return True
            
        except Exception as e:
            print(f"Error creating backup: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def rollback_migration():
        """
        Rollback to old schema if migration fails.
        """
        try:
            # Drop new tables
            inspector = inspect(db.engine)
            new_tables = ['users', 'stories', 'story_memories', 'message_summaries']
            
            for table in new_tables:
                if table in inspector.get_table_names():
                    db.session.execute(text(f"DROP TABLE {table} CASCADE;"))
            
            # Restore from backup if exists
            if 'conversations_backup' in inspector.get_table_names():
                db.session.execute(text("DROP TABLE conversations CASCADE;"))
                db.session.execute(text("ALTER TABLE conversations_backup RENAME TO conversations;"))
            
            if 'messages_backup' in inspector.get_table_names():
                db.session.execute(text("DROP TABLE messages CASCADE;"))
                db.session.execute(text("ALTER TABLE messages_backup RENAME TO messages;"))
            
            db.session.commit()
            print("Migration rollback completed.")
            return True
            
        except Exception as e:
            print(f"Error during rollback: {e}")
            db.session.rollback()
            return False


class DatabaseInitializer:
    """
    Handles initialization of database for new installations.
    """
    
    @staticmethod
    def initialize_fresh_database():
        """
        Initialize a fresh database with enhanced schema.
        """
        try:
            # Check if this is a fresh installation
            migration_status = MigrationManager.check_migration_needed()
            
            if not migration_status['has_old_schema'] and not migration_status['has_new_schema']:
                # Fresh installation
                print("Initializing fresh database with enhanced schema...")
                MigrationManager.create_enhanced_schema()
                
                # Create sample data for development
                DatabaseInitializer._create_sample_data()
                
                print("Fresh database initialization completed.")
                return True
                
            elif migration_status['migration_needed']:
                # Need migration
                print("Existing database detected. Migration required.")
                return MigrationManager.migrate_existing_data()
                
            else:
                # Database already enhanced
                print("Enhanced database already exists.")
                return True
                
        except Exception as e:
            print(f"Error during database initialization: {e}")
            return False
    
    @staticmethod
    def _create_sample_data():
        """
        Create sample data for development and testing.
        """
        try:
            # Create sample user
            sample_user = User(
                session_id="sample_user_001",
                display_name="Sample Adventurer",
                preferred_story_length="medium",
                preferred_genres='["fantasy", "adventure", "mystery"]'
            )
            db.session.add(sample_user)
            db.session.commit()
            
            # Create sample story
            sample_story = Story(
                user_id=sample_user.id,
                title="The Enchanted Forest",
                genre="fantasy",
                setting_summary="A magical forest filled with ancient secrets and mystical creatures.",
                status="active",
                current_scene="You stand at the edge of an ancient forest, sunlight filtering through the canopy above."
            )
            db.session.add(sample_story)
            db.session.commit()
            
            # Create sample memories
            sample_memories = [
                StoryMemory(
                    story_id=sample_story.id,
                    memory_type="location",
                    title="The Enchanted Forest Entrance",
                    content="The entrance to the enchanted forest, marked by two ancient oak trees whose branches form a natural archway.",
                    importance_score=6.0,
                    relevance_tags='["forest", "entrance", "oak trees"]'
                ),
                StoryMemory(
                    story_id=sample_story.id,
                    memory_type="rule",
                    title="Forest Magic Rules",
                    content="Magic in this forest responds to intent and emotion. The stronger your will, the more powerful the magic.",
                    importance_score=8.0,
                    relevance_tags='["magic", "rules", "forest"]'
                )
            ]
            
            for memory in sample_memories:
                db.session.add(memory)
            
            db.session.commit()
            print("Sample data created successfully.")
            
        except Exception as e:
            print(f"Error creating sample data: {e}")
            db.session.rollback()


def run_database_setup():
    """
    Main function to run database setup and migration.
    """
    print("Starting database setup...")
    
    # Check current state
    migration_status = MigrationManager.check_migration_needed()
    print(f"Database status: {migration_status}")
    
    # Initialize or migrate database
    success = DatabaseInitializer.initialize_fresh_database()
    
    if success:
        print("Database setup completed successfully!")
        return True
    else:
        print("Database setup failed!")
        return False


if __name__ == "__main__":
    # This can be run standalone for database setup
    run_database_setup()
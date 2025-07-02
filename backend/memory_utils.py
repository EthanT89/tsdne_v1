# memory_utils.py
"""
Utilities for managing conversation history compaction and memory layers.

This module provides tools for:
- Compacting conversation history into summaries
- Extracting important story elements into memory entries
- Building efficient context for AI prompts
- Managing memory lifecycle and cleanup
"""

import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from enhanced_models import (
    db, Message, Conversation, Story, StoryMemory, 
    MessageSummary, MemoryManager
)


class ConversationCompactor:
    """
    Handles the compaction of conversation history into summaries.
    """
    
    @staticmethod
    def create_summary(conversation_id: str, message_range: tuple = None) -> Optional[MessageSummary]:
        """
        Create a summary of messages within a conversation.
        
        Args:
            conversation_id: UUID of the conversation
            message_range: Optional tuple of (start_id, end_id) for partial summaries
        
        Returns:
            MessageSummary object or None if failed
        """
        # Handle both string and UUID types
        if isinstance(conversation_id, str):
            conversation = Conversation.query.filter_by(id=conversation_id).first()
        else:
            conversation = Conversation.query.get(conversation_id)
            
        if not conversation:
            return None
        
        # Get messages to summarize
        query = Message.query.filter_by(conversation_id=conversation_id)
        
        if message_range:
            start_id, end_id = message_range
            query = query.filter(
                Message.id.between(start_id, end_id)
            )
        
        messages = query.order_by(Message.created_at).all()
        
        if not messages:
            return None
        
        # Create summary text
        summary_text = ConversationCompactor._generate_summary_text(messages)
        
        # Calculate compression ratio
        original_length = sum(len(msg.content) for msg in messages)
        compression_ratio = original_length / len(summary_text) if summary_text else 0
        
        # Create summary object
        summary = MessageSummary(
            conversation_id=conversation_id,
            summary_text=summary_text,
            original_message_count=len(messages),
            start_message_id=messages[0].id,
            end_message_id=messages[-1].id,
            time_range_start=messages[0].created_at,
            time_range_end=messages[-1].created_at,
            compression_ratio=compression_ratio
        )
        
        try:
            db.session.add(summary)
            db.session.commit()
            return summary
        except Exception as e:
            db.session.rollback()
            print(f"Error creating summary: {e}")
            return None
    
    @staticmethod
    def _generate_summary_text(messages: List[Message]) -> str:
        """
        Generate a natural language summary of the message sequence.
        """
        if not messages:
            return ""
        
        summary_parts = []
        current_scene = ""
        
        for msg in messages:
            if msg.role == "ai":
                # Extract key narrative elements
                scene_info = ConversationCompactor._extract_scene_info(msg.content)
                if scene_info and scene_info != current_scene:
                    summary_parts.append(f"Scene: {scene_info}")
                    current_scene = scene_info
                
                # Extract important events
                events = ConversationCompactor._extract_events(msg.content)
                summary_parts.extend(events)
                
            elif msg.role == "player":
                # Summarize player actions
                action = ConversationCompactor._extract_player_action(msg.content)
                if action:
                    summary_parts.append(f"Player: {action}")
        
        return " | ".join(summary_parts)
    
    @staticmethod
    def _extract_scene_info(text: str) -> str:
        """Extract scene/location information from AI responses."""
        # Look for location descriptions
        patterns = [
            r"you (?:find yourself|are|enter|approach) (?:in|at|near) (.+?)(?:\.|,|\n)",
            r"the (.+?) (?:surrounds|stretches|looms)",
            r"(?:before you|ahead) (?:lies|stands|sits) (.+?)(?:\.|,|\n)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).strip()[:100]  # Limit length
        
        return ""
    
    @staticmethod
    def _extract_events(text: str) -> List[str]:
        """Extract important events from AI responses."""
        events = []
        
        # Look for important narrative markers
        event_patterns = [
            r"(suddenly .+?)(?:\.|!|\n)",
            r"(you (?:discover|find|notice|see|hear) .+?)(?:\.|!|\n)",
            r"((?:a|an|the) .+? (?:appears|emerges|arrives|attacks|speaks))(?:\.|!|\n)",
            r"(you feel .+?)(?:\.|!|\n)"
        ]
        
        for pattern in event_patterns:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                event = match.strip()[:150]  # Limit length
                if len(event) > 10:  # Filter out very short matches
                    events.append(event.capitalize())
        
        return events[:3]  # Limit to most important events
    
    @staticmethod
    def _extract_player_action(text: str) -> str:
        """Extract and summarize player actions."""
        # Remove common conversational fillers
        cleaned = re.sub(r'^(i |i\'ll |let me |i want to |i try to )', '', text.lower().strip())
        
        # Limit length and clean up
        action = cleaned[:100].strip()
        
        # Capitalize first letter
        if action:
            action = action[0].upper() + action[1:]
        
        return action


class StoryMemoryExtractor:
    """
    Extracts and manages long-term story memories from conversations.
    """
    
    @staticmethod
    def extract_memories_from_conversation(conversation_id: str) -> List[StoryMemory]:
        """
        Extract important story elements from a conversation and create memory entries.
        """
        # Handle both string and UUID types
        if isinstance(conversation_id, str):
            conversation = Conversation.query.filter_by(id=conversation_id).first()
        else:
            conversation = Conversation.query.get(conversation_id)
            
        if not conversation:
            return []
        
        messages = Message.query.filter_by(conversation_id=conversation_id)\
            .order_by(Message.created_at).all()
        
        memories = []
        
        # Extract different types of memories
        memories.extend(StoryMemoryExtractor._extract_character_memories(messages, conversation.story_id))
        memories.extend(StoryMemoryExtractor._extract_location_memories(messages, conversation.story_id))
        memories.extend(StoryMemoryExtractor._extract_event_memories(messages, conversation.story_id))
        memories.extend(StoryMemoryExtractor._extract_rule_memories(messages, conversation.story_id))
        
        # Save memories to database
        saved_memories = []
        for memory in memories:
            try:
                db.session.add(memory)
                db.session.commit()
                saved_memories.append(memory)
            except Exception as e:
                db.session.rollback()
                print(f"Error saving memory: {e}")
        
        return saved_memories
    
    @staticmethod
    def _extract_character_memories(messages: List[Message], story_id: str) -> List[StoryMemory]:
        """Extract character-related memories."""
        memories = []
        
        for msg in messages:
            if msg.role != "ai":
                continue
            
            # Look for character introductions or important character moments
            character_patterns = [
                r"(?:a|an|the) (.+?) (?:named|called) (\w+)",
                r"(\w+) (?:the|a|an) (.+?) (?:says|speaks|tells|whispers)",
                r"(?:meet|encounter|see) (?:a|an|the) (.+?) (?:named|called) (\w+)"
            ]
            
            for pattern in character_patterns:
                matches = re.findall(pattern, msg.content.lower())
                for match in matches:
                    if len(match) == 2:
                        char_type, char_name = match
                        if len(char_name) > 2 and char_name.isalpha():
                            memory = StoryMemory(
                                story_id=story_id,
                                memory_type="character",
                                title=f"{char_name.title()} the {char_type}",
                                content=f"Character: {char_name.title()}, a {char_type}. First encountered in conversation.",
                                importance_score=6.0,
                                relevance_tags=json.dumps(["character", char_name.lower(), char_type]),
                                source_message_ids=json.dumps([str(msg.id)])
                            )
                            memories.append(memory)
        
        return memories
    
    @staticmethod
    def _extract_location_memories(messages: List[Message], story_id: str) -> List[StoryMemory]:
        """Extract location-related memories."""
        memories = []
        
        for msg in messages:
            if msg.role != "ai":
                continue
            
            # Look for location descriptions
            location_patterns = [
                r"you (?:enter|arrive at|find yourself in) (?:a|an|the) (.+?)(?:\.|,)",
                r"(?:the|a|an) (.+?) (?:stretches|extends|lies) before you",
                r"you are (?:in|at|within) (?:a|an|the) (.+?)(?:\.|,)"
            ]
            
            for pattern in location_patterns:
                matches = re.findall(pattern, msg.content.lower())
                for match in matches:
                    location = match.strip()
                    if len(location) > 5 and len(location) < 100:
                        memory = StoryMemory(
                            story_id=story_id,
                            memory_type="location",
                            title=f"Location: {location.title()}",
                            content=f"A location in the story: {location}. Visited during the adventure.",
                            importance_score=5.0,
                            relevance_tags=json.dumps(["location", location.lower()]),
                            source_message_ids=json.dumps([str(msg.id)])
                        )
                        memories.append(memory)
        
        return memories
    
    @staticmethod
    def _extract_event_memories(messages: List[Message], story_id: str) -> List[StoryMemory]:
        """Extract important event memories."""
        memories = []
        
        for msg in messages:
            if msg.role != "ai":
                continue
            
            # Look for significant events
            event_patterns = [
                r"(you (?:defeat|kill|destroy) .+?)(?:\.|!)",
                r"(you (?:find|discover|obtain|gain) .+?)(?:\.|!)",
                r"(you (?:learn|realize|understand) .+?)(?:\.|!)",
                r"(something (?:happens|occurs|changes) .+?)(?:\.|!)"
            ]
            
            for pattern in event_patterns:
                matches = re.findall(pattern, msg.content.lower())
                for match in matches:
                    event = match.strip()
                    if len(event) > 10 and len(event) < 200:
                        memory = StoryMemory(
                            story_id=story_id,
                            memory_type="event",
                            title=f"Event: {event[:50]}...",
                            content=f"Important event: {event}",
                            importance_score=7.0,
                            relevance_tags=json.dumps(["event", "important"]),
                            source_message_ids=json.dumps([str(msg.id)])
                        )
                        memories.append(memory)
        
        return memories
    
    @staticmethod
    def _extract_rule_memories(messages: List[Message], story_id: str) -> List[StoryMemory]:
        """Extract world rules and mechanics memories."""
        memories = []
        
        for msg in messages:
            if msg.role != "ai":
                continue
            
            # Look for rule explanations or world mechanics
            rule_patterns = [
                r"(magic (?:works|functions|operates) .+?)(?:\.|!)",
                r"(the (?:curse|spell|enchantment) .+?)(?:\.|!)",
                r"(you (?:can|cannot|must|should) .+? because .+?)(?:\.|!)",
                r"((?:in this world|here) .+?)(?:\.|!)"
            ]
            
            for pattern in rule_patterns:
                matches = re.findall(pattern, msg.content.lower())
                for match in matches:
                    rule = match.strip()
                    if len(rule) > 15 and len(rule) < 300:
                        memory = StoryMemory(
                            story_id=story_id,
                            memory_type="rule",
                            title=f"Rule: {rule[:50]}...",
                            content=f"World rule or mechanic: {rule}",
                            importance_score=6.5,
                            relevance_tags=json.dumps(["rule", "world", "mechanic"]),
                            source_message_ids=json.dumps([str(msg.id)])
                        )
                        memories.append(memory)
        
        return memories


class ContextBuilder:
    """
    Builds optimized context for AI prompts using memory layers.
    """
    
    @staticmethod
    def build_prompt_context(story_id: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """
        Build comprehensive context for AI prompts with token management.
        """
        story = Story.query.get(story_id)
        if not story:
            return {"error": "Story not found"}
        
        context = {
            "story_setup": ContextBuilder._get_story_setup(story),
            "recent_context": ContextBuilder._get_recent_context(story_id),
            "important_memories": ContextBuilder._get_important_memories(story_id),
            "conversation_summary": ContextBuilder._get_conversation_summary(story_id)
        }
        
        # Estimate token usage and trim if necessary
        context = ContextBuilder._trim_context_to_token_limit(context, max_tokens)
        
        return context
    
    @staticmethod
    def _get_story_setup(story: Story) -> Dict[str, str]:
        """Get basic story setup information."""
        return {
            "title": story.title or "An Untitled Adventure",
            "genre": story.genre or "fantasy",
            "setting": story.setting_summary or "A mysterious world awaits exploration",
            "current_scene": story.current_scene or "The adventure begins"
        }
    
    @staticmethod
    def _get_recent_context(story_id: str, hours: int = 2) -> List[Dict]:
        """Get recent messages for immediate context."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        recent_messages = db.session.query(Message)\
            .join(Conversation)\
            .filter(Conversation.story_id == story_id)\
            .filter(Message.created_at >= cutoff)\
            .order_by(Message.created_at.desc())\
            .limit(10)\
            .all()
        
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat()
            }
            for msg in reversed(recent_messages)  # Reverse to get chronological order
        ]
    
    @staticmethod
    def _get_important_memories(story_id: str, limit: int = 8) -> List[Dict]:
        """Get most important story memories."""
        memories = StoryMemory.query\
            .filter_by(story_id=story_id)\
            .filter(StoryMemory.importance_score >= 5.0)\
            .order_by(StoryMemory.importance_score.desc(), StoryMemory.last_referenced.desc())\
            .limit(limit)\
            .all()
        
        # Update last_referenced for retrieved memories
        for memory in memories:
            memory.last_referenced = datetime.utcnow()
        
        try:
            db.session.commit()
        except:
            db.session.rollback()
        
        return [
            {
                "type": mem.memory_type,
                "title": mem.title,
                "content": mem.content,
                "importance": mem.importance_score
            }
            for mem in memories
        ]
    
    @staticmethod
    def _get_conversation_summary(story_id: str, days: int = 3) -> List[Dict]:
        """Get recent conversation summaries."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        summaries = db.session.query(MessageSummary)\
            .join(Conversation)\
            .filter(Conversation.story_id == story_id)\
            .filter(MessageSummary.time_range_end >= cutoff)\
            .order_by(MessageSummary.time_range_end.desc())\
            .limit(5)\
            .all()
        
        return [
            {
                "summary": summ.summary_text,
                "time_range": f"{summ.time_range_start.strftime('%Y-%m-%d %H:%M')} - {summ.time_range_end.strftime('%Y-%m-%d %H:%M')}",
                "message_count": summ.original_message_count
            }
            for summ in summaries
        ]
    
    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """Rough token estimation (1 token ≈ 4 characters for English)."""
        return len(text) // 4
    
    @staticmethod
    def _trim_context_to_token_limit(context: Dict[str, Any], max_tokens: int) -> Dict[str, Any]:
        """Trim context to fit within token limits, prioritizing by importance."""
        current_tokens = 0
        
        # Calculate current token usage
        for section in context.values():
            if isinstance(section, dict):
                current_tokens += sum(ContextBuilder._estimate_tokens(str(v)) for v in section.values())
            elif isinstance(section, list):
                for item in section:
                    if isinstance(item, dict):
                        current_tokens += sum(ContextBuilder._estimate_tokens(str(v)) for v in item.values())
                    else:
                        current_tokens += ContextBuilder._estimate_tokens(str(item))
            else:
                current_tokens += ContextBuilder._estimate_tokens(str(section))
        
        # If under limit, return as-is
        if current_tokens <= max_tokens:
            return context
        
        # Trim in order of priority (keep story setup, trim others)
        trimmed_context = {
            "story_setup": context.get("story_setup", {}),
            "recent_context": context.get("recent_context", [])[:5],  # Keep last 5 messages
            "important_memories": context.get("important_memories", [])[:4],  # Keep top 4 memories
            "conversation_summary": context.get("conversation_summary", [])[:2]  # Keep 2 most recent summaries
        }
        
        return trimmed_context


class MemoryMaintenanceService:
    """
    Service for maintaining and cleaning up memory entries.
    """
    
    @staticmethod
    def cleanup_old_memories(days_old: int = 30) -> int:
        """
        Archive or delete very old, low-importance memories.
        Returns count of cleaned up memories.
        """
        cutoff = datetime.utcnow() - timedelta(days=days_old)
        
        old_memories = StoryMemory.query\
            .filter(StoryMemory.created_at < cutoff)\
            .filter(StoryMemory.importance_score < 4.0)\
            .filter(StoryMemory.last_referenced < cutoff)\
            .all()
        
        count = len(old_memories)
        
        for memory in old_memories:
            db.session.delete(memory)
        
        try:
            db.session.commit()
            return count
        except Exception as e:
            db.session.rollback()
            print(f"Error during memory cleanup: {e}")
            return 0
    
    @staticmethod
    def update_memory_importance() -> int:
        """
        Update importance scores based on recent access patterns.
        Returns count of updated memories.
        """
        # Boost importance of frequently accessed memories
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        
        memories = StoryMemory.query\
            .filter(StoryMemory.last_referenced >= recent_cutoff)\
            .all()
        
        count = 0
        for memory in memories:
            # Small boost for recent access
            memory.importance_score = min(memory.importance_score + 0.5, 10.0)
            count += 1
        
        try:
            db.session.commit()
            return count
        except Exception as e:
            db.session.rollback()
            print(f"Error updating memory importance: {e}")
            return 0
    
    @staticmethod
    def consolidate_duplicate_memories(story_id: str) -> int:
        """
        Find and consolidate similar memories to reduce redundancy.
        Returns count of consolidated memories.
        """
        # This is a simplified version - could be enhanced with similarity algorithms
        memories_by_type = {}
        
        memories = StoryMemory.query.filter_by(story_id=story_id).all()
        
        for memory in memories:
            key = (memory.memory_type, memory.title[:20])  # Group by type and title prefix
            if key not in memories_by_type:
                memories_by_type[key] = []
            memories_by_type[key].append(memory)
        
        consolidated_count = 0
        
        for group in memories_by_type.values():
            if len(group) > 1:
                # Keep the most important one, delete others
                group.sort(key=lambda m: m.importance_score, reverse=True)
                keep_memory = group[0]
                
                # Combine content from duplicates
                additional_content = []
                source_ids = json.loads(keep_memory.source_message_ids or '[]')
                
                for duplicate in group[1:]:
                    if duplicate.content not in keep_memory.content:
                        additional_content.append(duplicate.content)
                    source_ids.extend(json.loads(duplicate.source_message_ids or '[]'))
                    db.session.delete(duplicate)
                    consolidated_count += 1
                
                if additional_content:
                    keep_memory.content += " | " + " | ".join(additional_content)
                    keep_memory.source_message_ids = json.dumps(list(set(source_ids)))
        
        try:
            db.session.commit()
            return consolidated_count
        except Exception as e:
            db.session.rollback()
            print(f"Error consolidating memories: {e}")
            return 0
# Story Persistence Analysis & Design

## Executive Summary

The current system **does persist messages** but lacks **semantic memory persistence**. While all player inputs and AI responses are saved to the database, the AI only maintains context of the **last 10 messages** (truncated to 100 characters each). This creates significant narrative continuity problems for longer stories.

**Critical Issue:** After ~10 turns, the AI forgets characters, locations, plot points, and story elements, leading to inconsistent narratives.

---

## Current Persistence Architecture

### What IS Persisted (Message-Level)
- ✅ All player inputs → `Message(role="player")`
- ✅ All AI responses → `Message(role="ai")`
- ✅ Conversation metadata (created_at, updated_at)
- ✅ Complete chronological history

**Location:** `backend/models.py` - Conversation & Message tables

### What Is NOT Persisted (Semantic-Level)
- ❌ **Characters** (names, descriptions, relationships)
- ❌ **Locations** (places visited, descriptions)
- ❌ **Items/Objects** (inventory, important objects)
- ❌ **Plot Points** (key events, decisions made)
- ❌ **World Rules** (magic systems, tech, constraints)
- ❌ **Relationships** (between characters, factions)
- ❌ **Goals/Quests** (active objectives)

---

## The Context Window Problem

**File:** `backend/routes.py:38-51` - `construct_system_prompt()`

```python
# Current Implementation - PROBLEMATIC
def construct_system_prompt(conversation_id=None):
    prompt = SYSTEM_PROMPT_BASE

    if conversation_id:
        # ⚠️ ONLY LAST 10 MESSAGES
        messages = Message.query.filter_by(conversation_id=conversation_id)\
                         .order_by(Message.created_at.desc())\
                         .limit(10).all()

        if messages:
            prompt += "\n\nRecent conversation history:\n"
            for msg in reversed(messages):
                role = "Player" if msg.role == "player" else "AI"
                # ⚠️ TRUNCATED TO 100 CHARS
                prompt += f"{role}: {msg.text[:100]}...\n"

    return prompt
```

### Problems With This Approach

| Issue | Impact | Example |
|-------|--------|---------|
| **10-message limit** | Forgets older context | Character introduced in turn 1 forgotten by turn 12 |
| **100-char truncation** | Loses detail | "You meet Aria, a mysterious elf wizard who offers to teach you fire magic" → "You meet Aria, a mysterious elf wizard who offers to teach you fire mag..." |
| **No semantic extraction** | Can't distinguish important from trivial | Forgetting the villain's name is as likely as forgetting a meal description |
| **Linear context** | No hierarchical memory | All events treated equally regardless of importance |

---

## Proposed Solution: Story State Compaction System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                               │
│              "I attack the dragon with my sword"            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               SAVE PLAYER MESSAGE                           │
│          Message(role="player", text=input)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          BUILD ENHANCED CONTEXT PROMPT                      │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 1. Base System Prompt (storyteller instructions)  │     │
│  ├───────────────────────────────────────────────────┤     │
│  │ 2. STORY STATE (compacted knowledge) ← NEW!       │     │
│  │    - Characters: Aria (elf wizard, ally)          │     │
│  │    - Location: Dragon's lair in volcano           │     │
│  │    - Items: Magic sword, healing potion           │     │
│  │    - Plot: Seeking dragon's treasure              │     │
│  ├───────────────────────────────────────────────────┤     │
│  │ 3. Recent Messages (last 5-10 interactions)       │     │
│  └───────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              OPENAI API GENERATION                          │
│       (Context-aware with full story memory)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SAVE AI RESPONSE                               │
│           Message(role="ai", text=response)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│       EXTRACT & UPDATE STORY STATE ← NEW!                   │
│  - Extract new characters mentioned                         │
│  - Extract new locations visited                            │
│  - Extract new items acquired/used                          │
│  - Extract key plot developments                            │
│  - Update StoryState model in database                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### New Model: StoryState

```python
class StoryState(db.Model):
    """Compacted semantic memory for a story"""
    __tablename__ = 'story_states'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False, unique=True)

    # Compacted story knowledge (JSON fields)
    characters = db.Column(db.JSON, default=dict)      # {name: description}
    locations = db.Column(db.JSON, default=dict)       # {name: description}
    items = db.Column(db.JSON, default=list)           # [item1, item2, ...]
    plot_points = db.Column(db.JSON, default=list)     # [event1, event2, ...]
    world_rules = db.Column(db.JSON, default=list)     # [rule1, rule2, ...]
    relationships = db.Column(db.JSON, default=dict)   # {char1: {char2: "ally"}}
    active_goals = db.Column(db.JSON, default=list)    # [goal1, goal2, ...]

    # Metadata
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    update_count = db.Column(db.Integer, default=0)    # Track how many times updated

    # Relationships
    conversation = db.relationship('Conversation', backref='story_state', uselist=False)
```

### Example Data Structure

```json
{
  "characters": {
    "Aria": "Elf wizard, teaches fire magic, ally, wears blue robes",
    "Lord Malakai": "Dark sorcerer, main antagonist, seeks ancient artifact",
    "Grimjaw": "Orc blacksmith, gruff but kind, forged protagonist's sword"
  },
  "locations": {
    "Silverwood Forest": "Dense magical forest, glowing mushrooms, home to elves",
    "Ironpeak Mountains": "Volcanic range, dragon's lair at summit, treacherous paths",
    "Thornhaven Village": "Starting location, small farming community, burned by Malakai"
  },
  "items": [
    "Flamekeeper Sword (magical, glows when danger near)",
    "Aria's Spellbook (contains fire magic)",
    "Healing Potion x2",
    "Map of Ironpeak Mountains"
  ],
  "plot_points": [
    "Village destroyed by Lord Malakai",
    "Protagonist seeks revenge and ancient artifact",
    "Met Aria in Silverwood, learned fire magic",
    "Grimjaw forged enchanted sword",
    "Discovered dragon guards artifact"
  ],
  "world_rules": [
    "Magic requires spoken incantations",
    "Fire magic drains user's stamina",
    "Dragons are intelligent and can speak",
    "Ancient artifacts corrupt those who seek power"
  ],
  "relationships": {
    "Aria": {"Protagonist": "mentor", "Lord Malakai": "enemy"},
    "Grimjaw": {"Protagonist": "ally"},
    "Lord Malakai": {"Protagonist": "enemy", "Aria": "enemy"}
  },
  "active_goals": [
    "Defeat the dragon",
    "Retrieve the ancient artifact",
    "Confront Lord Malakai",
    "Protect remaining villagers"
  ]
}
```

---

## Story State Extraction Strategy

### Two Approaches

#### Option A: AI-Powered Extraction (Recommended)
Use OpenAI to extract semantic information from each story turn.

**Pros:**
- ✅ Highly accurate semantic understanding
- ✅ Handles nuanced relationships and context
- ✅ Can merge/deduplicate information intelligently
- ✅ Adapts to any story genre automatically

**Cons:**
- ❌ Additional API call per turn (cost)
- ❌ Slight latency increase

**Implementation:**
```python
def extract_story_state(user_input, ai_response, current_state):
    """Extract new story elements using GPT-3.5"""

    extraction_prompt = f"""
    Analyze this story turn and extract key information:

    Player Action: {user_input}
    Story Response: {ai_response}

    Current Story State: {json.dumps(current_state, indent=2)}

    Extract and return JSON with:
    - new_characters: {{name: brief description}}
    - new_locations: {{name: brief description}}
    - new_items: [item names with brief descriptions]
    - new_plot_points: [important events that occurred]
    - new_world_rules: [any rules about how the world works]
    - updated_relationships: {{char1: {{char2: relationship_type}}}}
    - updated_goals: [current active objectives]

    Only include NEW or UPDATED information. Be concise (5-10 words per description).
    Return valid JSON only, no other text.
    """

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": extraction_prompt}],
        max_tokens=300,
        temperature=0.3  # Lower temperature for consistency
    )

    return json.loads(response.choices[0].message.content)
```

#### Option B: Rule-Based Extraction
Use regex/NLP patterns to extract entities.

**Pros:**
- ✅ No additional API costs
- ✅ Fast and predictable

**Cons:**
- ❌ Less accurate
- ❌ Requires complex pattern matching
- ❌ Misses contextual relationships

**Not recommended** for this use case due to the creative nature of storytelling.

---

## Context Assembly Strategy

### Enhanced `construct_system_prompt()`

```python
def construct_system_prompt(conversation_id=None):
    """Build context with story state + recent messages"""
    prompt = SYSTEM_PROMPT_BASE

    if conversation_id:
        # PART 1: Load compacted story state
        story_state = StoryState.query.filter_by(conversation_id=conversation_id).first()

        if story_state:
            prompt += "\n\n=== STORY MEMORY ===\n"

            # Characters
            if story_state.characters:
                prompt += "\nCHARACTERS:\n"
                for name, desc in story_state.characters.items():
                    prompt += f"- {name}: {desc}\n"

            # Locations
            if story_state.locations:
                prompt += "\nLOCATIONS:\n"
                for name, desc in story_state.locations.items():
                    prompt += f"- {name}: {desc}\n"

            # Items
            if story_state.items:
                prompt += f"\nITEMS: {', '.join(story_state.items)}\n"

            # Plot Points (last 5 most important)
            if story_state.plot_points:
                prompt += "\nKEY PLOT POINTS:\n"
                for point in story_state.plot_points[-5:]:
                    prompt += f"- {point}\n"

            # Active Goals
            if story_state.active_goals:
                prompt += f"\nACTIVE GOALS: {', '.join(story_state.active_goals)}\n"

            # World Rules
            if story_state.world_rules:
                prompt += "\nWORLD RULES:\n"
                for rule in story_state.world_rules:
                    prompt += f"- {rule}\n"

        # PART 2: Recent conversation context (last 5-7 messages)
        messages = Message.query.filter_by(conversation_id=conversation_id)\
                         .order_by(Message.created_at.desc())\
                         .limit(7).all()

        if messages:
            prompt += "\n\n=== RECENT CONVERSATION ===\n"
            for msg in reversed(messages):
                role = "Player" if msg.role == "player" else "AI"
                # Keep more context (200 chars instead of 100)
                prompt += f"{role}: {msg.text[:200]}\n"

    return prompt
```

### Context Budget Analysis

**Token Limits:**
- GPT-3.5-turbo max context: **16,385 tokens** (~12,000 words)
- Our usage breakdown:

| Component | Estimated Tokens | Notes |
|-----------|------------------|-------|
| Base system prompt | ~300 | Fixed instructions |
| Story state | ~500-800 | Grows with story, but bounded |
| Recent messages (7 x 200 chars) | ~400 | Recent context |
| User input | ~50-100 | Current action |
| **Total** | **~1,250-1,600** | **Well within limits** |

**Safety:** Even long stories stay under 3,000 tokens, leaving 13,000+ for generation.

---

## Compaction Strategy

### Problem: Story State Growth
As stories progress, the state could grow unbounded.

### Solutions

#### 1. **Character Limit per Field**
```python
# In StoryState model
MAX_CHARACTERS = 20      # Track top 20 most relevant
MAX_LOCATIONS = 15       # Track 15 most visited/important
MAX_PLOT_POINTS = 10     # Keep last 10 major events
MAX_ITEMS = 30           # Reasonable inventory limit
```

#### 2. **Recency + Importance Weighting**
Older, less-mentioned entities fade away:
```python
def prune_story_state(state, recent_messages):
    """Keep only recently-mentioned or important entities"""

    # Extract mentions from last 20 messages
    recent_text = " ".join([m.text for m in recent_messages[-20:]])

    # Prune characters not mentioned in last 20 turns
    state.characters = {
        name: desc for name, desc in state.characters.items()
        if name.lower() in recent_text.lower() or is_important(name, desc)
    }

    # Similar for locations, items, etc.
    # Keep items that are "important" (magical, quest-related)
    # Keep locations that are "important" (home base, main quest locations)
```

#### 3. **AI-Assisted Summarization**
Periodically ask AI to consolidate:
```python
def consolidate_story_state(state):
    """Ask AI to summarize and compress story state"""

    consolidation_prompt = f"""
    Consolidate this story state into the most essential information:

    {json.dumps(state, indent=2)}

    Rules:
    - Keep only actively relevant characters, locations, items
    - Merge similar plot points
    - Remove redundant information
    - Maintain logical consistency
    - Maximum 15 characters, 10 locations, 20 items, 8 plot points

    Return condensed JSON in same format.
    """

    # Run every 25-30 turns to keep state lean
```

---

## Implementation Phases

### Phase 1: Database Schema (1-2 hours)
- ✅ Add `StoryState` model to `models.py`
- ✅ Create migration script
- ✅ Test database creation

**Files:**
- `backend/models.py` - Add StoryState class
- `backend/init_db.py` - Include new table
- `backend/migrations/` - Alembic migration (if using)

---

### Phase 2: State Extraction (3-4 hours)
- ✅ Create `story_state_extractor.py` service
- ✅ Implement AI-powered extraction
- ✅ Add error handling and fallbacks
- ✅ Test extraction accuracy

**New File:**
```python
# backend/story_state_extractor.py

from openai import OpenAI
import json
from models import StoryState
from database import db

class StoryStateExtractor:
    def __init__(self, openai_client):
        self.client = openai_client

    def extract_from_turn(self, user_input, ai_response, conversation_id):
        """Extract story elements from a single turn"""
        # Load existing state
        state = StoryState.query.filter_by(conversation_id=conversation_id).first()

        if not state:
            state = StoryState(conversation_id=conversation_id)
            db.session.add(state)

        # Build extraction prompt
        current_state = self._serialize_state(state)
        new_data = self._call_extraction_api(user_input, ai_response, current_state)

        # Merge new data into state
        self._merge_state(state, new_data)

        # Prune if needed
        self._prune_state(state)

        state.update_count += 1
        db.session.commit()

        return state

    def _call_extraction_api(self, user_input, ai_response, current_state):
        """Call OpenAI to extract entities"""
        # [Implementation from Option A above]

    def _merge_state(self, state, new_data):
        """Intelligently merge new information"""
        # Merge characters (update if exists, add if new)
        for name, desc in new_data.get('new_characters', {}).items():
            state.characters[name] = desc

        # Merge locations
        for name, desc in new_data.get('new_locations', {}).items():
            state.locations[name] = desc

        # Append items (avoid duplicates)
        for item in new_data.get('new_items', []):
            if item not in state.items:
                state.items.append(item)

        # Append plot points
        state.plot_points.extend(new_data.get('new_plot_points', []))

        # Merge goals (replace old with updated)
        state.active_goals = new_data.get('updated_goals', state.active_goals)

        # Merge relationships
        for char1, relations in new_data.get('updated_relationships', {}).items():
            if char1 not in state.relationships:
                state.relationships[char1] = {}
            state.relationships[char1].update(relations)

    def _prune_state(self, state):
        """Keep state within bounds"""
        # Limit characters
        if len(state.characters) > 20:
            # Keep most recently updated
            state.characters = dict(list(state.characters.items())[-20:])

        # Limit plot points
        if len(state.plot_points) > 10:
            state.plot_points = state.plot_points[-10:]

        # Similar for other fields
```

---

### Phase 3: Context Integration (2-3 hours)
- ✅ Update `construct_system_prompt()` in `routes.py`
- ✅ Add story state loading
- ✅ Format state for AI consumption
- ✅ Test context assembly

**Changes to `backend/routes.py`:**
- Import `StoryStateExtractor`
- Modify `construct_system_prompt()` (see enhanced version above)
- Update `/generate` endpoint to call extraction after AI response

---

### Phase 4: API Integration (2-3 hours)
- ✅ Modify `/generate` endpoint to extract state after each turn
- ✅ Add optional `/conversations/<id>/state` endpoint to view state
- ✅ Add error handling for extraction failures
- ✅ Test end-to-end flow

**New Endpoint:**
```python
@app.route("/conversations/<int:conversation_id>/state", methods=["GET"])
def get_story_state(conversation_id):
    """Get the compacted story state for debugging/display"""
    try:
        state = StoryState.query.filter_by(conversation_id=conversation_id).first()
        if not state:
            return jsonify({"error": "Story state not found"}), 404

        return jsonify({
            "characters": state.characters,
            "locations": state.locations,
            "items": state.items,
            "plot_points": state.plot_points,
            "world_rules": state.world_rules,
            "relationships": state.relationships,
            "active_goals": state.active_goals,
            "last_updated": state.last_updated.isoformat(),
            "update_count": state.update_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

---

### Phase 5: Frontend Display (Optional, 3-4 hours)
- ✅ Add "Story Info" panel showing current state
- ✅ Display characters, locations, inventory
- ✅ Visual tracking of goals and plot points

**New Component:** `frontend/src/components/StoryStatePanel.tsx`

---

## Testing Strategy

### Unit Tests
```python
# backend/tests/test_story_state.py

def test_story_state_creation():
    """Test StoryState model creates successfully"""
    # Create conversation
    # Create story state
    # Assert fields are initialized

def test_extraction_from_turn():
    """Test extracting entities from a story turn"""
    extractor = StoryStateExtractor(client)
    user_input = "I meet a mysterious elf named Aria"
    ai_response = "Aria greets you warmly. She is a wizard who lives in the forest."

    state = extractor.extract_from_turn(user_input, ai_response, conversation_id=1)

    assert "Aria" in state.characters
    assert "elf" in state.characters["Aria"].lower()
    assert "wizard" in state.characters["Aria"].lower()

def test_state_pruning():
    """Test that old/irrelevant entities are pruned"""
    # Create state with 25 characters
    # Call pruning
    # Assert only 20 remain

def test_context_assembly():
    """Test that story state is properly formatted in prompt"""
    prompt = construct_system_prompt(conversation_id=1)
    assert "=== STORY MEMORY ===" in prompt
    assert "CHARACTERS:" in prompt
```

### Integration Tests
```python
def test_full_story_flow_with_persistence():
    """Test complete story with state extraction"""
    # Create conversation
    # Send 15 turns of story
    # Load story state
    # Assert characters/locations tracked
    # Assert context includes state
    # Assert story remains consistent
```

---

## Performance Considerations

### API Call Overhead
- **Current:** 1 OpenAI call per turn (story generation)
- **With extraction:** 2 OpenAI calls per turn (story + extraction)
- **Impact:** +0.5-1 second latency per turn
- **Cost:** ~$0.0001 per extraction (negligible)

### Optimization Options
1. **Batch extraction:** Extract every 2-3 turns instead of every turn
2. **Async extraction:** Run extraction in background after streaming response
3. **Selective extraction:** Only extract when new entities detected (regex pre-filter)

---

## Migration Strategy

### For Existing Conversations
```python
# backend/migrate_existing_conversations.py

def backfill_story_states():
    """Generate story states for existing conversations"""
    conversations = Conversation.query.all()
    extractor = StoryStateExtractor(client)

    for conv in conversations:
        print(f"Processing conversation {conv.id}...")

        # Get all messages
        messages = Message.query.filter_by(conversation_id=conv.id)\
                         .order_by(Message.created_at).all()

        # Process in pairs (player + AI response)
        for i in range(0, len(messages)-1, 2):
            if messages[i].role == "player" and messages[i+1].role == "ai":
                extractor.extract_from_turn(
                    messages[i].text,
                    messages[i+1].text,
                    conv.id
                )

        print(f"Conversation {conv.id} - State created with {extractor.state.update_count} updates")
```

---

## Alternative Approaches Considered

### 1. **Vector Database (Embeddings)**
Store message embeddings and retrieve semantically similar context.

**Pros:** Handles very long stories, semantic search
**Cons:** Complex setup, requires vector DB (Pinecone/Weaviate), higher cost

### 2. **Summarization Chain**
Periodically summarize entire conversation into progressive summaries.

**Pros:** Simple concept
**Cons:** Loses granular detail, summarization drift over time

### 3. **Hybrid: Embeddings + Structured State**
Combine structured state (characters, locations) with vector search for plot.

**Pros:** Best of both worlds
**Cons:** Most complex, highest cost

**Recommendation:** Start with structured state extraction (proposed solution), upgrade to hybrid if needed.

---

## Cost Analysis

### Per Story (50 turns)

| Component | Calls | Cost per Call | Total |
|-----------|-------|---------------|-------|
| Story generation | 50 | $0.002 | $0.10 |
| State extraction | 50 | $0.0001 | $0.005 |
| **Total per 50-turn story** | | | **$0.105** |

**Conclusion:** State extraction adds <5% cost overhead - negligible.

---

## Success Metrics

### Before Implementation
- ❌ Stories >10 turns lose character consistency
- ❌ Repeated introductions of same characters
- ❌ Forgetting key plot points
- ❌ Inconsistent world rules

### After Implementation
- ✅ Characters remembered throughout entire story
- ✅ Locations tracked and referenced correctly
- ✅ Items persist in "inventory"
- ✅ Plot consistency maintained for 50+ turns
- ✅ Goals tracked and completed logically

---

## Recommended Implementation Order

1. **Phase 1:** Database schema (start here)
2. **Phase 2:** State extraction service
3. **Phase 3:** Context integration
4. **Phase 4:** API integration + testing
5. **Phase 5:** Frontend display (optional)
6. **Phase 6:** Backfill existing conversations (optional)

**Estimated Total Time:** 10-15 hours for core functionality

---

## Files to Create/Modify

### New Files
- `backend/story_state_extractor.py` - Extraction service
- `backend/tests/test_story_state.py` - Unit tests
- `backend/migrate_existing_conversations.py` - Backfill script
- `frontend/src/components/StoryStatePanel.tsx` - UI (optional)

### Modified Files
- `backend/models.py` - Add StoryState model
- `backend/routes.py` - Update construct_system_prompt(), /generate endpoint
- `backend/init_db.py` - Include new table

---

## Conclusion

The proposed **Story State Compaction System** solves the persistence problem by:

1. ✅ **Extracting** semantic entities (characters, locations, plot) from each turn
2. ✅ **Compacting** into concise structured format (JSON)
3. ✅ **Persisting** in database alongside messages
4. ✅ **Injecting** into AI context for every turn
5. ✅ **Maintaining** consistency across arbitrarily long stories

This approach is:
- **Cost-effective** (<5% overhead)
- **Fast** (~1s latency increase)
- **Scalable** (bounded state size)
- **Maintainable** (simple architecture)
- **Extensible** (can add features like embeddings later)

**Next Step:** Begin with Phase 1 (database schema) and proceed sequentially.

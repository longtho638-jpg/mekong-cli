# Cross-Session Intelligence API Reference

> **Module:** `src/core/cross_session_intelligence.py`
> **Purpose:** Quản lý user profile và knowledge persistence across sessions
> **Pattern:** UserProfile + StateManager + IntelligenceEngine

---

## Classes

### `UserProfile`

Data class lưu trữ thông tin user persistent.

#### Attributes

```python
user_id: str
created_at: datetime
preferences: Dict[str, Any]
interaction_history: List[Dict[str, Any]]
knowledge_base: Dict[str, Any]
session_history: List[Dict[str, Any]]
```

---

### `CrossSessionStateManager`

Quản lý state và knowledge cho một user.

#### Constructor

```python
def __init__(self, user_id: str)
```

**Example:**
```python
from src.core.cross_session_intelligence import CrossSessionStateManager

state = CrossSessionStateManager("user:123")
```

---

#### Methods

##### `update_preferences()`

Cập nhật user preferences.

```python
def update_preferences(self, preferences: Dict[str, Any]) -> None
```

**Example:**
```python
state.update_preferences({
    "language": "vi",
    "timezone": "Asia/Saigon",
    "default_agent": "coder"
})
```

---

##### `add_interaction()`

Thêm interaction vào history.

```python
def add_interaction(
    self,
    interaction_type: str,
    content: str,
    metadata: Optional[Dict] = None
) -> str
```

**Returns:** Interaction ID (UUID)

**Example:**
```python
interaction_id = state.add_interaction(
    interaction_type="command",
    content="/cook create API endpoint",
    metadata={"agent": "fullstack-developer", "duration": 45}
)
```

---

##### `add_to_knowledge_base()`

Thêm thông tin vào knowledge base.

```python
def add_to_knowledge_base(
    self,
    category: str,
    key: str,
    value: Any
) -> None
```

**Example:**
```python
state.add_to_knowledge_base(
    category="tech_stack",
    key="database",
    value="PostgreSQL 15"
)

state.add_to_knowledge_base(
    category="api_keys",
    key="stripe_env_var",
    value="STRIPE_SECRET_KEY"
)
```

---

##### `record_session()`

Record một session.

```python
def record_session(self, session_data: Dict[str, Any]) -> str
```

**Returns:** Session ID (UUID)

**Example:**
```python
session_id = state.record_session({
    "goal": "Implement authentication",
    "agents_used": ["coder", "reviewer"],
    "files_modified": ["src/auth.py", "tests/test_auth.py"]
})
```

---

##### `get_user_preferences()`

Lấy user preferences.

```python
def get_user_preferences(self) -> Dict[str, Any]
```

**Example:**
```python
prefs = state.get_user_preferences()
print(f"Language: {prefs.get('language')}")
```

---

##### `get_interaction_history()`

Lấy interaction history.

```python
def get_interaction_history(self, limit: int = 20) -> List[Dict[str, Any]]
```

**Example:**
```python
recent = state.get_interaction_history(limit=5)
for interaction in recent:
    print(f"{interaction['type']}: {interaction['content']}")
```

---

##### `get_knowledge_base()`

Lấy knowledge base.

```python
def get_knowledge_base(
    self,
    category: Optional[str] = None
) -> Dict[str, Any]
```

**Example:**
```python
# All knowledge
all_knowledge = state.get_knowledge_base()

# Filter by category
tech_stack = state.get_knowledge_base(category="tech_stack")
```

---

##### `get_session_history()`

Lấy session history.

```python
def get_session_history(self, limit: int = 10) -> List[Dict[str, Any]]
```

**Example:**
```python
sessions = state.get_session_history(limit=3)
for session in sessions:
    print(f"{session['start_time']}: {session['session_data']['goal']}")
```

---

##### `recall_information()`

Recall thông tin theo query.

```python
def recall_information(self, query: str) -> List[Dict[str, Any]]
```

**Returns:** List với `type`, `data`, `relevance`

**Example:**
```python
results = state.recall_information("PostgreSQL")
for r in results:
    print(f"{r['type']} ({r['relevance']}): {r['data']}")
```

---

##### `save_profile()`

Save profile to persistent storage.

```python
def save_profile(self) -> None
```

**Usage:** Tự động gọi sau khi update preferences/knowledge.

---

### `CrossSessionIntelligenceEngine`

High-level engine cho cross-session intelligence.

#### Constructor

```python
def __init__(self)
```

#### Methods

##### `get_state_manager()`

Get or create state manager.

```python
def get_state_manager(self, user_id: str) -> CrossSessionStateManager
```

**Example:**
```python
engine = CrossSessionIntelligenceEngine()
state = engine.get_state_manager("user:123")
```

---

##### `personalize_response()`

Personalize response dựa trên user data.

```python
def personalize_response(
    self,
    user_id: str,
    response: str
) -> str
```

**Example:**
```python
base_response = "Here's your code..."
personalized = engine.personalize_response("user:123", base_response)
# → "Here's your code... (Based on your preferences: language: vi)"
```

---

##### `build_context_from_history()`

Build context từ history.

```python
def build_context_from_history(
    self,
    user_id: str,
    topic: str
) -> str
```

**Example:**
```python
context = engine.build_context_from_history("user:123", "PostgreSQL")
# → "Context for 'PostgreSQL': - tech_stack.database: PostgreSQL 15..."
```

---

## Utility Functions

### `create_cross_session_engine()`

```python
def create_cross_session_engine() -> CrossSessionIntelligenceEngine
```

---

## Use Cases

### 1. User Preference Persistence

```python
from src.core.cross_session_intelligence import CrossSessionStateManager

state = CrossSessionStateManager("user:123")

# Lưu preferences
state.update_preferences({
    "coding_style": "functional",
    "preferred_language": "TypeScript",
    "auto_commit": True
})

# Sessions sau tự động apply
prefs = state.get_user_preferences()
```

---

### 2. Knowledge Base cho Project

```python
state = CrossSessionStateManager("project:myapp")

# Lưu tech stack info
state.add_to_knowledge_base("architecture", "pattern", "MVC")
state.add_to_knowledge_base("deps", "express", "4.18.2")
state.add_to_knowledge_base("deps", "react", "18.2.0")

# Query khi cần
tech = state.get_knowledge_base(category="deps")
```

---

### 3. Session Continuity

```python
state = CrossSessionStateManager("user:456")

# Record session
state.record_session({
    "goal": "Add OAuth2 authentication",
    "status": "in_progress",
    "next_steps": ["Implement callback", "Add tests"]
})

# Session sau: recall context
context = state.recall_information("OAuth2")
print(f"Previous work: {context}")
```

---

### 4. Intelligent Response Personalization

```python
engine = CrossSessionIntelligenceEngine()

# User preferences
state = engine.get_state_manager("user:789")
state.update_preferences({
    "verbosity": "detailed",
    "include_examples": True,
    "prefer_async": True
})

# Personalize response
response = engine.personalize_response(
    "user:789",
    "Here's the function..."
)
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              CrossSessionIntelligenceEngine                   │
├──────────────────────────────────────────────────────────────┤
│  state_managers: Dict[user_id → StateManager]                │
├──────────────────────────────────────────────────────────────┤
│  get_state_manager() ──→ Get/Create per user                │
│  personalize_response() ──→ Add preferences to response      │
│  build_context_from_history() ──→ Query & Format             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                 CrossSessionStateManager                      │
├──────────────────────────────────────────────────────────────┤
│  profile: UserProfile                                        │
│  memory: MemoryFacade                                        │
│  local_storage: ~/.mekong/cross_session_profiles/            │
├──────────────────────────────────────────────────────────────┤
│  update_preferences() ──→ Memory + Local                     │
│  add_interaction() ──→ History + Store                       │
│  add_to_knowledge_base() ──→ Category Key-Value              │
│  record_session() ──→ Session Record                         │
│  get_*() ──→ Retrieve from Memory + Local                    │
│  recall_information() ──→ Search All Sources                 │
│  save_profile() ──→ Persist Changes                          │
└──────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                     UserProfile                               │
├──────────────────────────────────────────────────────────────┤
│  preferences: Dict[str, Any]                                 │
│  interaction_history: List[Dict]                             │
│  knowledge_base: Dict[category → Dict[key → value]]          │
│  session_history: List[Dict]                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Storage Format

### User Preferences
```json
{
  "type": "user_preference",
  "user_id": "user:123",
  "preferences": {"language": "vi", "timezone": "Asia/Saigon"},
  "timestamp": "2026-03-05T11:00:00"
}
```

### Interaction
```json
{
  "type": "user_interaction",
  "user_id": "user:123",
  "interaction": {
    "id": "uuid",
    "type": "command",
    "content": "/cook create API",
    "timestamp": "2026-03-05T11:00:00",
    "metadata": {"agent": "fullstack-developer"}
  }
}
```

### Knowledge
```json
{
  "type": "user_knowledge",
  "user_id": "user:123",
  "category": "tech_stack",
  "key": "database",
  "value": "PostgreSQL 15",
  "timestamp": "2026-03-05T11:00:00"
}
```

### Session Record
```json
{
  "type": "session_record",
  "user_id": "user:123",
  "session": {
    "id": "uuid",
    "start_time": "2026-03-05T11:00:00",
    "session_data": {"goal": "Add OAuth2"}
  }
}
```

---

## Local Storage Paths

```
~/.mekong/cross_session_profiles/
├── user_123.json
├── project_myapp.json
└── default_user456.json
```

**Retention:** 10 most recent profile records per user.

---

## Logging

```python
logger.debug("CrossSessionStateManager initialized for %s", user_id)
logger.warning("Could not save to local storage: %s", error)
```

---

## Related Modules

- [`Context Manager API`](./context-manager-api.md) - Conversation context
- [`Prompt Cache API`](./prompt-cache-api.md) - Prompt caching
- [`Memory Facade`](../memory_facade.py) - Storage backend

---

**Last Updated:** 2026-03-05
**Version:** 1.0.0
**Status:** Production Ready

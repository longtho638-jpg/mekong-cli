# Context Manager API Reference

> **Module:** `src/core/context_manager.py`
> **Purpose:** Quản lý ngữ cảnh hội thoại sử dụng memory system
> **Pattern:** Vector storage + Local JSON backup

---

## Classes

### `ContextManager`

Quản lý context cho một user/session cụ thể.

#### Constructor

```python
def __init__(self, user_id: str)
```

**Params:**
- `user_id` (str): Định danh user/session (format: `agent:session`)

**Example:**
```python
from src.core.context_manager import ContextManager

# Initialize với user ID
ctx = ContextManager("chat:user123")

# Nếu không có format agent:session, tự động thêm "default:"
ctx = ContextManager("session456")  # → "default:session456"
```

---

#### Methods

##### `store_interaction()`

Lưu một lượt tương tác vào memory.

```python
def store_interaction(
    user_message: str,
    agent_response: str,
    metadata: Optional[Dict] = None
) -> bool
```

**Returns:** `True` nếu lưu vào vector backend, `False` nếu dùng YAML fallback

**Example:**
```python
ctx.store_interaction(
    user_message="Tạo API endpoint mới",
    agent_response="Đã tạo endpoint /api/users",
    metadata={"step": "completed", "duration": 2.5}
)
```

---

##### `retrieve_context()`

Lấy lại context từ memory.

```python
def retrieve_context(
    query: str = None,
    limit: int = 5
) -> List[Dict[str, Any]]
```

**Params:**
- `query` (str, optional): Tìm kiếm context cụ thể
- `limit` (int): Số lượng context tối đa

**Returns:** List các context dictionaries

**Example:**
```python
# Lấy 5 context gần nhất
contexts = ctx.retrieve_context(limit=5)

# Tìm context về "API"
contexts = ctx.retrieve_context(query="API", limit=3)

# Cấu trúc mỗi context:
# {
#     "type": "conversation_interaction",
#     "user_message": "...",
#     "agent_response": "...",
#     "timestamp": "2026-03-05T11:00:00",
#     "metadata": {...}
# }
```

---

##### `summarize_context()`

Tóm tắt context hội thoại.

```python
def summarize_context(
    context_items: List[Dict]
) -> Dict[str, Any]
```

**Returns:**
```python
{
    "total_interactions": 10,
    "topics_discussed": ["API", "endpoint", "database", ...],
    "last_interaction": {...},
    "summary": "Conversation includes 10 interactions about: API, endpoint..."
}
```

---

##### `get_recent_interactions()`

Lấy các tương tác gần nhất.

```python
def get_recent_interactions(count: int = 3) -> List[Dict[str, Any]]
```

**Example:**
```python
recent = ctx.get_recent_interactions(count=3)
for interaction in recent:
    print(f"{interaction['timestamp']}: {interaction['user_message']}")
```

---

##### `has_context_about()`

Kiểm tra có context về topic cụ thể.

```python
def has_context_about(topic: str) -> bool
```

**Example:**
```python
if ctx.has_context_about("authentication"):
    print("User đã hỏi về auth trước đó")
```

---

### `ContextAwareAgent`

Agent tạo response có context-awareness.

#### Constructor

```python
def __init__(self, user_id: str)
```

#### Methods

##### `respond()`

Tạo response dựa trên input và context.

```python
def respond(self, user_input: str) -> str
```

**Example:**
```python
from src.core.context_manager import ContextAwareAgent

agent = ContextAwareAgent("chat:user123")

# First interaction
response = agent.respond("Xin chào")
# → "Hello! I'm your context-aware assistant..."

# Later interaction
response = agent.respond("API endpoint là gì?")
# → "Welcome back! We were discussing API..."
```

---

## Utility Functions

### `create_context_aware_conversation()`

Factory function tạo ContextAwareAgent.

```python
def create_context_aware_conversation(user_id: str) -> ContextAwareAgent
```

**Example:**
```python
from src.core.context_manager import create_context_aware_conversation

agent = create_context_aware_conversation("user123")
response = agent.respond("Help me with API design")
```

---

## Use Cases

### 1. Conversation History Tracking

```python
from src.core.context_manager import ContextManager

ctx = ContextManager("support:ticket123")

# Lưu từng lượt hội thoại
ctx.store_interaction(
    user_message="API của tôi bị lỗi 500",
    agent_response="Đang kiểm tra logs..."
)

# Khi user reply, lấy context
previous = ctx.get_recent_interactions(count=5)
```

---

### 2. Context-Aware Q&A

```python
from src.core.context_manager import ContextAwareAgent

agent = ContextAwareAgent("help:user456")

# User hỏi nhiều câu liên tiếp
agent.respond("How to create REST API?")
agent.respond("What about authentication?")  # Có context từ câu trước
agent.respond("Show me code example")  # Vẫn nhớ topic API
```

---

### 3. Topic-Based Recall

```python
ctx = ContextManager("project:myapp")

# Kiểm tra user đã hỏi về topic chưa
if ctx.has_context_about("database"):
    contexts = ctx.retrieve_context(query="database", limit=3)
    print("Previous database discussions:", contexts)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ContextManager                         │
├─────────────────────────────────────────────────────────┤
│  user_id: str                                           │
│  memory: MemoryFacade                                   │
│  local_storage_path: Path                               │
│  local_context_file: Path                               │
├─────────────────────────────────────────────────────────┤
│  store_interaction() ──→ Memory + Local JSON           │
│  retrieve_context() ──→ Memory Search + Local Fallback │
│  summarize_context() ──→ Topics + Stats                │
│  get_recent_interactions() ──→ Last N items            │
│  has_context_about() ──→ Query & Check                 │
└─────────────────────────────────────────────────────────┘
```

---

## Storage Details

### Vector Memory (Primary)

- **Provider:** ChromaDB / Qdrant / etc.
- **Format:** JSON string trong `memory` field
- **Metadata:** `interaction_type`, `timestamp`, `user_id`

### Local JSON (Backup)

- **Path:** `~/.mekong/contexts/{user_id}.json`
- **Retention:** 100 interactions gần nhất
- **Format:**
```json
[
  {
    "type": "conversation_interaction",
    "user_message": "...",
    "agent_response": "...",
    "timestamp": "2026-03-05T11:00:00",
    "metadata": {...}
  }
]
```

---

## Logging

Module sử dụng `logging` thay vì `print()`:

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("ContextManager initialized for %s", user_id)
logger.warning("Could not save to local storage: %s", error)
```

---

## Related Modules

- [`PromptCache API`](./prompt-cache-api.md) - Cache prompts
- [`Cross-Session Intelligence API`](./cross-session-intelligence-api.md) - User profile & knowledge
- [`Memory Facade`](../memory_facade.py) - Backend storage abstraction

---

**Last Updated:** 2026-03-05
**Version:** 1.0.0
**Status:** Production Ready

# Prompt Cache API Reference

> **Module:** `src/core/prompt_cache.py`
> **Purpose:** Cache và retrieve prompts dựa trên similarity matching
> **Pattern:** Vector similarity + Local JSON backup + Outcome scoring

---

## Classes

### `PromptCache`

Cache prompts để tái sử dụng và cải thiện hiệu suất AI interactions.

#### Constructor

```python
def __init__(self, user_id: str = "system:prompt_cache")
```

**Params:**
- `user_id` (str): Định danh prompt cache (format: `agent:session`)

**Example:**
```python
from src.core.prompt_cache import PromptCache

# Default system cache
cache = PromptCache()

# Custom cache per agent
cache = PromptCache("coder:session123")
```

---

#### Methods

##### `store_prompt()`

Lưu prompt và response vào cache.

```python
def store_prompt(
    prompt: str,
    response: str,
    outcome_score: float = 1.0,
    metadata: Optional[Dict] = None
) -> bool
```

**Params:**
- `prompt` (str): Prompt text
- `response` (str): Response generated
- `outcome_score` (float): Score 0.0-1.0 đánh giá hiệu quả
- `metadata` (dict): Metadata bổ sung

**Returns:** `True` nếu lưu vào vector backend, `False` nếu YAML fallback

**Example:**
```python
cache.store_prompt(
    prompt="Create a FastAPI endpoint for user login",
    response="from fastapi import APIRouter...\nrouter = APIRouter()",
    outcome_score=0.9,  # High quality response
    metadata={"model": "gemini-pro", "tokens": 1500}
)
```

---

##### `find_similar_prompts()`

Tìm prompts tương tự dựa trên similarity threshold.

```python
def find_similar_prompts(
    query_prompt: str,
    threshold: float = 0.7,
    limit: int = 5
) -> List[Dict[str, Any]]
```

**Params:**
- `query_prompt` (str): Prompt để tìm similarity
- `threshold` (float): Minimum similarity 0.0-1.0
- `limit` (int): Số prompts tối đa

**Returns:** List của prompt dictionaries với `similarity_score`

**Example:**
```python
similar = cache.find_similar_prompts(
    query_prompt="Create REST API endpoint",
    threshold=0.6,
    limit=3
)

# Kết quả:
# [
#   {
#     "prompt_text": "Build REST API for...",
#     "response_text": "...",
#     "outcome_score": 0.85,
#     "similarity_score": 0.78,
#     "prompt_hash": "abc123..."
#   }
# ]
```

---

##### `get_cached_response()`

Lấy response cached cho prompt tương tự.

```python
def get_cached_response(
    query_prompt: str,
    min_outcome_score: float = 0.5
) -> Optional[Tuple[str, Dict]]
```

**Returns:** `(response_text, metadata)` hoặc `None`

**Example:**
```python
result = cache.get_cached_response(
    query_prompt="How to implement JWT authentication?",
    min_outcome_score=0.7
)

if result:
    response, metadata = result
    print(f"Found cached response (score: {metadata['outcome_score']})")
else:
    print("No suitable cached response")
```

---

##### `get_top_prompts()`

Lấy top prompts theo outcome score.

```python
def get_top_prompts(limit: int = 10) -> List[Dict[str, Any]]
```

**Example:**
```python
top_prompts = cache.get_top_prompts(limit=5)
for prompt in top_prompts:
    print(f"Score {prompt['outcome_score']}: {prompt['prompt_text'][:50]}...")
```

---

##### `update_prompt_outcome()`

Cập nhật outcome score cho prompt đã lưu.

```python
def update_prompt_outcome(
    prompt: str,
    new_outcome_score: float,
    additional_metadata: Optional[Dict] = None
)
```

**Example:**
```python
# Sau khi user feedback response tốt
cache.update_prompt_outcome(
    prompt="Create login endpoint",
    new_outcome_score=0.95,
    additional_metadata={"feedback": "user_liked"}
)
```

---

##### `_generate_prompt_hash()`

Tạo SHA256 hash cho prompt.

```python
def _generate_prompt_hash(prompt: str) -> str
```

**Example:**
```python
hash_val = cache._generate_prompt_hash("My prompt")
# → "a1b2c3d4e5f6..." (64 chars hex)
```

---

##### `_calculate_similarity()`

Tính similarity score giữa 2 texts (Jaccard).

```python
def _calculate_similarity(text1: str, text2: str) -> float
```

**Example:**
```python
similarity = cache._calculate_similarity(
    "Create REST API",
    "Build REST API endpoint"
)
# → 0.5 (50% word overlap)
```

---

### `IntelligentPromptManager`

High-level manager cho prompt caching thông minh.

#### Constructor

```python
def __init__(self, user_id: str = "system:intelligent_prompt_manager")
```

#### Methods

##### `get_response_or_generate()`

Get cached response hoặc generate mới.

```python
def get_response_or_generate(
    prompt: str,
    generator_func: Callable,
    *args,
    **kwargs
) -> str
```

**Example:**
```python
from src.core.prompt_cache import IntelligentPromptManager

manager = IntelligentPromptManager()

def generate_response(prompt):
    # Call LLM here
    return llm.generate(prompt)

response = manager.get_response_or_generate(
    prompt="Explain dependency injection",
    generator_func=generate_response
)
```

---

##### `evaluate_and_update_cache()`

Evaluate và update cache sau khi có response.

```python
def evaluate_and_update_cache(
    prompt: str,
    response: str,
    outcome_evaluation: float
)
```

**Example:**
```python
response = manager.get_response_or_generate(prompt, generator)

# User feedback: response hữu ích
manager.evaluate_and_update_cache(
    prompt=prompt,
    response=response,
    outcome_evaluation=0.9
)
```

---

##### `get_suggestions_for_topic()`

Gợi ý prompts thành công cho topic.

```python
def get_suggestions_for_topic(topic: str) -> List[Dict[str, Any]]
```

**Example:**
```python
suggestions = manager.get_suggestions_for_topic("FastAPI")
for s in suggestions:
    print(f"Prompt: {s['prompt_text']} (score: {s['outcome_score']})")
```

---

## Utility Functions

### `create_intelligent_prompt_manager()`

Factory function tạo IntelligentPromptManager.

```python
def create_intelligent_prompt_manager(
    user_id: str = "system:default_prompt_manager"
) -> IntelligentPromptManager
```

---

## Use Cases

### 1. Cache LLM Responses để Giảm Chi Phí

```python
from src.core.prompt_cache import PromptCache

cache = PromptCache("coder:session1")

def generate_code(prompt):
    # Đắt tiền - gọi LLM
    return llm.generate(prompt)

# Lần đầu: generate và cache
code = manager.get_response_or_generate(
    "Create React useState hook example",
    generate_code
)

# Lần sau: lấy từ cache (free)
code = manager.get_response_or_generate(
    "Create React useState hook example",  # Giống
    generate_code
)
```

---

### 2. A/B Testing Prompts

```python
cache = PromptCache("experiments:ab_test")

# Test 2 versions của cùng 1 prompt
cache.store_prompt(
    prompt="Explain OOP concepts simply",
    response="OOP là lập trình hướng đối tượng...",
    outcome_score=0.7,
    metadata={"version": "A"}
)

cache.store_prompt(
    prompt="Explain OOP concepts simply",
    response="Object-Oriented Programming uses objects...",
    outcome_score=0.9,
    metadata={"version": "B"}
)

# Lấy version tốt hơn
top = cache.get_top_prompts(limit=1)
print(f"Best: {top[0]['metadata']['version']}")
```

---

### 3. Prompt Optimization Workflow

```python
manager = IntelligentPromptManager()

def generate(prompt):
    return llm.generate(prompt)

# Initial generation
prompt = "Write Python unit tests for calculator"
response = manager.get_response_or_generate(prompt, generate)

# User rates response 4/5 stars
manager.evaluate_and_update_cache(
    prompt=prompt,
    response=response,
    outcome_evaluation=0.8
)

# Later: Get suggestions for similar topics
suggestions = manager.get_suggestions_for_topic("testing")
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PromptCache                           │
├─────────────────────────────────────────────────────────┤
│  user_id: str                                           │
│  memory: MemoryFacade                                   │
│  local_cache_file: Path                                 │
├─────────────────────────────────────────────────────────┤
│  store_prompt() ──→ Hash + Store + Score               │
│  find_similar_prompts() ──→ Jaccard Similarity         │
│  get_cached_response() ──→ Threshold + Score Filter    │
│  get_top_prompts() ──→ Sort by Outcome                 │
│  update_prompt_outcome() ──→ Add Updated Record        │
└─────────────────────────────────────────────────────────┘
            ↓
┌───────────────────────┐    ┌──────────────────────┐
│   Vector Memory       │    │   Local JSON Backup  │
│   (ChromaDB/Qdrant)   │    │  (~/.mekong/prompt_  │
│   Primary storage     │    │   cache/*.json)      │
└───────────────────────┘    └──────────────────────┘
```

---

## Storage Format

### Vector Memory

```json
{
  "type": "cached_prompt",
  "prompt_text": "Create FastAPI endpoint",
  "response_text": "from fastapi import...",
  "outcome_score": 0.85,
  "prompt_hash": "sha256:abc123...",
  "timestamp": "2026-03-05T11:00:00",
  "metadata": {"model": "gemini", "tokens": 500}
}
```

### Local Backup

- **Path:** `~/.mekong/prompt_cache/{user_id}.json`
- **Retention:** 200 prompts gần nhất
- **Same format as vector memory**

---

## Similarity Algorithm

**Jaccard Index:**

```python
def _calculate_similarity(text1, text2):
    words1 = set(text1.split())
    words2 = set(text2.split())
    intersection = words1 ∩ words2
    union = words1 ∪ words2
    return len(intersection) / len(union)
```

**Example:**
```
text1 = "Create REST API endpoint"
text2 = "Build REST API for users"

words1 = {"Create", "REST", "API", "endpoint"}
words2 = {"Build", "REST", "API", "for", "users"}
intersection = {"REST", "API"} = 2
union = {"Create", "Build", "REST", "API", "endpoint", "for", "users"} = 7
similarity = 2/7 = 0.286 (28.6%)
```

---

## Logging

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Retrieved cached response with %.2f similarity", score)
logger.debug("No suitable cached response found, generating new")
logger.warning("Could not save to local storage: %s", error)
```

---

## Related Modules

- [`Context Manager API`](./context-manager-api.md) - Conversation context
- [`Cross-Session Intelligence API`](./cross-session-intelligence-api.md) - User profiles
- [`Memory Facade`](../memory_facade.py) - Storage backend

---

**Last Updated:** 2026-03-05
**Version:** 1.0.0
**Status:** Production Ready

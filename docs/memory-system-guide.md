# Mekong CLI Memory System Guide

## Overview

The Mekong CLI includes a sophisticated memory system designed to store and retrieve conversational context and other relevant information. The system features dual storage backends with automatic fallback:

- **Primary**: Mem0 + Qdrant (semantic vector search)
- **Fallback**: YAML-based storage (keyword/string search)

## Architecture

### Memory Facade Pattern

The system uses a facade pattern that abstracts the underlying storage mechanism:

```python
from packages.memory.memory_facade import get_memory_facade

# Get singleton instance
memory = get_memory_facade()

# Connect to storage backend
memory.connect()

# Use unified interface regardless of backend
memory.add("Some content", user_id="user:session")
results = memory.search("query", user_id="user:session")
```

### Storage Backend Selection

The system automatically selects the appropriate backend based on availability:

1. If Qdrant is running and accessible → Use Mem0 + Qdrant
2. If Qdrant is unavailable → Fall back to YAML storage
3. The API remains consistent regardless of the active backend

## Installation & Setup

### Dependencies

The memory system requires two main dependencies:
- `mem0ai` - Memory management with semantic search
- `qdrant-client` - Vector database client

These are included as optional dependencies in the Poetry configuration:

```toml
[tool.poetry.group.memory.dependencies]
mem0ai = "^0.1.0"
qdrant-client = "^1.7.0"
```

To install with memory dependencies:
```bash
poetry install --with memory
```

### Configuration

The system uses environment variables for configuration:

- `QDRANT_URL` - URL for Qdrant server (default: http://localhost:6333)
- `QDRANT_COLLECTION` - Collection name for vector storage (default: mekong_agent_memory)

## Usage

### Basic Operations

```python
from packages.memory.memory_facade import get_memory_facade

# Initialize and connect
memory = get_memory_facade()
memory.connect()

# Add a memory entry
user_id = "agent:session_123"
content = "User mentioned interest in feature X"
added = memory.add(content, user_id=user_id)

# Search for relevant memories
results = memory.search("feature X", user_id=user_id)

# Check system status
status = memory.get_provider_status()
print(f"Active provider: {status['active_provider']}")
```

### User ID Scoping

User IDs should follow the format `{agent}:{session}` to provide proper isolation:
- `agent_name:session_id` - For agent-specific sessions
- `user_id:conversation_id` - For user conversations

### Metadata Support

When adding memories, you can include metadata:

```python
metadata = {
    "timestamp": "2026-03-04T21:30:00Z",
    "source": "user_input",
    "category": "intent"
}

memory.add("Content", user_id="user:session", metadata=metadata)
```

## Development & Testing

### Running Tests

The system includes comprehensive tests in `tests/test_memory_qdrant.py` for the vector storage layer.

### Integration with Features

To integrate memory functionality with your feature:

1. Import the facade: `from packages.memory.memory_facade import get_memory_facade`
2. Use the unified interface (no need to check which backend is active)
3. Handle cases where no relevant memories are found (returns empty list)

## Troubleshooting

### Common Issues

1. **Qdrant Connection Refused**: This is normal in development environments without Qdrant running. The system will automatically fall back to YAML storage.

2. **No Dependencies Warning**: If you see warnings about missing dependencies, install with the memory group: `poetry install --with memory`

3. **Empty Search Results**: May indicate either no relevant memories exist or the vector store is not active.

### Checking Status

```python
status = memory.get_provider_status()
# Returns: {
#   'vector_ready': bool,
#   'qdrant_connected': bool,
#   'mem0_available': bool,
#   'active_provider': 'mem0+qdrant' | 'yaml'
# }
```

## Performance Considerations

- YAML storage has slower search performance than vector storage
- For production deployments with heavy usage, consider running Qdrant for optimal performance
- The fallback mechanism ensures functionality even without vector storage

## Example Implementation

The `memory_chat_demo.py` provides a practical example of using the memory system in a chat context.
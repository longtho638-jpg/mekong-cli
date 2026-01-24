# Claude-Mem Integration

> **Persistent Memory for AgencyOS**

Claude-Mem provides persistent memory capabilities to Claude Code, allowing it to retain context across sessions using vector search and a lightweight database.

## Features

- **Persistent Context**: Remembers project details, decisions, and user preferences.
- **Vector Search**: Semantic search over past memories.
- **Automatic Storage**: Compresses and stores session summaries.
- **Web Interface**: Visualization of memory at http://localhost:37777

## Installation

Claude-Mem is configured as an MCP server in `.claude/mcp.json`.

```json
{
  "mcpServers": {
    "claude-mem": {
      "command": "npx",
      "args": ["-y", "claude-mem"]
    }
  }
}
```

## Usage

### Tools

- **`store_memory`**: Store a new memory snippet.
- **`search_memory`**: Retrieve relevant memories based on a query.
- **`get_timeline`**: Retrieve recent activity timeline.

### Workflow

1. **Automatic**: The system automatically stores summaries at the end of sessions (if hooks are configured).
2. **Manual**: Use `store_memory` to save critical architectural decisions.
3. **Retrieval**: Agents can use `search_memory` to recall past context.

## Troubleshooting

- **ChromaDB Errors**: Ensure `CHROMA_MCP_TOOLS.json` is configured if using external Chroma.
- **Connection**: Check if the server is running on port 37777.

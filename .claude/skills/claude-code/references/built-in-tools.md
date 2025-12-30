# Built-in Tools

Claude Code's built-in tools for file operations, command execution, web access, and computer interaction.

## Core File Tools

### Read
Read file contents with optional line range.
- `file_path`: Absolute path (required)
- `offset`, `limit`: Line range (optional)

### Write
Create or overwrite files.
- `file_path`: Absolute path (required)
- `content`: File content (required)

### Edit
Replace exact text matches.
- `file_path`: Absolute path (required)
- `old_string`: Text to replace (required)
- `new_string`: Replacement text (required)
- `replace_all`: Replace all occurrences (optional)

### Glob
Find files by pattern.
- `pattern`: Glob pattern (e.g., `**/*.ts`)
- `path`: Search directory (optional)

### Grep
Search file contents with regex.
- `pattern`: Regex pattern (required)
- `path`: Search path (optional)
- `glob`: File filter (optional)
- `output_mode`: `files_with_matches` | `content` | `count`

## Execution Tools

### Bash Tool (bash_20250124)

Persistent bash session with state maintenance.

**Capabilities:**
- Full shell command execution
- Environment variable persistence
- Working directory persistence
- Command chaining across requests

**Parameters:**
- `command`: Shell command (required)
- `restart`: Reset session state (optional)

**Best Practices:**
- Implement timeouts (~30sec default)
- Truncate large outputs (monitor token limits)
- Log commands for audit trail
- Sanitize outputs for sensitive data
- Use isolated environments (Docker/VM)
- Filter dangerous commands (sudo, rm -rf, etc.)

**Token Cost:** 245 input tokens per tool definition

### Code Execution Tool (code_execution_20250825)

Sandboxed Python environment for data analysis and file operations.

**Runtime Environment:**
- Python 3.11.12, Linux-based
- 5GiB RAM, 5GiB disk, 1 CPU
- No internet access (sandboxed)
- 30-day container expiration

**Pre-installed Libraries:**
- pandas, numpy, matplotlib, scikit-learn
- PyArrow, PIL, and more

**Features:**
- File streaming for large content
- Container persistence via `container` ID
- Programmatic tool calling (tools call other tools)
- Batch processing compatible

**Pricing:** $0.05/hour (after 1,550 free hours/month)

## Text Editor Tool (text_editor_20250728)

Structured file editing with commands.

**Commands:**
- `view`: Read file/directory with optional line ranges
- `str_replace`: Replace exact text matches (one match only)
- `create`: Create new files
- `insert`: Insert text at specific lines

**Parameters:**
- `max_characters`: Truncate large files (Claude 4 only)

**Best Practices:**
- Create file backups before editing
- Validate exact text matches
- Check syntax after modifications
- Be explicit about file paths

**Token Cost:** 700 input tokens

## Computer Use Tool (computer_20250124)

GUI automation via screenshots and input simulation.

**Capabilities:**
- Screenshot capture
- Mouse control (click, drag, move, scroll)
- Keyboard input (type, shortcuts)
- Right-click, double-click
- **Opus 4.5 only:** `zoom` action for detailed region inspection

**Display Configuration:**
- `display_width_px`, `display_height_px` (required)
- `display_number` (X11 environments)
- `enable_zoom` (Opus 4.5 only)

**Security Considerations:**
- Requires dedicated VM/container with minimal privileges
- Avoid sensitive data & login credentials
- Implement prompt injection classifiers
- URL allowlist to reduce malicious exposure

**Limitations:**
- Latency (slower than direct interaction)
- Computer vision accuracy issues
- No account creation on social platforms

**Token Cost:** 466-499 tokens (system prompt) + 735 tokens per tool

## Memory Tool (memory_20250818)

Persistent context storage across conversations.

**Beta Header:** `context-management-2025-06-27`

**Commands:**
- `view`: List directory or read file with line numbers
- `create`: Create new files
- `str_replace`: Replace text (exact match)
- `insert`: Insert at specific line
- `delete`: Delete files/directories
- `rename`: Move/rename files

**Use Cases:**
- Persist context across conversations
- Build knowledge bases over time
- Track progress in multi-turn workflows
- Store learned patterns

**Key Features:**
- Client-side implementation (you control storage)
- Works with context editing for long workflows
- Path traversal protection essential

## Search Tools

### Tool Search Tool (tool_search_tool_regex/bm25_20251119)

Dynamically discover tools from massive catalogs.

**Two Variants:**
- **Regex**: Python regex patterns (case-sensitive, max 200 chars)
- **BM25**: Natural language queries

**When to Use:**
- 10+ tools in catalog
- Tool definitions >10K tokens
- Growing tool libraries

**Features:**
- Returns 3-5 most relevant tools per search
- Works with MCP servers (200+ tools)
- Deferred tool loading via `defer_loading: true`
- Compatible with prompt caching

### Web Search Tool (web_search_20250305)

Real-time web search with citations.

**Parameters:**
- `max_uses`: Limit search count
- `allowed_domains` / `blocked_domains`: Filter results
- `user_location`: Localize by city/timezone
- Wildcard support: `example.com/*`

**Features:**
- Automatic source citations
- Location-aware results
- Domain filtering

**Pricing:** $10 per 1,000 searches

### Web Fetch Tool (web_fetch_20250910)

Fetch full content from URLs.

**Parameters:**
- `max_uses`: Limit fetches
- `allowed_domains` / `blocked_domains`: Domain filtering
- `max_content_tokens`: Control token consumption
- `citations.enabled`: Toggle citations

**Features:**
- PDF text extraction
- Citation support
- Content length limits

**Constraints:**
- Cannot construct arbitrary URLs (security)
- Only fetches URLs from user messages/search results
- No JavaScript-rendered content
- Content may be cached

**Pricing:** No additional cost (standard token pricing)

## Tool Combinations

**Web research pattern:**
Web search → Web fetch → Analysis

**Long workflow pattern:**
Memory + Code execution + Context editing

**Large catalog pattern:**
Tool search + MCP for 100+ tools

## Security Best Practices

1. **Sandbox all execution environments**
2. **Implement request validation**
3. **Filter dangerous commands**
4. **Path traversal protection**
5. **Domain allowlisting for web tools**
6. **Rate limiting on all operations**
7. **Timeout handling for all tools**

## See Also

- Tool use documentation: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview.md
- Computer use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool.md
- Memory tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool.md

# Advanced Features

Extended thinking, effort parameter, prompt caching, checkpointing, and memory management in Claude Code.

## Extended Thinking

Deep reasoning for complex problems. Supported in: Sonnet 3.7, Sonnet 4/4.5, Haiku 4.5, Opus 4/4.1/4.5.

### Enable Extended Thinking

**Global configuration:**
```bash
claude config set thinking.enabled true
claude config set thinking.budget 15000
```

**Project settings (.claude/settings.json):**
```json
{
  "thinking": {
    "enabled": true,
    "budget": 10000,
    "mode": "auto"
  }
}
```

**Command-line flag:**
```bash
claude --thinking "architect microservices system"
```

**API usage:**
```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # Min 1,024, no strict upper limit
    },
    messages=[...]
)
```

### Thinking Modes

**auto**: Claude decides when to use extended thinking
**manual**: User explicitly requests thinking
**disabled**: No extended thinking

### Summarized Thinking (Claude 4 Models)

Claude 4 models return **summary** of full thinking (billed for full thinking, not summary). Reduces context bloat while preserving reasoning quality.

### Interleaved Thinking (Beta)

Think between tool calls for sophisticated multi-step workflows. Enable with beta header.

### Budget Control

Set token budget for thinking:

```json
{
  "thinking": {
    "budget": 10000,      // Max tokens for thinking
    "budgetPerRequest": 5000,  // Per-request limit
    "adaptive": true      // Adjust based on task complexity
  }
}
```

**Note:** Higher budgets = slower responses but potentially better quality. For budgets >32K, use batch API.

### Best Use Cases

- Architecture design
- Complex algorithm development
- System refactoring
- Performance optimization
- Security analysis
- Bug investigation

## Effort Parameter (Opus 4.5 Only)

Control token expenditure across entire response (text, tool calls, thinking).

**Beta header required:** `effort-2025-11-24`

### Effort Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| high | Maximum quality, unrestricted tokens (default) | Complex reasoning, difficult coding |
| medium | Balanced approach, moderate savings | Agentic tasks needing speed/cost balance |
| low | Most efficient, significant capability reduction | Simple classification, high-volume automation |

### Implementation

```python
response = client.beta.messages.create(
    model="claude-opus-4-5-20251101",
    betas=["effort-2025-11-24"],
    max_tokens=4096,
    messages=[...],
    output_config={"effort": "medium"}
)
```

### Combining with Extended Thinking

- Use **effort** to control overall token budget
- Use **thinking budget** to limit thinking specifically
- High effort + high thinking = best for complex reasoning

## Prompt Caching

Reduce costs by caching repeated context. Cache hit = 10% of base input token cost (90% savings).

### Enable Caching

**API usage:**
```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    system=[
        {"type": "text", "text": "Instructions..."},
        {
            "type": "text",
            "text": "[Large cached context/doc]",
            "cache_control": {"type": "ephemeral"}  # Mark for caching
        }
    ],
    messages=[{"role": "user", "content": "[New query]"}]
)
```

### Pricing (per MTok)

| Operation | Cost Multiplier |
|-----------|-----------------|
| Cache write (5-min TTL) | 1.25x base input |
| Cache write (1-hour TTL) | 2x base input |
| Cache read | 0.1x base input (90% discount) |

Example: 100K cached tokens read = $0.30 (Sonnet 4.5)

### Best Practices

- Place static content first (system, tools, context)
- Set 1 breakpoint at end of static content (system auto-checks up to 20 blocks back)
- Use 4 breakpoints max for different change frequencies
- Minimum cacheable: 1024-4096 tokens (model-dependent)
- TTL: 5 minutes default (auto-refreshed free), 1-hour optional (extra cost)

### What Invalidates Cache

- Tool definition changes = full reset
- Web search/citations toggle = system cache only
- Images added/removed = messages cache only
- Thinking param changes = messages cache only

### Tracking Cache Usage

Response includes:
- `cache_creation_input_tokens`: New content written to cache
- `cache_read_input_tokens`: Content read from cache
- `input_tokens`: Uncached content (after last breakpoint)

## Checkpointing

Automatically track and rewind changes.

### Enable Checkpointing

```bash
claude config set checkpointing.enabled true
```

**Settings:**
```json
{
  "checkpointing": {
    "enabled": true,
    "autoSave": true,
    "interval": 300,
    "maxCheckpoints": 50
  }
}
```

### View Checkpoints

```bash
# List checkpoints
claude checkpoint list

# View checkpoint details
claude checkpoint show checkpoint-123
```

### Restore Checkpoint

```bash
# Restore to checkpoint
claude checkpoint restore checkpoint-123

# Restore to time
claude checkpoint restore --time "2025-11-06T10:00:00Z"

# Restore specific files
claude checkpoint restore checkpoint-123 --files src/main.js
```

### Create Manual Checkpoint

```bash
# Create checkpoint with message
claude checkpoint create "before refactoring auth module"

# Create at important moments
claude checkpoint create "working state before experiment"
```

### Checkpoint Strategies

**Auto-save checkpoints:**
- Before major changes
- After successful tests
- Every N minutes
- Before destructive operations

**Manual checkpoints:**
- Before risky refactors
- At working states
- Before experiments
- After milestones

### Example Workflow

```bash
# Create checkpoint before risky change
claude checkpoint create "before performance optimization"

# Make changes
claude "optimize database queries for 10x performance"

# If something breaks
claude checkpoint restore "before performance optimization"

# Or continue with improvements
claude checkpoint create "performance optimization complete"
```

## Memory Management

Control how Claude remembers context across sessions.

### Memory Locations

**global**: Share memory across all projects
**project**: Project-specific memory
**none**: Disable memory

```bash
# Set memory location
claude config set memory.location project

# Enable memory
claude config set memory.enabled true
```

### Configuration

```json
{
  "memory": {
    "enabled": true,
    "location": "project",
    "ttl": 86400,
    "maxSize": "10MB",
    "autoSummarize": true
  }
}
```

### Memory Operations

```bash
# View stored memories
claude memory list

# View specific memory
claude memory show memory-123

# Clear all memories
claude memory clear

# Clear old memories
claude memory clear --older-than 7d

# Clear project memories
claude memory clear --project
```

### What Gets Remembered

**Automatically:**
- Project structure
- Coding patterns
- Preferences
- Common commands
- File locations

**Explicitly stored:**
- Important context
- Design decisions
- Architecture notes
- Team conventions

### Memory Best Practices

**Project memory:**
- Good for project-specific context
- Shares across team members
- Persists in `.claude/memory/`
- Commit to version control (optional)

**Global memory:**
- Personal preferences
- General knowledge
- Common patterns
- Cross-project learnings

**Disable memory when:**
- Working with sensitive data
- One-off tasks
- Testing/experimentation
- Troubleshooting

### Example

```bash
# Remember project architecture
claude "Remember: This project uses Clean Architecture with:
- Domain layer (core business logic)
- Application layer (use cases)
- Infrastructure layer (external dependencies)
- Presentation layer (API/UI)"

# Claude will recall this in future sessions
claude "Add a new user registration feature"
# Claude: "I'll implement this following the Clean Architecture..."
```

## Context Windows

Manage large context effectively.

### Maximum Context

Model context limits:
- Claude Sonnet: 200k tokens
- Claude Opus: 200k tokens
- Claude Haiku: 200k tokens

### Context Management

```json
{
  "context": {
    "maxTokens": 200000,
    "autoTruncate": true,
    "prioritize": ["recent", "relevant"],
    "summarizeLong": true
  }
}
```

### Strategies

**Summarization:**
- Auto-summarize old context
- Keep summaries of large files
- Compress conversation history

**Prioritization:**
- Recent messages first
- Most relevant files
- Explicit user priorities

**Chunking:**
- Process large codebases in chunks
- Incremental analysis
- Parallel processing

## See Also

- Pricing: https://docs.claude.com/about-claude/pricing
- Token counting: https://docs.claude.com/build-with-claude/token-counting
- Best practices: `references/best-practices.md`
- Configuration: `references/configuration.md`

# Agent SDK

Python/TypeScript library providing Claude Code capabilities programmatically.

## Installation

```bash
# TypeScript
npm install @anthropic-ai/claude-agent-sdk

# Python
pip install claude-agent-sdk
```

## Quick Start

### Python
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Find and fix bugs in auth.py",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Glob"],
        permission_mode="acceptEdits"
    )
):
    print(message)
```

### TypeScript
```typescript
import { query, ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: "Find and fix bugs in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Glob"],
    permissionMode: "acceptEdits"
  }
});
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `allowed_tools` | string[] | Tools agent can use: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, Skill, Task |
| `permission_mode` | string | `acceptEdits`, `bypassPermissions`, `default` |
| `system_prompt` | string | Custom instructions for agent |
| `setting_sources` | string[] | `["user", "project"]` to load Skills/Commands |
| `mcp_servers` | object | MCP server configurations |
| `agents` | object | Subagent definitions |
| `hooks` | object | Hook configurations |
| `cwd` | string | Working directory |
| `max_turns` | number | Maximum conversation turns |
| `model` | string | `opus`, `sonnet`, `haiku` |

## Permission Modes

| Mode | Behavior |
|------|----------|
| `acceptEdits` | Auto-approve file edits, ask for other actions |
| `bypassPermissions` | Run without prompts (CI/CD) |
| `default` | Custom approval via `canUseTool` callback |

## Hooks System

Intercept agent behavior at key execution points.

### Available Hooks

| Hook | Description | TS Only |
|------|-------------|---------|
| `PreToolUse` | Before tool execution | No |
| `PostToolUse` | After tool completion | No |
| `PostToolUseFailure` | After tool failure | Yes |
| `Stop` | Main agent response complete | No |
| `SessionStart` | Session init | Yes |
| `SessionEnd` | Session termination | Yes |
| `UserPromptSubmit` | User prompt submission | No |
| `SubagentStop` | Subagent completion | No |
| `PermissionRequest` | Permission dialog | Yes |
| `Notification` | Notification sent | Yes |

### Hook Example

```python
async def protect_env_files(input_data, tool_use_id, context):
    if input_data['tool_input'].get('file_path', '').endswith('.env'):
        return {
            'hookSpecificOutput': {
                'hookEventName': input_data['hook_event_name'],
                'permissionDecision': 'deny',
                'permissionDecisionReason': 'Cannot modify .env files'
            }
        }
    return {}

options = ClaudeAgentOptions(
    hooks={
        'PreToolUse': [
            HookMatcher(matcher='Write|Edit', hooks=[protect_env_files])
        ]
    }
)
```

## Subagents

Specialized agent instances for parallel execution.

### Define Subagent

```python
from claude_agent_sdk import AgentDefinition

agents = {
    "code-reviewer": AgentDefinition(
        description="Expert code reviewer",
        prompt="Analyze code for quality and security...",
        tools=["Read", "Grep", "Glob"],
        model="sonnet"
    )
}

options = ClaudeAgentOptions(agents=agents)
```

### Filesystem-based Subagents

Create `.claude/agents/agent-name.md`:

```markdown
---
name: code-reviewer
description: Reviews code for quality issues
tools: ["Read", "Grep", "Glob"]
model: sonnet
---

# Code Reviewer Agent

Analyze code for:
- Security vulnerabilities
- Performance issues
- Best practice violations
```

## Custom Tools

Create tools via SDK MCP servers.

### Python Example

```python
from claude_agent_sdk import create_sdk_mcp_server, tool

@tool("get_weather", "Get temperature", {"latitude": float, "longitude": float})
async def get_weather(args):
    # Implementation
    return {"content": [{"type": "text", "text": f"Temperature: 72°F"}]}

custom_server = create_sdk_mcp_server(
    name="weather-tools",
    tools=[get_weather]
)

options = ClaudeAgentOptions(
    mcp_servers={"weather": custom_server}
)
```

### TypeScript Example

```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const weatherTool = tool({
  name: "get_weather",
  description: "Get temperature",
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  handler: async ({ latitude, longitude }) => {
    return { content: [{ type: "text", text: "Temperature: 72°F" }] };
  }
});

const customServer = createSdkMcpServer({
  name: "weather-tools",
  tools: [weatherTool]
});
```

## MCP Integration

Connect external services via MCP servers.

### Transport Types

| Type | Description |
|------|-------------|
| stdio | External process (local) |
| HTTP/SSE | Remote server |
| SDK MCP | In-process (custom tools) |

### Configuration

```python
mcp_servers = {
    "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"}
    },
    "custom": custom_sdk_server
}

options = ClaudeAgentOptions(mcp_servers=mcp_servers)
```

## Skills Integration

Load filesystem-based skills.

```python
# Must set setting_sources to load Skills
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Skill", "Task"],
    setting_sources=["user", "project"]  # Required for Skills
)
```

## Session Management

Maintain context across exchanges.

```python
from claude_agent_sdk import Session

session = Session()

# First exchange
async for msg in session.query("Analyze the codebase"):
    print(msg)

# Continue conversation
async for msg in session.query("Now fix the bugs you found"):
    print(msg)

# Resume later with session ID
resumed = Session.resume(session_id="sess_abc123")
```

## Authentication

```bash
# Default: Anthropic API
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# Alternative: Amazon Bedrock
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...

# Alternative: Google Vertex AI
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export GOOGLE_CLOUD_PROJECT=your-project

# Alternative: Microsoft Azure
export AZURE_OPENAI_ENDPOINT=...
export AZURE_OPENAI_API_KEY=...
```

## Best Practices

### Production Deployment

1. Use `bypassPermissions` for CI/CD
2. Restrict `allowed_tools` to minimum needed
3. Implement hooks for audit logging
4. Set `max_turns` to prevent runaway agents
5. Use custom `canUseTool` for fine-grained control

### Security

1. Validate all tool inputs via hooks
2. Sandbox bash execution
3. Restrict file system access paths
4. Implement rate limiting
5. Log all agent actions

### Performance

1. Use subagents for parallel tasks
2. Minimize context with focused prompts
3. Cache MCP server connections
4. Stream responses for long operations

## See Also

- Agent SDK overview: https://platform.claude.com/docs/en/agent-sdk/overview.md
- Hooks documentation: https://platform.claude.com/docs/en/agent-sdk/hooks.md
- Subagents guide: https://platform.claude.com/docs/en/agent-sdk/subagents.md
- Custom tools: https://platform.claude.com/docs/en/agent-sdk/custom-tools.md

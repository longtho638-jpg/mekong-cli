---
name: claude-code
description: Activate when users ask about Claude Code installation, slash commands (/cook, /plan, /fix, /test, /docs, /design, /git), creating/managing Agent Skills, Agent SDK usage, configuring MCP servers, setting up hooks/plugins, IDE integration (VS Code, JetBrains), CI/CD workflows, enterprise deployment (SSO, RBAC, sandboxing), troubleshooting authentication/performance issues, or advanced features (extended thinking, effort parameter, caching, checkpointing, built-in tools).
---

# Claude Code

Anthropic's agentic coding tool combining autonomous planning, execution, and validation with extensibility through skills, plugins, MCP servers, and hooks.

## Core Concepts

**Subagents**: Specialized agents (planner, code-reviewer, tester, debugger, docs-manager, ui-ux-designer, database-admin)

**Agent Skills**: Modular capabilities with SKILL.md + bundled resources (scripts, references, assets) loaded progressively. Three-level progressive disclosure: metadata (~100 tokens), instructions (<5K tokens), resources (on-demand).

**Slash Commands**: User-defined operations in `.claude/commands/` expanding to prompts. Built-in: /compact, /clear, /help

**Hooks**: Event-driven shell commands (10 events: SessionStart, SessionEnd, PreToolUse, PostToolUse, PermissionRequest, Notification, UserPromptSubmit, Stop, SubagentStop, PreCompact)

**MCP Servers**: Model Context Protocol integrations for external tools (GitHub, Jira, databases). Supports stdio, HTTP/SSE, and SDK MCP transports.

**Agent SDK**: Python/TypeScript library providing Claude Code capabilities programmatically (query(), hooks, subagents, custom tools)

**Built-in Tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, Task, Skill, SlashCommand, NotebookEdit

## Reference Guide

Load references as needed for specific topics:

| Topic | Reference File | Contents |
|-------|----------------|----------|
| Installation & setup | `references/getting-started.md` | Prerequisites, installation methods, authentication |
| Slash commands | `references/slash-commands.md` | Full catalog: /cook, /plan, /fix, /test, /docs, /git, /design |
| Workflow examples | `references/common-workflows.md` | Feature implementation, bug fixing, testing, git ops |
| Creating skills | `references/agent-skills.md` | Skill structure, metadata, bundled resources, API integration |
| MCP servers | `references/mcp-integration.md` | Configuration, common servers, remote servers, authentication |
| Hooks system | `references/hooks-comprehensive.md` | 10 event types, command/prompt hooks, tool matchers |
| Plugins | `references/hooks-and-plugins.md` | Plugin structure, marketplace, installation |
| Configuration | `references/configuration.md` | Settings hierarchy, model config, output styles |
| Enterprise | `references/enterprise-features.md` | SSO, RBAC, sandboxing, audit logging, deployment |
| IDE integration | `references/ide-integration.md` | VS Code extension, JetBrains plugin |
| CI/CD | `references/cicd-integration.md` | GitHub Actions, GitLab workflows |
| Advanced features | `references/advanced-features.md` | Extended thinking, effort parameter, caching, checkpointing |
| Built-in tools | `references/built-in-tools.md` | Bash, code execution, text editor, computer use, memory, search tools |
| Troubleshooting | `references/troubleshooting.md` | Auth failures, MCP issues, performance, debug mode |
| API reference | `references/api-reference.md` | Admin, Messages, Files, Models, Skills APIs |
| Agent SDK | `references/agent-sdk.md` | Python/TypeScript SDK, custom tools, hooks, subagents |
| Best practices | `references/best-practices.md` | Project organization, security, performance, cost |

## Instructions

When answering questions:

1. Identify topic from user query
2. Load relevant reference files (use table above)
3. Provide specific guidance with examples
4. For complex queries, load multiple references

**Documentation sources:**
- Official platform docs: https://platform.claude.com/docs/en/
- Context7 llms.txt: `https://context7.com/websites/claude_en_claude-code/llms.txt?tokens=10000`
- Topic search: `https://context7.com/websites/claude_en_claude-code/llms.txt?topic=<topic>&tokens=5000`
- Agent SDK docs: https://platform.claude.com/docs/en/agent-sdk/overview.md
- GitHub: https://github.com/anthropics/claude-code
- Support: support.claude.com

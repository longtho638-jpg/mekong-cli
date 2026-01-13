---
title: AgencyOS CLI Skill
description: Guide for AgencyOS CLI installation, commands, skills, MCP servers, hooks, IDE integration, and enterprise features
section: docs
category: skills/tools
order: 16
published: true
ai_executable: true
---

# AgencyOS CLI Skill

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/skills/tools/claude-code-skill
```



Anthropic's agentic coding tool combining autonomous planning, execution, and validation with extensibility through skills, plugins, MCP servers, and hooks.

## When to Use

- Installation and setup questions
- Slash commands (/cook, /plan, /fix, /test, /docs, /design, /git)
- Creating/managing Agent Skills
- Configuring MCP servers
- Setting up hooks/plugins
- IDE integration (VS Code, JetBrains)
- CI/CD workflows
- Enterprise deployment (SSO, RBAC, sandboxing)
- Troubleshooting authentication/performance issues
- Advanced features (extended thinking, caching, checkpointing)

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Subagents** | Specialized agents (planner, code-reviewer, tester, debugger, docs-manager, ui-ux-designer, database-admin) |
| **Agent Skills** | Modular capabilities with SKILL.md + bundled resources loaded progressively |
| **Slash Commands** | User-defined operations in `.agencyos/commands/` expanding to prompts |
| **Hooks** | Event-driven shell commands (SessionStart, PreToolUse, PostToolUse, Stop, SubagentStop) |
| **MCP Servers** | Model Context Protocol integrations for external tools |
| **Plugins** | Packaged collections distributed via marketplace |

## Reference Navigation

| Topic | Reference |
|-------|-----------|
| Installation & setup | `references/getting-started.md` |
| Slash commands | `references/slash-commands.md` |
| Workflow examples | `references/common-workflows.md` |
| Creating skills | `references/agent-skills.md` |
| MCP servers | `references/mcp-integration.md` |
| Hooks system | `references/hooks-comprehensive.md` |
| Plugins | `references/hooks-and-plugins.md` |
| Configuration | `references/configuration.md` |
| Enterprise | `references/enterprise-features.md` |
| IDE integration | `references/ide-integration.md` |
| CI/CD | `references/cicd-integration.md` |
| Advanced features | `references/advanced-features.md` |
| Troubleshooting | `references/troubleshooting.md` |
| API reference | `references/api-reference.md` |
| Best practices | `references/best-practices.md` |

## Usage Instructions

When answering questions:

1. Identify topic from user query
2. Load relevant reference files
3. Provide specific guidance with examples
4. For complex queries, load multiple references

## Documentation Sources

- Context7: `https://context7.com/websites/claude_en_claude-code/llms.txt?tokens=10000`
- Topic search: `https://context7.com/websites/claude_en_claude-code/llms.txt?topic=<topic>&tokens=5000`
- [Official docs](https://docs.agencyos.com/en/docs/claude-code/)
- [GitHub](https://github.com/anthropics/claude-code)
- Support: support.agencyos.com

## Integration with AgencyOS

Works with:

- **skill-creator**: Create new skills
- **mcp-management**: Manage MCP servers
- **mcp-builder**: Build MCP servers

---

## Key Takeaway

 AgencyOS CLI skill provides guidance for Anthropic's agentic coding tool including installation, slash commands, skills, MCP integration, hooks, IDE integration, and enterprise features. Load specific references based on user query topic.

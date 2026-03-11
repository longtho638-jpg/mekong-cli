---
description: "Init → install deps → configure MCP → verify environment setup"
argument-hint: [environment name or target]
allowed-tools: Read, Write, Bash, Task
---

# /platform:environment-setup — Environment Setup

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[init]
  │
  ▼
[install]
  │
  ▼
[setup-mcp]
  │
  ▼
[health]
```

## Estimated: 5 credits, 10 minutes

## Execution

Load recipe: `recipes/platform/environment-setup.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

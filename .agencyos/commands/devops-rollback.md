---
description: "Emergency rollback → smoke test → health check → incident report"
argument-hint: [version or commit to roll back to]
allowed-tools: Read, Write, Bash, Task
---

# /devops:rollback — Emergency Rollback

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[rollback $ARGUMENTS]
          │
          ▼
  [smoke] ══╗
  [health] ══╝ (parallel)
```

## Estimated: 5 credits, 10 minutes

## Execution

Load recipe: `recipes/devops/rollback.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

---
description: "API audit → schema review → dependency analysis → improvement plan"
argument-hint: [system or component to review]
allowed-tools: Read, Write, Bash, Task
---

# /tech:architecture-review — Architecture Review

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[arch --audit] ══╗
[api --audit]  ══╣ (parallel)
[schema --audit] ╝
                 ▼
          [plan --output improvement-plan.md]
```

## Estimated: 15 credits, 25 minutes

## Execution

Load recipe: `recipes/tech/architecture-review.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

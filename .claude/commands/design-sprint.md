---
description: "Design sprint — understand → sketch → decide → prototype → test"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /design:sprint — Design Sprint

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[understand] ───────────────────────────────────── PARALLEL
  ├── persona                   → user-needs.md
  └── competitor                → design-audit.md
         │
         ▼
[create] ───────────────────────────────────────── SEQUENTIAL
  ├── scope                     → feature-scope.md
  └── demo                      → prototype-spec.md
```

## Estimated: 18 credits, 30 minutes

## Execution

Load recipe: `recipes/design/sprint.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

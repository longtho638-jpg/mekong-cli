---
description: "Audit current → plan migration → generate scripts → test → verify"
argument-hint: [migration target or version]
allowed-tools: Read, Write, Bash, Task
---

# /tech:migration — Migration Pipeline

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[schema --current] ══╗
[audit --data]     ══╝ (parallel)
                      ▼
        [migrate --output migration-scripts.md]
                      │
                      ▼
             [test --migration]
```

## Estimated: 18 credits, 30 minutes

## Execution

Load recipe: `recipes/tech/migration.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

---
description: "Compliance check — privacy policy → terms → data handling → regulatory gaps"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /legal:compliance-check — Compliance Check

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[audit] ────────────────────────────────────────── PARALLEL
  ├── security --compliance     → data-handling.md
  └── audit --legal             → regulatory-gaps.md
         │
         ▼
[fix] ──────────────────────────────────────────── SEQUENTIAL
  └── agreement --templates     → policy-updates.md
```

## Estimated: 10 credits, 15 minutes

## Execution

Load recipe: `recipes/legal/compliance-check.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

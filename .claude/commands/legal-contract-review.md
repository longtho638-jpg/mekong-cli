---
description: "Contract review — analyze contract → flag risks → suggest amendments → negotiation brief"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /legal:contract-review — Contract Review

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[analyze] ──────────────────────────────────────── PARALLEL
  ├── agreement --review        → risk-analysis.md
  └── market-analysis           → market-terms.md
         │
         ▼
[negotiate] ────────────────────────────────────── SEQUENTIAL
  └── contract                  → amendment-suggestions.md
```

## Estimated: 12 credits, 15 minutes

## Execution

Load recipe: `recipes/legal/contract-review.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

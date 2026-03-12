---
description: "Bootstrap venture studio — init, thesis, first portfolio company. 4 commands, ~15 min."
argument-hint: [studio-name]
allowed-tools: Read, Write, Bash, Task
---

# /studio:bootstrap[:auto|:parallel] — Bootstrap Venture Studio

**IC super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[init] ──────────────────────────────── SEQUENTIAL
  ├── studio init $ARGUMENTS        → .mekong/studio/config.yaml
  └── venture thesis update         → .mekong/studio/thesis.yaml

[setup] ─────────────────────────────── PARALLEL (after init)
  ├── expert pool --setup           → .mekong/studio/experts/pool.json
  └── portfolio create --template   → .mekong/studio/portfolio/
```

## Modifier Modes
- `:auto` — Accept all defaults, minimal prompts
- `:parallel` — Spawn all possible steps in parallel via Task tool

## Estimated: 5 credits, 15 minutes

## Execution

Load recipe: `recipes/studio/bootstrap.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

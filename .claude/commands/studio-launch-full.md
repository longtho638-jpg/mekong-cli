---
description: "Full venture launch — thesis → source deals → screen → create company. 6 commands, ~30 min."
argument-hint: [sector-or-market-focus]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /studio:launch:full — Full Venture Launch Pipeline

**IC super command** — chains 6 commands via DAG pipeline.

## Pipeline

```
[strategy] ──────────────────────────────── SEQUENTIAL
  ├── venture thesis evaluate       → thesis validation
  └── venture terrain $ARGUMENTS    → market terrain map

[source] ─────────────────────────────────── PARALLEL (after strategy)
  ├── dealflow source --sector=$ARGUMENTS --count=5
  ├── venture void-substance $ARGUMENTS
  └── venture momentum $ARGUMENTS

[evaluate] ───────────────────────────────── SEQUENTIAL (after source)
  ├── dealflow screen --all-new     → scored pipeline
  └── venture five-factors --top=3  → deep evaluation top 3
```

## Estimated: 10 credits, 30 minutes

## Execution

Load recipe: `recipes/studio/launch-full.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

## Engine Note

CRITICAL: Each sub-command MUST run via `mekong` CLI engine, NOT manual file operations.
Example: "portfolio-create" → `mekong portfolio create $ARGS`

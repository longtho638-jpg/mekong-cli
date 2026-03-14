---
description: "Weekly studio sprint — portfolio status, follow-ups, cross-portfolio insights, report. 5 commands, ~20 min."
argument-hint: [optional: specific-focus-area]
allowed-tools: Read, Write, Bash, Task
---

# /studio:sprint:weekly — Weekly Studio Sprint

**IC super command** — chains 5 commands via DAG pipeline.

## Pipeline

```
[gather] ─────────────────────────────────── PARALLEL
  ├── portfolio status --all        → company health checks
  ├── dealflow list --active        → pipeline status
  └── expert pool --active          → expert engagement status

[analyze] ────────────────────────────────── SEQUENTIAL (after gather)
  ├── portfolio report --weekly     → cross-portfolio intelligence
  └── venture momentum --portfolio  → portfolio momentum map
```

## Estimated: 8 credits, 20 minutes

## Execution

Load recipe: `recipes/studio/sprint-weekly.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

## Engine Note

CRITICAL: Each sub-command MUST run via `mekong` CLI engine, NOT manual file operations.
Example: "portfolio-create" → `mekong portfolio create $ARGS`

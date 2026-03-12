---
description: "Daily studio ops — standup, tickets, invoices, metrics across all portfolio companies. 4 commands, ~10 min."
argument-hint: [optional: company-slug to focus on]
allowed-tools: Read, Write, Bash, Task
---

# /studio:operate:daily — Daily Studio Operations

**IC super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[morning] ────────────────────────────────── PARALLEL
  ├── studio status                 → Andon dashboard
  ├── portfolio health --all        → health alerts
  └── dealflow list --action-due    → follow-up reminders

[execute] ────────────────────────────────── SEQUENTIAL (after morning)
  └── portfolio report --daily      → daily digest
```

## Estimated: 3 credits, 10 minutes

## Execution

Load recipe: `recipes/studio/operate-daily.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

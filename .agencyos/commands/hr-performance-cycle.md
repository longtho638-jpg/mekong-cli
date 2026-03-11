---
description: "Performance review cycle — self-assessment → manager review → calibration → feedback delivery"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /hr:performance-cycle — Performance Review Cycle

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[assess] ──────────────────────────────────────── PARALLEL
  ├── performance-review        → review-templates.md
  └── kpi --team                → team-metrics.md
         │
         ▼
[deliver] ─────────────────────────────────────── SEQUENTIAL
  └── feedback                  → feedback-guides.md
```

## Estimated: 10 credits, 15 minutes

## Execution

Load recipe: `recipes/hr/performance-cycle.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

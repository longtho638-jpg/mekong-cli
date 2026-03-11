---
description: "Employee onboarding — welcome kit → access setup → 30-60-90 plan → buddy assignment"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /hr:onboard — Employee Onboarding

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[setup] ────────────────────────────────────────── PARALLEL
  ├── hr-management --onboard   → welcome-kit.md
  └── schedule                  → first-week-schedule.md
         │
         ▼
[plan] ─────────────────────────────────────────── SEQUENTIAL
  └── plan --30-60-90           → onboarding-plan.md
```

## Estimated: 8 credits, 10 minutes

## Execution

Load recipe: `recipes/hr/onboard.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

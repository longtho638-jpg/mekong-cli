---
description: "Recruiting pipeline — JD → sourcing → interview kit → offer template"
argument-hint: [goal]
allowed-tools: Read, Write, Bash, Task
---

# /hr:recruit — Recruiting Pipeline

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[prepare] ─────────────────────────────────────── PARALLEL
  ├── hr-management --jd        → job-description.md
  └── budget --comp             → comp-benchmark.md
         │
         ▼
[process] ─────────────────────────────────────── SEQUENTIAL
  ├── leadgen --talent          → candidate-sources.md
  └── schedule                  → interview-process.md
```

## Estimated: 15 credits, 20 minutes

## Execution

Load recipe: `recipes/hr/recruit.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

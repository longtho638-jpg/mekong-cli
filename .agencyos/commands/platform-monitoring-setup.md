---
description: "Health checks → alerts → dashboard → runbook for platform monitoring"
argument-hint: [service or platform to monitor]
allowed-tools: Read, Write, Bash, Task
---

# /platform:monitoring-setup — Monitoring Setup

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[health --setup] ══╗
[benchmark --baseline] ╝ (parallel)
                        ▼
              [docs --runbook]
                        │
                        ▼
                    [status]
```

## Estimated: 12 credits, 20 minutes

## Execution

Load recipe: `recipes/platform/monitoring-setup.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

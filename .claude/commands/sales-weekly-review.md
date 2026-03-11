---
description: "Pipeline health, revenue tracking, weekly forecast and action items. 3 commands, ~10 min."
argument-hint: [week or date range]
allowed-tools: Read, Write, Bash, Task
---

# /sales:weekly-review — Sales Weekly Review

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /pipeline --review + /revenue        (~5 min)
    |
SEQUENTIAL: /forecast                          (~5 min)
    |
OUTPUT: reports/sales/weekly/
```

## Estimated: 8 credits, 10 minutes

## Execution

Load recipe: `recipes/sales/weekly-review.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

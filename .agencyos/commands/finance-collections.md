---
description: "AR aging assessment, overdue invoice list, reminder emails, follow-up schedule. 3 commands, ~10 min."
argument-hint: [aging threshold or client segment]
allowed-tools: Read, Write, Bash, Task
---

# /finance:collections — Collections Pipeline

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
SEQUENTIAL: /invoice --overdue                 (~4 min)
    |
PARALLEL: /email --template collection
        + /schedule                            (~6 min)
    |
OUTPUT: reports/finance/collections/
```

## Estimated: 8 credits, 10 minutes

## Execution

Load recipe: `recipes/finance/collections.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

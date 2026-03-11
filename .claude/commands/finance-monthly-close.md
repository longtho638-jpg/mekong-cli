---
description: "Revenue reconcile, expense audit, P&L statement, cash flow, AR aging. 5 commands, ~25 min."
argument-hint: [month or period to close]
allowed-tools: Read, Write, Bash, Task
---

# /finance:monthly-close — Monthly Financial Close

**Super command** — chains 5 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /revenue + /expense + /invoice --aging   (~10 min)
    |
SEQUENTIAL: /cashflow → /financial-report           (~15 min)
    |
OUTPUT: reports/finance/monthly-close/
```

## Estimated: 18 credits, 25 minutes

## Execution

Load recipe: `recipes/finance/monthly-close.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

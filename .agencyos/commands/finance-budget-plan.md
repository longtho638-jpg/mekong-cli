---
description: "Department budgets, financial forecast, budget allocation and approval deck. 3 commands, ~20 min."
argument-hint: [fiscal year or quarter]
allowed-tools: Read, Write, Bash, Task
---

# /finance:budget-plan — Budget Planning

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /budget + /forecast                  (~10 min)
    |
SEQUENTIAL: /finance                           (~10 min)
    |
OUTPUT: reports/finance/budget/
```

## Estimated: 12 credits, 20 minutes

## Execution

Load recipe: `recipes/finance/budget-plan.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

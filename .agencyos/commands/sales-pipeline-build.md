---
description: "Build complete sales pipeline — ICP profile, lead list, outreach sequences, CRM setup. 5 commands, ~30 min."
argument-hint: [goal or target market]
allowed-tools: Read, Write, Bash, Task
---

# /sales:pipeline-build — Pipeline Builder

**Super command** — chains 5 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /customer-research + /leadgen        (~10 min)
    |
PARALLEL: /pipeline + /email                   (~10 min)
    |
SEQUENTIAL: /crm                               (~10 min)
    |
OUTPUT: reports/sales/pipeline/
```

## Estimated: 20 credits, 30 minutes

## Execution

Load recipe: `recipes/sales/pipeline-build.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

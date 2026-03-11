---
description: "Audience targeting, ad creatives, channel strategy, campaign launch checklist. 4 commands, ~25 min."
argument-hint: [campaign goal or product]
allowed-tools: Read, Write, Bash, Task
---

# /marketing:campaign-run — Campaign Execution

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /marketing-plan + /customer-research (~10 min)
    |
PARALLEL: /ads + /campaign                     (~15 min)
    |
OUTPUT: reports/marketing/campaign/
```

## Estimated: 15 credits, 25 minutes

## Execution

Load recipe: `recipes/marketing/campaign-run.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

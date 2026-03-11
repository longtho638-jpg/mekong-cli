---
description: "Channel metrics, SEO health audit, ROI analysis, optimization recommendations. 3 commands, ~15 min."
argument-hint: [time period or channel to audit]
allowed-tools: Read, Write, Bash, Task
---

# /marketing:performance-report — Marketing Performance

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /market-analysis + /seo --audit      (~8 min)
    |
SEQUENTIAL: /general-report                    (~7 min)
    |
OUTPUT: reports/marketing/performance/
```

## Estimated: 10 credits, 15 minutes

## Execution

Load recipe: `recipes/marketing/performance-report.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

---
description: "SEO research, content calendar, blog drafts, social posts, email sequences. 5 commands, ~35 min."
argument-hint: [topic or product to promote]
allowed-tools: Read, Write, Bash, Task
---

# /marketing:content-engine — Content Engine

**Super command** — chains 5 commands via DAG pipeline.

## Pipeline

```
PARALLEL: /seo + /market-analysis              (~12 min)
    |
PARALLEL: /content + /social + /email          (~23 min)
    |
OUTPUT: reports/marketing/content/
```

## Estimated: 20 credits, 35 minutes

## Execution

Load recipe: `recipes/marketing/content-engine.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

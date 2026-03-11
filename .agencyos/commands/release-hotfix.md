---
description: "Branch → fix → test → deploy hotfix to production"
argument-hint: [bug description or issue ID]
allowed-tools: Read, Write, Bash, Task
---

# /release:hotfix — Hotfix Pipeline

**Super command** — chains 4 commands via DAG pipeline.

## Pipeline

```
[git-branch --hotfix]
          │
          ▼
   [fix $ARGUMENTS]
          │
          ▼
    [test --all]
          │
          ▼
[deploy-prod --hotfix]
```

## Estimated: 10 credits, 15 minutes

## Execution

Load recipe: `recipes/release/hotfix.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

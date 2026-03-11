---
description: "Plan parallel → implement features → test all → review → ship"
argument-hint: [sprint goal]
allowed-tools: Read, Write, Bash, Task
---

# /eng:sprint-execute — Sprint Execution

**Super command** — chains 5 commands via DAG pipeline.

## Pipeline

```
[plan]
  └─► [cook --phase-1] ══╗
      [cook --phase-2] ══╣ (parallel)
                         ▼
                [test --all] ══╗
                [review]    ══╣ (parallel)
                               ▼
                        [deploy-staging]
```

## Estimated: 25 credits, 50 minutes

## Execution

Load recipe: `recipes/eng/sprint-execute.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

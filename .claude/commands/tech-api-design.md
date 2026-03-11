---
description: "Requirements → schema → OpenAPI spec → implementation plan"
argument-hint: [API or feature to design]
allowed-tools: Read, Write, Bash, Task
---

# /tech:api-design — API Design

**Super command** — chains 3 commands via DAG pipeline.

## Pipeline

```
[schema --output data-model.md]
               │
               ▼
   [api --design --output api-spec.md]
               │
               ▼
   [plan --output implementation-plan.md]
```

## Estimated: 12 credits, 20 minutes

## Execution

Load recipe: `recipes/tech/api-design.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- If mode = "sequential": run commands one after another
- Wait for group completion before starting dependent groups

## Goal context

<goal>$ARGUMENTS</goal>

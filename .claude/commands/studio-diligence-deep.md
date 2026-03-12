---
description: "Deep due diligence — market + team + tech + financial + legal analysis. 5 parallel agents, ~25 min."
argument-hint: [deal-id]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /studio:diligence:deep — Deep Due Diligence Pipeline

**IC super command** — chains 5 commands via DAG pipeline with PARALLEL agent spawning.

## Pipeline

```
[research] ───────────────────────────────── PARALLEL (5 agents simultaneously)
  ├── venture terrain --deal=$ARGUMENTS          → market analysis
  ├── venture five-factors --deal=$ARGUMENTS     → five-factor evaluation
  ├── venture momentum --deal=$ARGUMENTS         → momentum assessment
  ├── venture void-substance --deal=$ARGUMENTS   → competitive gaps
  └── dealflow diligence $ARGUMENTS --depth=deep → financial + legal DD

[synthesize] ─────────────────────────────── SEQUENTIAL (after research)
  └── dealflow screen $ARGUMENTS --with-dd       → final recommendation
```

## Estimated: 15 credits, 25 minutes

## Execution

Load recipe: `recipes/studio/diligence-deep.json`

Execute DAG groups in dependency order:
- If mode = "parallel": spawn multiple subagents simultaneously via Task tool
- Wait for group completion before starting dependent groups

This is a MULTI-AGENT command. The 5 research tasks MUST run in parallel via Task tool to complete within time budget.

## Goal context

<goal>$ARGUMENTS</goal>

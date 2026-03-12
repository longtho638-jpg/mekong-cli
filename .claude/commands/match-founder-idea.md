---
description: "AI-powered founder-idea matching — pair founders with validated opportunities. 1 command, ~8 min."
argument-hint: [--founder-id=id or --idea="sector/concept"]
allowed-tools: Read, Write, Bash, Task
---

# /match:founder-idea — Founder-Idea Matching

## Goal

Match founders in the pool with validated business ideas/opportunities based on skills, background, and interest alignment.

## Steps

1. Load founder pool from .mekong/studio/founders/pool.json
2. Load available ideas from deal pipeline (passed screening) or thesis-derived opportunities
3. Score founder-idea fit based on:
   - Founder skills vs idea requirements
   - Sector experience overlap
   - Stage preference alignment
   - Geographic fit
   - 將 (Tuong) founder quality assessment
4. Rank top 3 matches per founder or per idea
5. Save matches to .mekong/studio/founders/matching.json

## Output Format

CLI match table.

```
🤝 Founder ↔ Idea Match
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Match │ Founder       │ Idea/Sector      │ Fit
#1    │ {name}        │ {idea}           │ {score}%
      │ Why: {reasoning}
#2    │ {name}        │ {idea}           │ {score}%
      │ Why: {reasoning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Create company: /portfolio:create {name} --sector={sector}
```

## Goal context

<goal>$ARGUMENTS</goal>

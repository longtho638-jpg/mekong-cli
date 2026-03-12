---
description: "AI-powered expert matching — find best expert for portfolio company need. 1 command, ~5 min."
argument-hint: [company-slug --need="description of need"]
allowed-tools: Read, Write, Bash, Task
---

# /expert:match — Expert Matching

## Goal

Find the best-fit expert from the pool for a specific portfolio company need using AI matching.

## Steps

1. Load expert pool from .mekong/studio/experts/pool.json
2. Load company profile from .mekong/studio/portfolio/{slug}/
3. Analyze need against expert specialties, availability, past ratings
4. Score and rank top 3 expert matches
5. Output match recommendations with reasoning

## Output Format

CLI ranked match list.

```
🧠 Expert Match: {company_name} — "{need}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1 {name} — {specialties} — Score: {score}%
   Why: {reasoning}
#2 {name} — {specialties} — Score: {score}%
   Why: {reasoning}
#3 {name} — {specialties} — Score: {score}%
   Why: {reasoning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Dispatch: /expert:dispatch {expert_id} --company={slug}
```

## Goal context

<goal>$ARGUMENTS</goal>

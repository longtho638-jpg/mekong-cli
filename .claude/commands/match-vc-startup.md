---
description: "Match VC investors to portfolio company for follow-on/co-invest. 1 command, ~5 min."
argument-hint: [company-slug]
allowed-tools: Read, Write, Bash, Task
---

# /match:vc-startup — VC-Startup Matching

## Goal

Generate VC investor match recommendations for a portfolio company seeking follow-on funding or co-investment.

## Steps

1. Load company profile from .mekong/studio/portfolio/{slug}/
2. Analyze company stage, sector, metrics, momentum
3. Match against known VC preferences (thesis alignment, check size, stage focus)
4. Score and rank top VC matches
5. Generate intro preparation notes

## Output Format

CLI match recommendations.

```
💰 VC Match: {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1 {vc_name} — {focus} — Fit: {score}%
   Check: ${range} │ Stage: {stage_pref}
   Why: {reasoning}
#2 {vc_name} — {focus} — Fit: {score}%
   Check: ${range} │ Stage: {stage_pref}
   Why: {reasoning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prep: Update deck + metrics before outreach
```

## Goal context

<goal>$ARGUMENTS</goal>

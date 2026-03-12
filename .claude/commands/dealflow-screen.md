---
description: "Screen deal against investment thesis — five-factor quick eval. 1 command, ~5 min."
argument-hint: [deal-id or --all-new]
allowed-tools: Read, Write, Bash, Task
---

# /dealflow:screen — Deal Screening

## Goal

Screen a deal (or all new deals) against the investment thesis using quick five-factor evaluation.

## Steps

1. Load thesis from .mekong/studio/thesis.yaml
2. Load deal(s) from .mekong/studio/dealflow/pipeline.json
3. Run quick five-factor evaluation (道天地將法)
4. Calculate thesis fit score (0-100)
5. Recommend: proceed / pause / pass
6. Update deal records with screening results

## Output Format

CLI screening card per deal.

```
🔎 Screening: {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
道 Mission-Market : {score}/100
天 Timing         : {score}/100
地 Competition    : {score}/100
將 Founder        : {score}/100
法 Business Model : {score}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thesis Fit  : {fit_score}%
Recommend   : {proceed|pause|pass}
```

## Goal context

<goal>$ARGUMENTS</goal>

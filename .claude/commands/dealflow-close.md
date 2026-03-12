---
description: "Close deal — finalize investment, onboard company to portfolio. 1 command, ~5 min."
argument-hint: [deal-id]
allowed-tools: Read, Write, Bash, Task
---

# /dealflow:close — Close Deal & Onboard

## Goal

Close a deal and onboard the company into the studio portfolio with OpenClaw CTO assignment.

## Steps

1. Load deal from .mekong/studio/dealflow/pipeline.json
2. Validate deal has term sheet and DD completed
3. Update deal stage to CLOSED
4. Create portfolio company from deal data (invoke portfolio:create logic)
5. Archive deal to .mekong/studio/dealflow/archive/
6. Assign OpenClaw CTO instance to new portfolio company
7. Output onboarding summary

## Output Format

CLI confirmation.

```
✅ Deal Closed: {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Invested    : ${amount}
Equity      : {pct}%
Portfolio # : {portfolio_id}
CTO         : OpenClaw assigned ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next: /portfolio:status {slug}
```

## Goal context

<goal>$ARGUMENTS</goal>

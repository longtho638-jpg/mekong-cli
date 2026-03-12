---
description: "Dispatch expert to portfolio company — create engagement record. 1 command, ~3 min."
argument-hint: [expert-id --company=slug --scope="engagement scope" --type=advisory]
allowed-tools: Read, Write, Bash, Task
---

# /expert:dispatch — Dispatch Expert

## Goal

Create an expert engagement, assigning an expert to a portfolio company with defined scope.

## Steps

1. Load expert from .mekong/studio/experts/pool.json
2. Load company from .mekong/studio/portfolio/{slug}/
3. Validate expert availability
4. Create engagement record in .mekong/studio/experts/engagements.json
5. Update expert's portfolio_companies list
6. Update company's experts_assigned list
7. Output engagement confirmation

## Output Format

CLI confirmation.

```
🚀 Expert Dispatched
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Expert   : {name}
Company  : {company_name}
Scope    : {scope}
Type     : {advisory|fractional|project}
Comp     : {equity|hourly|project_fee}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Goal context

<goal>$ARGUMENTS</goal>

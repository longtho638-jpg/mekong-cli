---
description: "Run due diligence pipeline — market, team, tech, financial analysis. 1 command, ~10 min."
argument-hint: [deal-id --depth=quick|standard|deep]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /dealflow:diligence — Due Diligence Pipeline

## Goal

Run structured due diligence on a deal with configurable depth (quick/standard/deep).

## Steps

1. Load deal from .mekong/studio/dealflow/pipeline.json
2. Validate deal is in SCREENING or DILIGENCE stage
3. Execute DD modules based on depth:
   - quick: market overview + founder check
   - standard: + tech assessment + financial review
   - deep: + legal review + competitive deep-dive + reference checks
4. Compile DD report with findings and risk flags
5. Update deal stage to DILIGENCE
6. Save report to plans/reports/dd-{deal-id}-{date}.md

## Output Format

CLI summary + markdown report.

```
🔬 Due Diligence: {company_name} [{depth}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Market      : {rating} — {summary}
Team        : {rating} — {summary}
Tech        : {rating} — {summary}
Financials  : {rating} — {summary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Risk Flags  : {count}
Recommend   : {proceed|pause|pass}
📄 Report   : {report_path}
```

## Goal context

<goal>$ARGUMENTS</goal>

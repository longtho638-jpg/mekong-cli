---
description: "Generate term sheet draft from deal data and studio defaults. 1 command, ~8 min."
argument-hint: [deal-id]
allowed-tools: Read, Write, Bash, Task
---

# /dealflow:term-sheet — Generate Term Sheet

## Goal

Generate a term sheet draft based on deal data, DD findings, and studio investment parameters.

## Steps

1. Load deal from .mekong/studio/dealflow/pipeline.json
2. Load studio config for default terms (equity %, check size)
3. Load DD report if available
4. Generate term sheet with key terms: valuation, investment amount, equity, board seats, vesting, anti-dilution
5. Save term sheet to .mekong/studio/dealflow/{deal-id}/term-sheet.md
6. Update deal stage to TERM_SHEET

## Output Format

Markdown term sheet document.

```
📝 Term Sheet Generated: {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Investment  : ${amount}
Valuation   : ${pre_money} pre / ${post_money} post
Equity      : {pct}%
Type        : {SAFE|Convertible|Priced}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Term sheet: {file_path}
```

## Goal context

<goal>$ARGUMENTS</goal>

---
description: "AI-powered deal sourcing — scan markets, identify opportunities matching thesis. 1 command, ~8 min."
argument-hint: [--sector=ai --count=5 --region=sea]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /dealflow:source — AI-Powered Deal Sourcing

## Goal

Source new investment opportunities using AI analysis, matching against the studio's investment thesis.

## Steps

1. Load investment thesis from .mekong/studio/thesis.yaml
2. Analyze target sector using venture terrain analysis
3. Search for opportunities matching thesis criteria (stage, sector, geo)
4. Score each opportunity against thesis fit
5. Add qualified deals to pipeline: .mekong/studio/dealflow/pipeline.json
6. Output sourced deals with thesis fit scores

## Output Format

CLI table of sourced deals.

```
🔍 Deal Sourcing: {sector}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# │ Company        │ Sector │ Fit  │ Stage
1 │ {name}         │ {sect} │ {%}  │ {stage}
2 │ ...            │ ...    │ ...  │ ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Added {count} deals to pipeline.
```

## Goal context

<goal>$ARGUMENTS</goal>

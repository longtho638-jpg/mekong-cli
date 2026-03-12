---
description: "Void-substance analysis (虚実) — find where competitors are hollow. 1 command, ~8 min."
argument-hint: [market-or-sector]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /venture:void-substance — Void-Substance Market Map (虚実)

## Goal

Apply Sun Tzu's void-substance (虚実) principle to map where competitors are strong (substance) vs weak (void), identifying opportunities to attack where they are hollow.

## Steps

1. Load market context and thesis
2. Research competitors in target market
3. Map each competitor's substance (strengths) and voids (weaknesses):
   - Product gaps
   - Underserved segments
   - Geographic blind spots
   - Technology debt areas
   - Pricing model weaknesses
4. Identify highest-opportunity void zones
5. Save market map to .mekong/studio/intelligence/market-maps.json

## Output Format

CLI void-substance map.

```
虚実 Void-Substance Map: {market}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Competitor    │ Substance (実)      │ Void (虚)
{name}        │ {strengths}         │ {weaknesses}
{name}        │ {strengths}         │ {weaknesses}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Top Opportunities:
1. {void_zone} — {why_opportunity}
2. {void_zone} — {why_opportunity}
3. {void_zone} — {why_opportunity}
```

## Goal context

<goal>$ARGUMENTS</goal>

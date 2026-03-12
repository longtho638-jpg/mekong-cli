---
description: "Sun Tzu terrain analysis (地形篇) for market/sector. 1 command, ~8 min."
argument-hint: [market-or-sector]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /venture:terrain — Sun Tzu Terrain Analysis

## Goal

Analyze a market using Sun Tzu's six terrain types to determine strategic positioning.

## Steps

1. Load studio thesis for context
2. Research target market: size, growth, key players, barriers
3. Classify terrain type:
   - Accessible (通): easy entry, expect competition
   - Entangling (掛): easy enter, hard exit
   - Temporizing (支): neither side benefits from moving first
   - Narrow Pass (隘): limited window, occupy first
   - Precipitous (險): high barrier, overwhelming force needed
   - Distant (遠): far from core competence
4. Identify strategic implications for investment
5. Save analysis to .mekong/studio/intelligence/market-maps.json

## Output Format

CLI terrain analysis card.

```
🗺️ Terrain Analysis: {market}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terrain Type  : {type} ({chinese})
Market Size   : ${size}
Growth Rate   : {rate}%
Key Players   : {players}
Entry Barrier : {low|medium|high}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Strategy: {strategic_recommendation}
```

## Goal context

<goal>$ARGUMENTS</goal>

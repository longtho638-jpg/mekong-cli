---
description: "Calculate momentum score (勢) for company or market. 1 command, ~5 min."
argument-hint: [company-slug or sector or --portfolio]
allowed-tools: Read, Write, Bash, Task
---

# /venture:momentum — Momentum Score (勢)

## Goal

Calculate momentum score based on Sun Tzu's concept of 勢 (strategic energy/force).

## Steps

1. Load target data (company metrics or market data)
2. Analyze momentum signals:
   - Revenue trajectory (MRR growth rate)
   - User/customer growth velocity
   - Product development cadence
   - Market timing indicators
   - Team expansion rate
3. Classify momentum level: surging / building / steady / fading / stalled
4. If --portfolio: rank all companies by momentum
5. Save scores to .mekong/studio/intelligence/momentum-scores.json

## Output Format

CLI momentum card.

```
⚡ Momentum (勢): {target}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level       : {level} {emoji}
Score       : {score}/100
Trend       : {accelerating|stable|decelerating}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signals:
  Revenue   : {signal}
  Users     : {signal}
  Product   : {signal}
  Market    : {signal}
```

## Goal context

<goal>$ARGUMENTS</goal>

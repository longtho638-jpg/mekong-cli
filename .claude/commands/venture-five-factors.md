---
description: "Run 道天地將法 five-factor evaluation for deal or company. 1 command, ~10 min."
argument-hint: [deal-id or company-slug or --top=3]
allowed-tools: Read, Write, Bash, Task, WebSearch
---

# /venture:five-factors — Five-Factor Evaluation (道天地將法)

## Goal

Run comprehensive evaluation using Sun Tzu's five constant factors adapted for venture assessment.

## Steps

1. Load target (deal or company) data
2. Evaluate each factor:
   - 道 (Dao) Mission-Market Fit: problem severity, market pull, founder-mission alignment
   - 天 (Thien) Timing/Macro: market cycle, regulatory wind, technology readiness
   - 地 (Dia) Competitive Landscape: moat, differentiation, terrain type
   - 將 (Tuong) Founder Quality: wisdom, integrity, benevolence, courage, discipline
   - 法 (Phap) Business Model: unit economics, scalability, capital efficiency
3. Calculate weighted composite score using thesis weights
4. Generate recommendation: proceed / pause / pass
5. Save evaluation to deal/company record

## Output Format

CLI five-factor card.

```
⚔️ Five Factors (道天地將法): {target_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
道 Mission-Market  : {score}/100 — {reasoning}
天 Timing/Macro    : {score}/100 — {reasoning}
地 Competition     : {score}/100 — {reasoning}
將 Founder         : {score}/100 — {reasoning}
法 Business Model  : {score}/100 — {reasoning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Composite   : {weighted_score}/100
Confidence  : {confidence}%
Recommend   : {proceed|pause|pass}
```

## Goal context

<goal>$ARGUMENTS</goal>

---
description: "Define, update, or evaluate investment thesis. 1 command, ~5 min."
argument-hint: [show|update|evaluate]
allowed-tools: Read, Write, Bash, Task
---

# /venture:thesis — Investment Thesis Management

## Goal

Manage the studio's investment thesis — the filter through which all deal flow passes.

## Steps

1. Load thesis from .mekong/studio/thesis.yaml
2. If "show": display current thesis
3. If "update": guide through thesis definition (sectors, stages, geo, check size, weights)
4. If "evaluate": analyze thesis against current portfolio and pipeline for consistency
5. Save updates to .mekong/studio/thesis.yaml

## Output Format

CLI thesis card.

```
⚔️ Investment Thesis v{version}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sectors    : {focus_sectors}
Stages     : {stage_preference}
Geography  : {geo_focus}
Check Size : ${min} — ${max} (sweet: ${sweet_spot})
Ownership  : {min}% — {max}% (target: {target}%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weights: 道{dao} 天{thien} 地{dia} 將{tuong} 法{phap}
Anti-thesis: {excluded}
```

## Goal context

<goal>$ARGUMENTS</goal>

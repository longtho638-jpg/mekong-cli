---
description: "Portfolio company health dashboard — metrics, momentum, alerts. 1 command, ~3 min."
argument-hint: [company-slug or --all]
allowed-tools: Read, Write, Bash, Task
---

# /portfolio:status — Portfolio Health Dashboard

## Goal

Display detailed health status of a specific portfolio company or all companies.

## Steps

1. Load studio data from .mekong/studio/
2. If company specified: load .mekong/studio/portfolio/{slug}/
3. If --all: iterate all portfolio companies
4. Calculate health score from metrics, momentum, runway, team
5. Generate alerts for: health < 30, runway < 3 months, momentum stalled
6. Output Andon-style dashboard

## Output Format

CLI dashboard with health indicators.

```
📊 Portfolio Status: {company-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Health    : {score}/100 {indicator}
Momentum  : {level} {trend}
MRR       : ${mrr} ({change})
Runway    : {months} months
Team      : {size} people
Experts   : {count} assigned
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Alerts: {alerts}
```

## Goal context

<goal>$ARGUMENTS</goal>

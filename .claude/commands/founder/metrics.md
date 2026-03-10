---
description: Setup KPIs, metrics dashboard, anomaly detection, weekly tracking — no spreadsheet needed
allowed-tools: Read, Write, Bash
---

# /founder metrics — KPI Intelligence Engine

## USAGE
```
/founder metrics [--setup | --check | --alert | --compare <period>]
```

## BƯỚC 0 — SCAN
```
□ Đọc .mekong/company.json    → product_type, stage
□ Đọc .mekong/mcu_ledger.json → usage/revenue data
□ Đọc .mekong/memory.json     → task completion data
□ Đọc .mekong/founder/metrics-config.json (nếu có)
```

## MODE: --setup (lần đầu chạy)

**Agent: Data / local / 1 MCU**

### NORTH STAR METRIC SELECTION

```
Based on product_type, recommend North Star Metric:

SaaS subscription → MRR (Monthly Recurring Revenue)
  "Every decision asks: does this grow MRR?"

Usage-based (MCU) → MAU × Avg MCU per user
  "Users who actually use the product"

Marketplace → GMV (Gross Merchandise Value)
  "Total value transacted through platform"

Developer tool → Daily Active Developers
  "Devs who shipped code using your tool today"

Content/media → Weekly Active Readers
  "People who come back every week"

FOR AGENCYOS: North Star = "Tasks completed per paying user per week"
  (measures actual value delivered, not just signups)
```

### KPI HIERARCHY

```
FILE: .mekong/founder/metrics-config.json

Generate based on product_type:

TIER 1 — NORTH STAR (1 metric):
  name: "{metric_name}"
  target: {number}
  current: {current_value}
  trend: week_over_week
  alert_threshold: 10% drop = immediate alert

TIER 2 — GROWTH METRICS (3-5):
  Revenue:
    mrr: target growth 15%/mo
    new_mrr: new customers × deal_size
    expansion_mrr: upgrades + seat expansion
    churned_mrr: lost customers
    net_new_mrr: new + expansion - churned
  
  Acquisition:
    new_signups: /week
    activation_rate: signed up → first value moment
    paid_conversion: free → paid
    cac: cost per acquired customer

TIER 3 — HEALTH METRICS (5-10):
  Retention:
    wk1_retention: still using after 7 days
    mo1_retention: still paying after 30 days
    nps: Net Promoter Score (survey monthly)
    churn_rate: % cancelling per month
    ltv: lifetime value per customer
  
  Product:
    dau_mau_ratio: daily/monthly active (>0.2 = good)
    feature_adoption: % using core features
    support_tickets: volume + resolution time
  
  Operations (AgencyOS-specific):
    mcu_per_user: MCU consumed per active user
    agent_success_rate: % tasks completed successfully
    llm_cost_margin: (MCU revenue - LLM cost) / MCU revenue

TIER 4 — LEADING INDICATORS (signals before outcomes):
  trial_to_paid_velocity: how fast trials convert
  engagement_score: composite usage score
  referral_rate: % of users who referred someone
  credit_card_fails: churn predictor
```

### ALERT RULES

```
FILE: .mekong/founder/alert-rules.json

CRITICAL (immediate action):
  □ MRR drops > 5% week-over-week
  □ Churn rate > 10% monthly
  □ Agent success rate < 80%
  □ MCU margin < 60%
  □ System uptime < 99%

WARNING (investigate within 24h):
  □ Activation rate < 40%
  □ DAU/MAU < 0.15
  □ Support tickets spike > 2x normal
  □ LLM cost > 25% of MCU revenue

CELEBRATION (share publicly):
  □ MRR milestone: $1K, $5K, $10K, $50K, $100K
  □ 10th, 50th, 100th customer
  □ First customer from referral
  □ First customer in new country
```

## MODE: --check (weekly metrics pull)

**Agent: Data / local / 1 MCU**

```bash
# Pull all metrics from available sources
cat .mekong/mcu_ledger.json | python3 -c "
import json, sys
from datetime import datetime, timedelta

data = json.load(sys.stdin)
now = datetime.now()
week_ago = now - timedelta(days=7)
two_weeks_ago = now - timedelta(days=14)

# This week
this_week = [t for t in data if datetime.fromisoformat(t['timestamp']) > week_ago]
last_week = [t for t in data if two_weeks_ago < datetime.fromisoformat(t['timestamp']) <= week_ago]

mcu_this = sum(t['mcu'] for t in this_week if t['type']=='confirm')
mcu_last = sum(t['mcu'] for t in last_week if t['type']=='confirm')

print(f'MCU this week: {mcu_this}')
print(f'MCU last week: {mcu_last}')
print(f'WoW change: {((mcu_this-mcu_last)/mcu_last*100):.1f}%')
"
```

Output dashboard:
```
📊 METRICS DASHBOARD — {date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ NORTH STAR: Tasks per User/Week
   This week: {n}  Last week: {n}  Change: {+/-pct}%
   Status: {GROWING 📈 / STABLE ➡️ / DECLINING 📉}

💰 REVENUE
   MRR            : ${current}    WoW: {+/-pct}%
   New MRR        : +${n}         ({n} new customers)
   Churned MRR    : -${n}         ({n} customers lost)
   Net New MRR    : ${net}
   
   LLM Cost       : ${cost}
   MCU Revenue    : ${revenue}
   Gross Margin   : {pct}%

👥 ACQUISITION
   Signups/week   : {n}           WoW: {+/-pct}%
   Activation rate: {pct}%        Benchmark: >40%
   Trial→Paid     : {pct}%        Benchmark: >5%
   CAC            : ${n}

♟️  RETENTION
   1-month churn  : {pct}%        Benchmark: <5%
   DAU/MAU        : {ratio}       Benchmark: >0.2
   Avg tenure     : {n} months

🤖 AGENTS
   Tasks/week     : {n}
   Success rate   : {pct}%        Benchmark: >90%
   Avg MCU/task   : {n}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{IF alerts:}
🚨 ALERTS:
  ! {alert 1}
  ! {alert 2}
{/IF}

{IF celebrations:}
🎉 MILESTONES:
  ★ {milestone}
{/IF}
```

## MODE: --compare <period>

```
/founder metrics --compare month

Shows:
  Side by side: this month vs last month
  For each metric: absolute value + % change + direction
  Trend line: 3-month trajectory
  Cohort analysis: do newer customers behave differently?
```

## MODE: --alert (run daily via cron)

```bash
# Add to crontab: 0 9 * * * claude -p "/founder metrics --alert"

Checks all CRITICAL alert rules.
IF any triggered → print alert in terminal + append to .mekong/alerts.log

Output:
  ✅ No critical alerts — all systems normal

OR:

  🚨 CRITICAL ALERT — {date} {time}
  Trigger: MRR dropped 7.3% this week
  Action needed: /founder churn --analyze
  Logged: .mekong/alerts.log
```

## OUTPUT

```
✅ Metrics configured
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/founder/
  ✓ metrics-config.json
  ✓ alert-rules.json

Schedule (add to crontab):
  Daily  9AM: /founder metrics --alert
  Monday 8AM: /founder week (includes metrics)

💳 MCU: -1 (balance: {remaining})
```

---
name: Weekly Business Report
version: "0.2"
category: ops
trigger: Every Sunday at 18:00
mcu_cost: 2
---
# Weekly Business Report

## Trigger
- Scheduled: Sunday 18:00 (Asia/Saigon)
- Manual trigger by owner or scheduler agent

## Prerequisites
- Week's data available: revenue, sales, support, ops
- Report template configured
- Distribution list set

## Steps
1. Collect revenue metrics: weekly MRR movement, new ARR, churn
2. Collect sales metrics: new leads, demos, closes, pipeline value
3. Collect support metrics: tickets opened/closed, avg resolution time, CSAT
4. Collect ops metrics: deployments, uptime %, incidents
5. Calculate week-over-week changes for each metric
6. Identify top 3 wins and top 3 risks
7. Generate narrative summary (2-3 sentences per section)
8. Format report as email + save as markdown to `.mekong/reports/`
9. Distribute: email to owner + team Slack #weekly-digest

## Verification
- All 4 metric sections populated
- Report saved to `.mekong/reports/weekly-YYYY-MM-DD.md`
- Email delivered to distribution list
- Slack message posted

## Rollback
If data source unavailable:
1. Use last known values, flag as "estimated"
2. Note data gap in report
3. Send report with caveat to recipients

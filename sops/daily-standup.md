---
name: Daily Standup Summary
version: "0.2"
category: ops
trigger: Every weekday at 08:00
mcu_cost: 1
---
# Daily Standup Summary

## Trigger
- Scheduled: Monday-Friday 08:00 (Asia/Saigon)
- Manual trigger for ad-hoc standups

## Prerequisites
- Task tracker accessible (active tasks/sprints)
- Team calendar accessible
- Previous day's standup for context

## Steps
1. Fetch yesterday's completed tasks per team member
2. Fetch today's scheduled tasks and deadlines
3. Identify blockers: overdue tasks, stalled PRs, open P0/P1 tickets
4. Fetch today's calendar events (meetings, demos, deadlines)
5. Check sprint progress: days remaining vs. story points completed
6. Generate per-member summary: done / doing / blocked
7. Post to Slack #standup with @mentions for blockers
8. Save summary to `.mekong/standups/standup-YYYY-MM-DD.md`

## Verification
- All active team members included
- Blockers explicitly listed (or "none")
- Slack message posted by 08:15
- File saved to standup archive

## Rollback
If task tracker unavailable:
1. Post placeholder standup to Slack
2. Request manual updates from team
3. Update file once data available

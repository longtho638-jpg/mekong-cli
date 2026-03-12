# SOP: Daily Standup Report

**ID:** SOP-OPS-003 | **Version:** 1.0 | **Owner:** Operations Agent

---

## Trigger

- [ ] Every morning, 8:00 AM (working days)

---

## Prerequisites

- [ ] Project management system accessible
- [ ] Team calendar integrated
- [ ] Previous day's data available

---

## Steps

### Step 1: Collect Yesterday's Progress
```
yesterday = {
  tasks_completed: pm.tasks.where(
    status = "done",
    completed_at = yesterday
  ).count(),

  hours_logged: pm.time_entries.where(
    date = yesterday
  ).sum(hours),

  deliverables_shipped: pm.tasks.where(
    type = "deliverable",
    status = "done",
    completed_at = yesterday
  ).list()
}
```

### Step 2: Collect Today's Plan
```
today = {
  meetings: calendar.events.where(
    date = today,
    type IN ["client", "internal", "deadline"]
  ).list(),

  deadlines: pm.tasks.where(
    due_date = today,
    status != "done"
  ).list(),

  blocked: pm.tasks.where(
    status = "blocked",
    assignee IN team.members
  ).list()
}
```

### Step 3: Check Project Health
```
projects_at_risk = pm.projects.where(
  status = "at_risk" OR
  deadline < today + 7 days AND progress < 80%
).list()
```

### Step 4: Review Support Queue
```
support_urgent = support.tickets.where(
  priority IN ["P0", "P1"],
  status != "closed"
).count()
```

### Step 5: Check Cash Position
```
cash = {
  balance: bank.accounts.sum(balance),
  ar_outstanding: billing.invoices.where(
    status = "overdue"
  ).sum(),

  ap_due: billing.bills.where(
    due_date <= today + 7
  ).sum()
}
```

### Step 6: Compile Standup
```
standup = {
  date: today,
  yesterday: yesterday,
  today: today,
  risks: projects_at_risk,
  blockers: blocked_tasks,
  support_urgent: support_urgent,
  cash_position: cash,
  announcements: get_announcements()
}
```

### Step 7: Format for Slack
```
slack_message = format("""
*Daily Standup - [date]*

*Yesterday:*
✓ [yesterday.tasks_completed] tasks completed
✓ [yesterday.deliverables_shipped.length] deliverables shipped

*Today:*
📅 [today.meetings.length] meetings
⚠️ [today.deadlines.length] deadlines
🚧 [today.blocked.length] blocked tasks

*Risks:* [projects_at_risk.length] projects at risk
*Support:* [support_urgent] urgent tickets pending
*Cash:* $[cash.balance] | AR: $[cash.ar_outstanding]

[link_to_full_report]
""")
```

### Step 8: Distribute
```
ACTION: slack.post({
  channel: "#standup",
  message: slack_message
})

ACTION: email.send({
  to: team@company.com,
  template: "daily_standup",
  variables: standup
})
```

---

## Success Criteria

- [ ] Progress data collected
- [ ] Today's plan compiled
- [ ] Risks identified
- [ ] Report distributed to team
- [ ] Slack message posted

---

## Error Handling

| Error | Action |
|-------|--------|
| PM system unavailable | Use cached data, flag as stale |
| Calendar API rate limited | Skip meetings, retry later |
| Slack webhook failed | Send via email instead |

---

## Rollback

If standup sent with errors:
1. Post correction in same thread
2. Send updated email
3. Note error in log

---

## Related SOPs

- SOP-OPS-002: Weekly Report
- SOP-OPS-001: Support Triage
- SOP-OPS-005: Invoice Follow-up

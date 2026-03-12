# SOP: Weekly Business Report

**ID:** SOP-OPS-002 | **Version:** 1.0 | **Owner:** Operations Agent

---

## Trigger

- [ ] Every Sunday, 6:00 PM

---

## Prerequisites

- [ ] All systems connected (CRM, billing, support)
- [ ] Week's data available
- [ ] Previous week's report archived

---

## Steps

### Step 1: Collect Revenue Metrics
```
revenue = {
  invoices_sent: billing.invoices.count(week),
  revenue_collected: billing.payments.sum(week),
  outstanding: billing.invoices.where(status="overdue").sum(),
  mrr: subscriptions.active.sum(monthly_value),
  mom_growth: (current_mrr - prev_mrr) / prev_mrr
}
```

### Step 2: Collect Sales Metrics
```
sales = {
  new_leads: crm.leads.count(week),
  qualified: crm.leads.where(tier="HOT").count(),
  demos_booked: calendar.events.where(type="demo").count(),
  proposals_sent: crm.deals.where(status="proposed").count(),
  deals_closed: crm.deals.where(status="won", closed_at: week).count(),
  pipeline_value: crm.deals.where(status="open").sum(value)
}
```

### Step 3: Collect Support Metrics
```
support = {
  tickets_created: support.tickets.count(week),
  tickets_resolved: support.tickets.where(status="closed").count(),
  avg_response_time: support.tickets.avg(first_response_time),
  sla_breaches: support.tickets.where(sla_breached=true).count(),
  csat: surveys.where(week).avg(rating)
}
```

### Step 4: Collect Operations Metrics
```
ops = {
  projects_active: projects.where(status="active").count(),
  projects_delivered: projects.where(status="delivered", week).count(),
  team_utilization: team.avg(hours_billable / hours_available),
  incidents: incidents.count(week)
}
```

### Step 5: Calculate Health Score
```
health_score = weighted_average({
  revenue_health: (revenue_collected / target) * 30,
  sales_health: (deals_closed / target) * 25,
  support_health: (1 - sla_breaches/tickets) * 20,
  delivery_health: (on_time_projects / total) * 25
})
```

### Step 6: Generate Insights
```
insights = []

IF revenue.mom_growth < 0:
  insights.push("MRR declined by X% - review churn")

IF support.sla_breaches > 5:
  insights.push("SLA breaches high - check team capacity")

IF sales.pipeline_value < target * 3:
  insights.push("Pipeline thin - increase lead gen")
```

### Step 7: Compile Report
```
report = {
  period: week_dates,
  health_score: health_score,
  metrics: { revenue, sales, support, ops },
  insights: insights,
  alerts: generate_alerts(metrics),
  recommendations: generate_recommendations(insights)
}
```

### Step 8: Distribute Report
```
ACTION: email.send({
  to: [owner@email.com, team@company.com],
  template: "weekly_report",
  variables: report,
  attachments: ["weekly_report.pdf"]
})

ACTION: slack.post({
  channel: "#announcements",
  message: "Weekly report posted: [link]"
})
```

---

## Success Criteria

- [ ] All metrics collected
- [ ] Health score calculated
- [ ] Insights generated
- [ ] Report distributed
- [ ] Stakeholders notified

---

## Error Handling

| Error | Action |
|-------|--------|
| Data source unavailable | Use cached data, flag as stale |
| Metric calculation failed | Exclude from report, note error |
| Email delivery failed | Retry, then post to Slack |

---

## Rollback

If report contains errors:
1. Generate corrected report
2. Send update with "[CORRECTED]" prefix
3. Archive incorrect version

---

## Related SOPs

- SOP-OPS-001: Support Triage
- SOP-OPS-003: Monthly Close
- SOP-OPS-004: Daily Standup

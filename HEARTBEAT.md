# HEARTBEAT.md — Autonomous Task Checklist v0.3

**Version:** 0.3.0 | **Last Updated:** 2026-03-13 | **Owner:** Scheduler Agent

---

## Overview

HEARTBEAT.md is the central orchestration file for autonomous business operations.
The Scheduler Agent reads this file at defined intervals and executes pending tasks.

**Integration:**
- SOP Templates: `templates/*.md`
- Agent Definitions: `agents/definitions/*.yaml`
- Execution Engine: Mekong CLI PEV (Planner-Executor-Verifier)

---

## Configuration

```yaml
scheduler:
  enabled: true
  timezone: Asia/Saigon
  log_executions: true
  alert_on_failure: true
  max_retries: 3
```

---

## Every 30 Minutes

**Trigger:** `*/30 * * * *` | **Agent:** scheduler-agent + support-agent

- [ ] **SLA Monitor:** Check tickets approaching deadline (< 25% SLA remaining)
  - Alert: Slack #support-alerts if any P0/P1 at risk
  - Action: Auto-escalate if < 15 minutes remaining

- [ ] **Support Queue:** Check for new support emails
  - Execute: SOP-OPS-001 (Support Triage)
  - Create tickets for unprocessed emails

- [ ] **Task Deadline Check:** Scan active tasks for overdue items
  - Notify: Assignee + manager for overdue > 1 hour
  - Escalate: Overdue > 24 hours

---

## Every Morning (8:00 AM)

**Trigger:** `0 8 * * *` | **Agent:** scheduler-agent + finance-agent + sales-agent

- [ ] **Daily Standup Report**
  - Collect: Yesterday's progress, today's plan, blockers
  - Generate: Standup summary (see SOP-OPS-003)
  - Distribute: Slack #standup + email team@

- [ ] **Overdue Invoice Check**
  - Query: Invoices where due_date < today AND status != "paid"
  - Execute: SOP-FIN-004 (Payment Follow-up) for each
  - Queue: Reminder emails for 1-day overdue

- [ ] **Lead Follow-up List**
  - Query: HOT leads with no activity in > 2 days
  - Query: WARM leads with no activity in > 7 days
  - Notify: Sales rep with follow-up list

- [ ] **Calendar Events Today**
  - Fetch: Today's meetings (internal + client)
  - Display: Time, attendees, purpose, prep notes

---

## Every Monday (10:00 AM)

**Trigger:** `0 10 * * 1` | **Agent:** scheduler-agent + finance-agent + sales-agent

- [ ] **Payment Follow-up SOP**
  - Execute: SOP-FIN-004 for all invoices overdue > 7 days
  - Sequence: Day 7, 14, 30, 60+ follow-ups
  - Escalate: 60+ days to collections agency

- [ ] **Stale Lead Review**
  - Query: Pipeline leads with no activity in > 14 days
  - Action: Re-engage or mark as "lost"
  - Report: Stale lead summary to sales manager

---

## Every Tuesday (2:00 PM)

**Trigger:** `0 14 * * 2` | **Agent:** scheduler-agent + marketing-agent

- [ ] **Social Media Posts**
  - Generate: 3 posts for the week (LinkedIn, Twitter)
  - Schedule: Buffer/Hootsuite integration
  - Topics: Product updates, thought leadership, customer wins

---

## Every Wednesday (10:00 AM)

**Trigger:** `0 10 * * 3` | **Agent:** scheduler-agent + content-agent

- [ ] **Blog/Content Review**
  - Check: Content calendar for upcoming deadlines
  - Assign: Writing tasks to content writers
  - Review: Draft content awaiting approval

---

## Every Thursday (3:00 PM)

**Trigger:** `0 15 * * 4` | **Agent:** scheduler-agent + sales-agent

- [ ] **Pipeline Review**
  - Generate: Pipeline health report
  - Highlight: Deals at risk, stalled opportunities
  - Action: Schedule deal rescue meetings

---

## Every Friday (4:00 PM)

**Trigger:** `0 16 * * 5` | **Agent:** scheduler-agent + operations-agent

- [ ] **Week in Review**
  - Collect: Week's metrics (revenue, deals, support, delivery)
  - Generate: Friday digest for team
  - Celebrate: Wins, closes, shipped features

---

## Every Sunday (6:00 PM)

**Trigger:** `0 18 * * 0` | **Agent:** scheduler-agent + finance-agent

- [ ] **Weekly Business Digest**
  - Execute: SOP-OPS-002 (Weekly Report)
  - Compile: Revenue, sales, support, ops metrics
  - Calculate: Health score, insights, recommendations
  - Distribute: Email to owner + team

- [ ] **MRR Calculation**
  - Query: All active subscriptions
  - Calculate: MRR, ARR, churn, growth rate
  - Update: Dashboard metrics

- [ ] **Weekly Summary to Owner**
  - Format: Executive summary (1 page)
  - Include: Key wins, risks, asks, next week focus
  - Send: Email to owner

---

## Monthly (1st of Month, 9:00 AM)

**Trigger:** `0 9 1 * *` | **Agent:** scheduler-agent + finance-agent

- [ ] **Monthly Financial Close**
  - Execute: SOP-FIN-003 (Monthly Close)
  - Reconcile: All bank accounts
  - Post: Accruals, depreciation
  - Generate: P&L, Balance Sheet, Cash Flow

- [ ] **Monthly Report**
  - Compile: Full month metrics vs. targets
  - Analyze: MoM, QoQ, YoY trends
  - Insights: What worked, what didn't
  - Distribute: Stakeholder report

- [ ] **Recurring Expenses Review**
  - Audit: All subscription expenses
  - Flag: Any changes > 10% from prior month
  - Optimize: Identify cancellation opportunities

- [ ] **Customer Health Score Review**
  - Calculate: Health scores for all customers
  - Flag: At-risk customers (score < 50)
  - Action: Create success manager tasks

---

## Quarterly (1st of Quarter, 2:00 PM)

**Trigger:** `0 14 1 1,4,7,10 *` | **Agent:** scheduler-agent + founder-agent

- [ ] **OKR Check-in**
  - Review: Progress on quarterly OKRs
  - Update: Status (on track, at risk, off track)
  - Report: OKR dashboard update

- [ ] **Board Deck Prep** (if applicable)
  - Collect: Metrics, highlights, lowlights
  - Generate: Board presentation draft
  - Schedule: Board meeting

---

## On-Demand Triggers

**Trigger:** Event-based webhooks | **Agent:** Various

### Payment Events
- [ ] **Payment Received** → Update invoice status, record revenue, send receipt
- [ ] **Payment Failed** → Retry logic, notify customer, update subscription status
- [ ] **Refund Requested** → Create finance ticket, process within 48 hours

### Support Events
- [ ] **New Ticket Created** → Auto-triage (SOP-OPS-001)
- [ ] **SLA Breached** → Escalate to manager, create incident
- [ ] **Negative CSAT** (< 3/5) → Create rescue task, notify CSM

### Sales Events
- [ ] **HOT Lead Scored** (> 70) → Alert sales rep immediately
- [ ] **Demo Requested** → Send booking link, calendar integration
- [ ] **Proposal Viewed** → Notify sales rep, suggest follow-up

### Finance Events
- [ ] **Budget Usage > 80%** → Warn owner, suggest review
- [ ] **Large Expense** (>= $500) → Require approval notification
- [ ] **Cash Runway < 3 months** → Alert founder, suggest actions

### Operations Events
- [ ] **System Incident** → Page on-call, create war room
- [ ] **Deployment Failed** → Rollback, notify team
- [ ] **Security Alert** → Escalate to security lead

---

## Task Execution Protocol

### Pre-Execution
1. Check if task already completed (idempotency)
2. Verify prerequisites are met
3. Confirm assigned agent is available

### During Execution
1. Log start time
2. Execute SOP steps in order
3. Handle errors per SOP error handling

### Post-Execution
1. Mark task [x] completed
2. Log execution result
3. Trigger follow-up tasks if needed
4. Notify stakeholders

---

## Error Handling

| Error Type | Action |
|------------|--------|
| Agent unavailable | Retry max 3x, then alert human |
| SOP execution failed | Log error, create incident ticket |
| Data source unavailable | Use cached data, flag as stale |
| SLA breach imminent | Escalate immediately |
| Payment processing failed | Retry with backoff, notify customer |

---

## Audit Trail

All heartbeat executions are logged to:
- `.mekong/heartbeat/execution_log.jsonl`
- Each entry: `{timestamp, task, agent, status, duration, output}`

Retention: 90 days

---

## Related Documents

- **SOP Templates:** `templates/*.md`
- **Agent Definitions:** `agents/definitions/*.yaml`
- **Execution Engine:** `src/core/orchestrator.py`
- **Scheduler:** `agents/definitions/scheduler-agent.yaml`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-02-01 | Initial heartbeat structure |
| 0.2.0 | 2026-02-15 | Added SLA monitoring, weekly digest |
| 0.3.0 | 2026-03-13 | Full SOP integration, 6 agent definitions |

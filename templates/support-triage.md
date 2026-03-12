# SOP: Triage Support Ticket

**ID:** OPS-001 | **Version:** 1.0 | **Owner:** Support Agent

---

## Trigger

- [ ] New email to support@
- [ ] Contact form submission
- [ ] Chat transcript created
- [ ] Social media mention

---

## Prerequisites

- [ ] Customer record exists (or create)
- [ ] Issue description available
- [ ] Contact channel identified

---

## Steps

### Step 1: Parse Incoming Request
```
ACTION: nlp.extract({
  source: email/chat/form,
  fields: [
    "customer_email",
    "subject",
    "body",
    "attachments",
    "sent_at"
  ]
})
```

### Step 2: Identify Customer
```
customer = crm.lookup(email: parsed.customer_email)

IF customer NOT_FOUND:
  customer = crm.customer.create({
    email: parsed.customer_email,
    source: "support_inquiry"
  })
```

### Step 3: Categorize Issue

**Categories:**
- `billing` - Invoices, payments, refunds
- `technical` - Bugs, errors, not working
- `feature_request` - New functionality asks
- `how_to` - Usage questions
- `account` - Access, permissions, settings
- `other` - Doesn't fit above

```
category = classifier.classify(
  text: parsed.subject + parsed.body,
  labels: ["billing", "technical", "feature_request", "how_to", "account", "other"]
)
```

### Step 4: Assess Priority

| Priority | SLA | Criteria |
|----------|-----|----------|
| P0 - Critical | 1 hour | System down, data loss |
| P1 - High | 4 hours | Major feature broken |
| P2 - Medium | 24 hours | Minor issue, workaround exists |
| P3 - Low | 72 hours | Enhancement request |

```
priority = assess_priority({
  customer_tier: customer.plan,
  issue_category: category,
  sentiment: nlp.sentiment(parsed.body),
  keywords: ["urgent", "down", "broken", "asap"]
})
```

### Step 5: Create Ticket
```
ticket = support.create({
  customer_id: customer.id,
  subject: parsed.subject,
  description: parsed.body,
  category: category,
  priority: priority,
  status: "open",
  sla_deadline: now() + priority.sla,
  assigned_to: auto_assign(category)
})
```

### Step 6: Auto-Assign
```
CASE category:
  "billing" → assign: finance_agent
  "technical" → assign: coder_agent + reviewer_agent
  "how_to" → assign: support_agent
  "feature_request" → assign: product_agent
  DEFAULT → assign: support_agent
```

### Step 7: Send Acknowledgment
```
ACTION: email.send({
  to: customer.email,
  template: "ticket_acknowledgment",
  variables: {
    ticket_id: ticket.id,
    priority: priority,
    sla: priority.sla
  }
})
```

### Step 8: Create Follow-up Task
```
ACTION: task.schedule({
  type: "sla_check",
  ticket_id: ticket.id,
  due: now() + (priority.sla * 0.75)  # Check at 75% of SLA
})
```

---

## Success Criteria

- [ ] Ticket created with ID
- [ ] Category assigned
- [ ] Priority set
- [ ] Agent assigned
- [ ] Customer acknowledged
- [ ] SLA tracking active

---

## Error Handling

| Error | Action |
|-------|--------|
| Cannot parse email | Flag for manual review |
| Customer not found | Create placeholder record |
| Auto-assign failed | Route to support queue |
| SLA breach | Escalate to manager |

---

## Rollback

If ticket misrouted:
1. Reassign to correct agent
2. Notify new assignee
3. Log reassignment reason
4. Update SLA if delayed

---

## Related SOPs

- SOP-SAL-002: Customer Onboard
- SOP-OPS-005: Weekly Report
- SOP-OPS-007: Daily Standup

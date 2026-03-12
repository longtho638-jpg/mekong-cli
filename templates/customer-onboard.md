# SOP: Onboard New Customer

**ID:** SOP-SAL-002 | **Version:** 1.0 | **Owner:** Sales Agent

---

## Trigger

- [ ] Payment received (invoice paid)
- [ ] Contract signed
- [ ] Trial converted to paid

---

## Prerequisites

- [ ] Customer record exists
- [ ] Payment confirmed
- [ ] Signed agreement stored

---

## Steps

### Step 1: Welcome Email
```
ACTION: email.send({
  to: customer.email,
  template: "welcome_aboard",
  variables: {
    customer_name: customer.name,
    plan: customer.plan,
    kickoff_link: calendar.book()
  }
})
```

### Step 2: Create Customer Folder
```
ACTION: storage.create_folder(
  path: "customers/[customer.name]",
  structure: [
    "contracts",
    "invoices",
    "deliverables",
    "communications"
  ]
)
```

### Step 3: Setup Project
```
ACTION: project.create({
  name: customer.name + " - " + service_type,
  client: customer.id,
  status: "onboarding",
  team: assigned_team,
  deadline: customer.deadline
})
```

### Step 4: Schedule Kickoff Call
```
ACTION: calendar.invite({
  attendees: [customer.email, team.emails],
  duration: 60,
  template: "kickoff_meeting",
  booking_link: calendar.availability
})
```

### Step 5: Internal Handoff
```
ACTION: slack.post({
  channel: "#customer-success",
  message: {
    type: "new_customer",
    name: customer.name,
    plan: customer.plan,
    value: contract.value,
    kickoff: scheduled_date
  }
})
```

### Step 6: Send Onboarding Checklist
```
ACTION: email.send({
  to: customer.email,
  template: "onboarding_checklist",
  attachments: ["getting_started.pdf"]
})
```

### Step 7: Create Success Plan
```
ACTION: document.create({
  template: "success_plan",
  customer: customer.id,
  milestones: [
    { name: "Kickoff", due: week_1 },
    { name: "Discovery", due: week_2 },
    { name: "Implementation", due: week_4 },
    { name: "Go Live", due: week_6 }
  ]
})
```

### Step 8: Update CRM
```
ACTION: crm.customer.update({
  id: customer.id,
  status: "active",
  onboarded_at: now(),
  csm_assigned: true
})
```

---

## Success Criteria

- [ ] Welcome email sent
- [ ] Project created in PM system
- [ ] Kickoff call scheduled
- [ ] Internal team notified
- [ ] Customer has checklist
- [ ] Success plan created
- [ ] CRM status = "active"

---

## Error Handling

| Error | Action |
|-------|--------|
| Payment failed | Pause onboarding, notify billing |
| Calendar conflict | Offer alternative slots |
| Team unavailable | Assign backup resources |

---

## Rollback

If onboarding needs to restart:
1. Pause project
2. Notify customer
3. Reschedule kickoff
4. Update CRM status = "onboarding_paused"

---

## Related SOPs

- SOP-SAL-001: Qualify Lead
- SOP-FIN-001: Send Invoice
- SOP-OPS-006: Support Triage

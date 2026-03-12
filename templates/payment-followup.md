# SOP: Payment Follow-up

**ID:** SOP-FIN-004 | **Version:** 1.0 | **Owner:** Finance Agent

---

## Trigger

- [ ] Invoice overdue by 1 day
- [ ] Invoice overdue by 7 days
- [ ] Invoice overdue by 14 days
- [ ] Invoice overdue by 30 days
- [ ] Manual trigger

---

## Prerequisites

- [ ] Invoice exists and is overdue
- [ ] Customer contact info available
- [ ] Previous follow-ups logged

---

## Steps

### Step 1: Identify Overdue Invoices
```
overdue = billing.invoices.where({
  status: "sent" OR "partial",
  due_date < today,
  amount_due > 0
})

FOR EACH invoice IN overdue:
  days_overdue = today - invoice.due_date
  followup_sequence(invoice, days_overdue)
```

### Step 2: Follow-up Sequence Logic

| Days Overdue | Action | Channel | Tone |
|--------------|--------|---------|------|
| 1 | Gentle reminder | Email | Friendly |
| 7 | Second notice | Email + SMS | Polite |
| 14 | Phone call | Call | Firm |
| 30 | Final notice | Email + Call | Urgent |
| 60+ | Collections | Agency | Formal |

### Step 3: Day 1 - Gentle Reminder
```
IF days_overdue == 1:
  email.send({
    to: invoice.customer.email,
    template: "payment_reminder_gentle",
    variables: {
      invoice_number: invoice.number,
      amount: invoice.amount,
      due_date: invoice.due_date,
      payment_link: invoice.payment_url
    },
    subject: "Friendly reminder: Invoice #[number] due"
  })

  log.followup({
    invoice_id: invoice.id,
    type: "email",
    sequence: 1
  })
```

### Step 4: Day 7 - Second Notice
```
IF days_overdue == 7:
  email.send({
    to: invoice.customer.email,
    template: "payment_reminder_firm",
    variables: {...},
    subject: "Payment required: Invoice #[number] overdue"
  })

  IF customer.phone:
    sms.send({
      to: customer.phone,
      message: "Hi [name], invoice #[number] for $[amount] is overdue. Pay: [link]"
    })

  log.followup({
    invoice_id: invoice.id,
    type: "email+sms",
    sequence: 2
  })
```

### Step 5: Day 14 - Phone Call
```
IF days_overdue == 14:
  task.create({
    type: "phone_call",
    assigned_to: finance_agent OR human,
    customer: customer.id,
    script: "payment_followup_script",
    talking_points: [
      "Confirm received invoices",
      "Check for issues",
      "Offer payment plan if needed",
      "Get commitment date"
    ]
  })
```

### Step 6: Day 30 - Final Notice
```
IF days_overdue == 30:
  email.send({
    to: [customer.email, customer.billing_contact],
    cc: [finance_manager@email.com],
    template: "payment_final_notice",
    variables: {...},
    subject: "FINAL NOTICE: Invoice #[number] - $[amount]"
  })

  task.create({
    type: "escalation_call",
    assigned_to: finance_manager,
    priority: "high"
  })
```

### Step 7: Day 60+ - Collections
```
IF days_overdue >= 60:
  invoice.update({
    status: "collections"
  })

  IF policy.auto_send_to_collections:
    collections.agency.submit({
      invoice: invoice,
      customer: customer,
      amount: invoice.amount_due,
      days_overdue: days_overdue
    })
  ELSE:
    task.create({
      type: "manual_collections_review",
      assigned_to: finance_manager
    })
```

### Step 8: Process Payment Response
```
ON payment.received(event):
  invoice = event.invoice

  IF invoice.status == "collections":
    collections.agency.notify_paid(invoice)

  invoice.update({
    status: "paid",
    paid_at: now(),
    amount_paid: event.amount
  })

  customer.update({
    payment_status: "current"
  })

  log.payment_received({
    invoice_id: invoice.id,
    amount: event.amount,
    method: event.method
  })
```

---

## Success Criteria

- [ ] Follow-up sent at each interval
- [ ] Customer contacted appropriately
- [ ] Payment received or arrangement made
- [ ] All follow-ups logged
- [ ] Escalation handled correctly

---

## Error Handling

| Error | Action |
|-------|--------|
| Email bounced | Try alternate contact, phone |
| Phone unanswered | Leave VM, send SMS |
| Customer disputes | Create support ticket |
| Payment link broken | Generate new link |

---

## Rollback

If follow-up sent in error (payment was received):
1. Send apology email
2. Update invoice status
3. Document in notes
4. Review automation triggers

---

## Related SOPs

- SOP-FIN-001: Send Invoice
- SOP-FIN-002: Log Expense
- SOP-FIN-003: Monthly Close

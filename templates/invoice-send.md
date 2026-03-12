# SOP: Send Invoice to Customer

**ID:** SOP-FIN-001 | **Version:** 1.0 | **Owner:** Finance Agent

---

## Trigger

- [ ] New invoice created in billing system
- [ ] Payment milestone reached (deposit, 50%, final)
- [ ] Recurring billing cycle (monthly subscription)

---

## Prerequisites

- [ ] Customer record exists with valid email
- [ ] Invoice PDF generated
- [ ] Payment link active (Polar.sh stripe)
- [ ] Invoice number assigned

---

## Steps

### Step 1: Validate Invoice Data
```
CHECK: invoice.amount > 0
CHECK: customer.email is valid format
CHECK: invoice.due_date >= today
```

### Step 2: Prepare Email
**To:** customer.email
**Subject:** Invoice #[invoice.number] from [company.name]
**Attachment:** invoice.pdf

**Template:**
```
Dear [customer.name],

Thank you for your business.

Invoice #[invoice.number] for [invoice.amount] is due on [invoice.due_date].

Pay now: [payment.link]

Best regards,
[company.name] Team
```

### Step 3: Send Email
```
ACTION: email.send(
  to: customer.email,
  subject: "Invoice #[invoice.number]",
  body: email_template,
  attachments: [invoice.pdf]
)
```

### Step 4: Log Activity
```
ACTION: activity_log.create({
  type: "invoice_sent",
  invoice_id: invoice.id,
  customer_id: customer.id,
  sent_at: now(),
  channel: "email"
})
```

### Step 5: Schedule Follow-up
```
ACTION: task.schedule({
  type: "payment_followup",
  due_date: invoice.due_date + 1 day,
  invoice_id: invoice.id
})
```

---

## Success Criteria

- [ ] Email sent successfully (SMTP 250 OK)
- [ ] Activity logged in CRM
- [ ] Follow-up task scheduled
- [ ] Invoice status = "sent"

---

## Error Handling

| Error | Action |
|-------|--------|
| Invalid email | Notify sales agent, pause SOP |
| SMTP failure | Retry max 3x, then alert human |
| PDF missing | Generate invoice PDF, retry |

---

## Rollback

If email bounced:
1. Mark invoice status = "delivery_failed"
2. Create support ticket
3. Notify account owner

---

## Related SOPs

- SOP-FIN-002: Payment Follow-up
- SOP-FIN-003: Monthly Close
- SOP-SAL-004: Customer Onboard

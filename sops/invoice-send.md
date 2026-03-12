---
name: Send Invoice
version: "0.2"
category: finance
trigger: Payment milestone reached or recurring billing cycle
mcu_cost: 1
---
# Send Invoice

## Trigger
- New invoice created in billing system
- Payment milestone reached (deposit, 50%, final)
- Recurring billing cycle

## Prerequisites
- Customer record with valid email
- Invoice PDF generated
- Payment link active (Polar.sh)
- Invoice number assigned

## Steps
1. Validate invoice: amount > 0, valid email, due_date >= today
2. Prepare email with invoice PDF attachment and payment link
3. Send via SMTP to customer email
4. Log activity in CRM (type: invoice_sent, timestamp: now)
5. Schedule follow-up task for due_date + 1 day

## Verification
- SMTP 250 OK received
- Activity logged in CRM
- Follow-up task created
- Invoice status = "sent"

## Rollback
If email bounced:
1. Set invoice status = "delivery_failed"
2. Create support ticket
3. Notify account owner to update contact details

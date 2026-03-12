---
name: Overdue Payment Follow-up
version: "0.2"
category: finance
trigger: Invoice due_date passed with status != paid
mcu_cost: 2
---
# Overdue Payment Follow-up

## Trigger
- Scheduled: Every Monday 08:00 check
- Daily morning scan for newly overdue invoices

## Prerequisites
- Invoice records accessible
- Customer contact info available
- Payment link active

## Steps
1. Query invoices: due_date < today AND status NOT IN (paid, cancelled)
2. Group by days overdue: 1-7, 8-14, 15-30, 31-60, 60+
3. For each group, apply escalation sequence:
   - Day 1-7: Friendly reminder with payment link
   - Day 8-14: Second reminder, offer payment plan
   - Day 15-30: Formal notice, flag account
   - Day 31-60: Final notice, suspend service warning
   - Day 60+: Escalate to collections, suspend account
4. Send appropriate email template per escalation tier
5. Log follow-up activity in CRM against customer record
6. Flag accounts at Day 31+ for owner review
7. Update invoice status to "overdue" if not already set

## Verification
- Emails sent for all overdue invoices
- CRM activity logged per invoice
- Accounts flagged at correct escalation tier
- Owner notified for Day 31+ accounts

## Rollback
If email sent to wrong customer:
1. Send apology email immediately
2. Correct CRM record
3. Re-send correct follow-up to right customer
4. Log incident for audit

---
name: Support Ticket Triage
version: "0.2"
category: support
trigger: New support ticket or email received
mcu_cost: 1
---
# Support Ticket Triage

## Trigger
- New ticket created in helpdesk
- Inbound support email received
- Webhook from support portal

## Prerequisites
- Helpdesk system accessible
- SLA policy configured per plan tier
- Support agent available

## Steps
1. Parse ticket: subject, body, sender email, attachments
2. Look up customer record by email: plan tier, health score, history
3. Classify issue type: billing, technical, feature-request, bug, other
4. Assign priority based on tier + impact:
   - P0: service down, Enterprise customer
   - P1: major feature broken, any paying customer
   - P2: minor issue, workaround available
   - P3: general question, feature request
5. Set SLA deadline: P0=1h, P1=4h, P2=24h, P3=72h
6. Route to correct queue: billing → finance-agent, technical → coder-agent
7. Send acknowledgment to customer with ticket ID and ETA
8. Log ticket in CRM against customer record

## Verification
- Ticket created with priority and SLA set
- Routed to correct agent/queue
- Acknowledgment sent to customer
- CRM record updated

## Rollback
If misclassified:
1. Update priority and queue
2. Recalculate SLA deadline
3. Notify newly assigned agent

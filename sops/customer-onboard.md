---
name: New Customer Onboarding
version: "0.2"
category: ops
trigger: Payment confirmed or contract signed
mcu_cost: 2
---
# New Customer Onboarding

## Trigger
- Payment received (Polar.sh webhook)
- Contract signed and countersigned

## Prerequisites
- Customer record exists in CRM
- Product/plan selected and paid
- Onboarding checklist template available

## Steps
1. Create customer workspace: provision account, set plan limits
2. Send welcome email with login credentials and getting-started guide
3. Schedule kickoff call within 48 hours (calendar invite)
4. Create onboarding project with milestone tasks (day 1, 7, 30)
5. Assign customer success manager
6. Send onboarding survey (baseline NPS + goals)
7. Add to customer Slack channel or support portal
8. Log deal as "won" in CRM, update pipeline

## Verification
- Account provisioned and accessible
- Welcome email delivered
- Kickoff call scheduled
- Onboarding tasks created
- CSM assigned in CRM

## Rollback
If provisioning fails:
1. Notify engineering on-call
2. Send apology email to customer with ETA
3. Create P1 incident ticket
4. Retry provisioning after fix confirmed

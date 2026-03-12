---
name: Qualify Inbound Lead
version: "0.2"
category: sales
trigger: New lead created or demo requested
mcu_cost: 2
---
# Qualify Inbound Lead

## Trigger
- New lead form submission
- Demo request received
- Inbound email from prospect

## Prerequisites
- Lead contact info (name, email, company)
- CRM access to create/update records

## Steps
1. Create lead record in CRM with source, timestamp, contact info
2. Enrich lead: lookup company size, industry, revenue (Clearbit/LinkedIn)
3. Apply BANT scoring:
   - Budget: estimated spend capacity (1-3)
   - Authority: decision-maker vs. influencer (1-3)
   - Need: problem fit with product (1-3)
   - Timeline: purchase horizon (1-3)
4. Calculate total score (max 12): HOT >= 9, WARM 5-8, COLD < 5
5. Assign to sales rep based on territory/industry
6. Send personalized acknowledgment email within 5 minutes
7. Schedule follow-up task: HOT = same day, WARM = 2 days, COLD = 7 days

## Verification
- Lead record created with BANT score
- Assigned to sales rep
- Acknowledgment email sent (SMTP 250 OK)
- Follow-up task scheduled

## Rollback
If enrichment fails:
1. Mark lead as "manual-review"
2. Notify sales rep to qualify manually
3. Proceed with available data

---
name: Launch Email Campaign
version: "0.2"
category: sales
trigger: Campaign scheduled or manually launched
mcu_cost: 2
---
# Launch Email Campaign

## Trigger
- Campaign scheduled date reached
- Manual launch by marketing agent or owner

## Prerequisites
- Recipient list segmented and validated
- Email copy reviewed and approved
- Unsubscribe link configured
- Sending domain SPF/DKIM verified

## Steps
1. Load recipient segment: filter by criteria, remove unsubscribes
2. Validate list: remove duplicates, invalid emails, bounced addresses
3. Personalize content: inject {first_name}, {company}, dynamic fields
4. Send test email to internal alias, verify rendering
5. Schedule or immediately send via email provider (batch: 500/hour)
6. Monitor delivery in real-time: track opens, clicks, bounces
7. Log campaign start: name, segment size, send time, template ID
8. Schedule performance report for T+24h and T+72h

## Verification
- Test email approved before send
- Delivery rate >= 95%
- Bounce rate < 2%
- Campaign record created with send stats

## Rollback
If bounce rate > 5% after first 100 sends:
1. Pause campaign immediately
2. Audit list for quality issues
3. Notify marketing agent
4. Resume only after list cleaned

# SOP: Qualify Sales Lead

**ID:** SOP-SAL-001 | **Version:** 1.0 | **Owner:** Sales Agent

---

## Trigger

- [ ] New lead form submission
- [ ] Inbound email to sales@
- [ ] LinkedIn connection accepted
- [ ] Referral received
- [ ] Event/business card scanned

---

## Prerequisites

- [ ] Lead contact info available
- [ ] Company/organization identified
- [ ] Source of lead tracked

---

## Steps

### Step 1: Enrich Lead Data
```
ACTION: enrichment.lookup(
  email: lead.email,
  company: lead.company_name
) → {
  company_size: number,
  industry: string,
  revenue: string,
  tech_stack: array,
  decision_maker: boolean
}
```

### Step 2: Score Lead (BANT Framework)

**Budget (0-25 points):**
- 25: Explicitly mentioned budget
- 15: Enterprise company (>500 employees)
- 10: SMB (50-500 employees)
- 5: Startup (< 50 employees)
- 0: Unknown/no budget

**Authority (0-25 points):**
- 25: C-level/Founder/VP
- 20: Director/Head of
- 15: Manager
- 5: Individual contributor
- 0: Unknown role

**Need (0-25 points):**
- 25: Urgent pain point identified
- 20: Clear use case
- 15: Exploring solutions
- 5: Just curious
- 0: No stated need

**Timeline (0-25 points):**
- 25: Ready to buy now
- 20: This quarter
- 15: Next quarter
- 5: Next 6 months
- 0: No timeline

```
total_score = budget + authority + need + timeline
```

### Step 3: Assign Lead Tier
```
IF total_score >= 75:
  tier = "HOT"
  sla_response = "2 hours"
  action = "immediate_outreach"
ELSE IF total_score >= 50:
  tier = "WARM"
  sla_response = "24 hours"
  action = "nurture_sequence"
ELSE:
  tier = "COLD"
  sla_response = "7 days"
  action = "add_to_newsletter"
```

### Step 4: Create CRM Record
```
ACTION: crm.lead.create({
  contact: lead.contact_info,
  company: enriched_company_data,
  score: total_score,
  tier: tier,
  source: lead.source,
  status: "new",
  assigned_to: sales_rep
})
```

### Step 5: Route to Sales Rep
```
IF tier = "HOT":
  notify: sales_rep.immediate(
    channel: "slack",
    message: "HOT lead: [lead.name] - Score: [score]"
  )
ELSE:
  ACTION: task.assign({
    type: "lead_outreach",
    lead_id: lead.id,
    due_date: now() + sla_response
  })
```

### Step 6: Send Auto-Response (if applicable)
```
IF tier = "HOT":
  # Hold for personal outreach
  PASS
ELSE:
  ACTION: email.send({
    to: lead.email,
    template: "nurture_welcome",
    track_opens: true,
    track_clicks: true
  })
```

---

## Success Criteria

- [ ] Lead scored and tiered
- [ ] CRM record created
- [ ] Sales rep notified (HOT) or task assigned
- [ ] Auto-response sent (WARM/COLD)

---

## Error Handling

| Error | Action |
|-------|--------|
| Enrichment API down | Use available data, flag for manual enrichment |
| Duplicate lead | Merge records, preserve history |
| Invalid email | Mark as "invalid", notify sales rep |

---

## Rollback

If lead misrouted:
1. Reassign to correct rep
2. Update notification sent
3. Log reassignment reason

---

## Related SOPs

- SOP-SAL-002: Customer Onboard
- SOP-SAL-003: Email Campaign
- SOP-MKT-001: Lead Generation

---
name: sales-revenue
description: CRM, sales automation, pipeline management, revenue ops, B2B intelligence. Use for sales pipelines, lead scoring, outbound sequences, RevOps dashboards.
license: MIT
version: 1.0.0
---

# Sales & Revenue Skill

Build and optimize sales pipelines, CRM systems, and revenue operations with modern tools and AI-powered automation.

## When to Use

- Setting up CRM systems (Salesforce, HubSpot, Pipedrive)
- Building outbound sales sequences and automation
- Lead scoring and qualification workflows
- Revenue operations dashboard creation
- Sales intelligence and enrichment pipelines
- B2B prospecting and contact database management
- Sales forecasting and pipeline analytics
- Commission tracking and compensation planning
- Contract/proposal generation and e-signatures

## Tool Selection

| Need | Choose |
|------|--------|
| Enterprise CRM | Salesforce (REST + Pub/Sub gRPC) |
| Mid-market CRM | HubSpot (REST + GraphQL beta) |
| SMB CRM | Pipedrive, Attio (PLG-native) |
| Sales engagement | Outreach.io, Salesloft (Clari) |
| B2B database | Apollo.io (275M+ contacts), ZoomInfo |
| Data enrichment | Clay.com (75+ sources, waterfall) |
| Cold email | Instantly.ai, Smartlead |
| Conversation intel | Gong.io (call recording + AI analysis) |
| Unified CRM API | Merge.dev, Rutter (50+ CRM integrations) |
| Reverse ETL | Hightouch, Census (warehouse → CRM) |

## Sales Pipeline Architecture

```
Lead Sources                    Pipeline Stages
┌──────────────┐    ┌─────────────────────────────────────────────┐
│ Inbound      │───▶│ MQL → SQL → Discovery → Demo → Proposal → │
│ Outbound     │    │ Negotiation → Closed Won/Lost              │
│ PLG (PQL)    │    └─────────────────────────────────────────────┘
│ Referral     │           ↓              ↓              ↓
│ Partner      │      Auto-score     Gong analysis   CPQ/DocuSign
└──────────────┘
```

## Outbound Automation Pattern

```
Apollo contact enrichment
  → Clay waterfall (LinkedIn, company data, tech stack)
  → LLM personalization (Claude/GPT-4)
  → Instantly.ai multi-channel sequence (email + LinkedIn)
  → Gong captures replies and calls
  → CRM auto-updated via webhook/Zapier
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Win Rate | Closed Won / Total Opportunities | > 20% |
| Average Deal Size | Total Revenue / Deals Closed | Varies |
| Sales Cycle Length | Avg days from SQL to Close | < 30 days (SMB) |
| Pipeline Coverage | Pipeline Value / Quota | 3-4x |
| Lead-to-Opportunity | Opportunities / Total Leads | > 10% |
| CAC Payback | CAC / Monthly gross margin per customer | < 12 months |
| Net Revenue Retention | (Start MRR + Expansion - Churn) / Start MRR | > 110% |

## Lead Scoring Model

```python
def calculate_lead_score(lead: dict) -> int:
    score = 0
    # Firmographic (40%)
    if lead['employee_count'] > 50: score += 15
    if lead['industry'] in TARGET_INDUSTRIES: score += 15
    if lead['tech_stack_match']: score += 10
    # Behavioral (40%)
    score += min(lead['page_views'], 10) * 2  # Max 20
    if lead['downloaded_whitepaper']: score += 10
    if lead['attended_webinar']: score += 10
    # Engagement (20%)
    if lead['email_opened_count'] > 3: score += 10
    if lead['replied_to_email']: score += 10
    return min(score, 100)
```

## Key Best Practices (2026)

**Product-Led Sales (PLS):** AI detects PQLs from product usage → auto-routes to rep with context
**Agentic Sales:** AI SDRs (11x.ai, Ema) handle initial outbound research + personalization
**Revenue Fabric:** Product usage → Reverse ETL (Hightouch) → CRM → engagement trigger
**Signal-Based Selling:** Track buyer intent signals (G2, TrustRadius, 6sense) → prioritize outreach
**Salesforce Pub/Sub:** gRPC streaming for real-time CRM events (replaces polling)

## References

- `references/crm-pipeline-setup.md` - Salesforce, HubSpot, Pipedrive configuration
- `references/outbound-automation-playbook.md` - Apollo, Clay, Instantly sequence patterns

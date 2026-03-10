---
name: government-govtech
description: Digital government services, civic tech, public sector platforms, e-government, open data, identity verification. Use for govtech apps, citizen portals, government compliance.
license: MIT
version: 1.0.0
---

# Government & GovTech Skill

Build digital government services, civic engagement platforms, public sector compliance tools, and citizen-facing applications.

## When to Use

- Digital government service portals (e-government)
- Citizen identity verification and authentication
- Open data platform and API integration
- Government procurement and contracting systems
- Public records management and FOIA automation
- Regulatory compliance and reporting
- Civic engagement and participatory budgeting
- Government payment processing
- Emergency management and alert systems
- GovCloud deployment and FedRAMP compliance

## Tool Selection

| Need | Choose |
|------|--------|
| Identity verification | Login.gov (US), ID.me, Jumio, Onfido |
| Government CMS | Drupal (GovCMS), WordPress VIP (FedRAMP) |
| Open data platform | CKAN (open-source), Socrata, data.gov APIs |
| Citizen engagement | CitizenLab, Bang the Table, Decidim |
| Digital forms | Typeform Gov, JotForm HIPAA, Formstack Gov |
| Document management | Box Gov (FedRAMP), SharePoint Gov |
| Payment processing | Pay.gov, Stripe (FedRAMP Moderate), PayIt |
| GovCloud hosting | AWS GovCloud, Azure Government, Google Gov |
| Case management | Salesforce Government Cloud, ServiceNow |
| Notification service | Notify.gov (US), GOV.UK Notify (UK) |

## GovTech Architecture

```
Citizens / Businesses
    ↓ (Browser / Mobile / API)
┌────────────────────────────────────────────┐
│  Digital Service Layer (FedRAMP)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Identity │  │ Service  │  │ Payment  │ │
│  │ (Login)  │  │ Portal   │  │ Gateway  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Backend Services                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Case     │  │ Document │  │ Notifi-  │ │
│  │ Mgmt     │  │ Mgmt     │  │ cation   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Open     │  │ Analytics│  │ Audit    │
│ Data API │  │ Dashboard│  │ Trail    │
└──────────┘  └──────────┘  └──────────┘
```

## Open Data API Integration

```python
import requests

# CKAN API example (data.gov compatible)
CKAN_URL = "https://catalog.data.gov/api/3"

# Search datasets
response = requests.get(f"{CKAN_URL}/action/package_search", params={
    "q": "education spending",
    "rows": 10,
    "sort": "metadata_modified desc"
})
datasets = response.json()["result"]["results"]

# Get specific dataset resources
dataset_id = datasets[0]["id"]
resources = requests.get(
    f"{CKAN_URL}/action/package_show",
    params={"id": dataset_id}
).json()["result"]["resources"]

# Download CSV resource
csv_url = resources[0]["url"]
data = requests.get(csv_url).text
```

## Compliance Requirements

| Framework | Scope | Requirements |
|-----------|-------|-------------|
| FedRAMP | US federal cloud | Security controls (Low/Mod/High), continuous monitoring |
| StateRAMP | US state/local | Simplified FedRAMP for states |
| FISMA | US federal IT | Risk management, annual assessments |
| Section 508 | US accessibility | WCAG 2.1 AA compliance for government sites |
| GDPR | EU citizen data | Data protection, privacy by design |
| ADA | US disability | Digital accessibility requirements |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Digital Adoption | Online users / Total service users | > 60% |
| Service Completion | Completed / Started applications | > 80% |
| Processing Time | Submission → Resolution average | Reducing QoQ |
| Citizen Satisfaction | Survey score (CSAT) | > 4.0/5.0 |
| Uptime (SLA) | Available / Total time | > 99.9% |
| Accessibility Score | Lighthouse accessibility | > 95 |
| Data Freshness | Last update frequency | Per dataset SLA |
| Cost per Transaction | Total IT cost / Transactions | Decreasing |

## References

- Login.gov: https://developers.login.gov
- CKAN: https://docs.ckan.org
- data.gov: https://www.data.gov/developers
- GOV.UK Notify: https://www.notifications.service.gov.uk
- AWS GovCloud: https://aws.amazon.com/govcloud-us
- CitizenLab: https://www.citizenlab.co
- FedRAMP: https://www.fedramp.gov
- Decidim: https://decidim.org

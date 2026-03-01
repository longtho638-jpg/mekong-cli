# Customer Data Unification — 第十三篇 用間 (Intelligence)

> CDP architecture, identity resolution, real-time customer graphs, reverse ETL.

## Khi Nao Kich Hoat

Keywords: `CDP`, `customer data platform`, `identity resolution`, `data unification`, `customer 360`, `reverse ETL`, `customer graph`, `data warehouse`, `audience segmentation`, `event tracking`

## Vai Tro

1. **Identity Resolution** — Cross-device/channel identity stitching, probabilistic + deterministic matching
2. **Real-time Customer Graph** — Unified profile with behaviors, transactions, interactions
3. **Audience Segmentation** — Dynamic cohorts, predictive segments, lookalike modeling
4. **Reverse ETL** — Push unified data back to marketing tools, CRMs, ad platforms

## Nghien Cuu (2026)

- CDP market bifurcating: platformization vs. agentification (Gartner 2026)
- Oracle rises from Visionary to Leader — unifies customer/account/B2B commercial data
- Real-time CDPs unify B2B customer data for deeper insights across touchpoints
- Every customer interaction, intent, behavior attached to coherent identity
- CDPs are the difference between profitable growth and expensive guesswork

## Cong Cu & Frameworks

| Tool | Use Case | Type |
|------|----------|------|
| Segment | Event tracking + routing | SaaS |
| RudderStack | Open-source CDP | OSS |
| Hightouch | Reverse ETL | SaaS |
| Census | Reverse ETL | SaaS |
| dbt | Data transformation | OSS |
| Apache Kafka | Real-time event streaming | OSS |

## Architecture Patterns

```
Data Sources (web, mobile, CRM, support)
  → Event Collection (Segment/RudderStack)
  → Stream Processing (Kafka)
  → Identity Resolution Engine
  → Unified Customer Graph (warehouse)
  → Audience Builder (dynamic segments)
  → Reverse ETL (→ CRM, ads, email)
  → Analytics Dashboard
```

## Implementation Checklist

- [ ] Multi-source event collection SDK
- [ ] Identity resolution engine (deterministic + probabilistic)
- [ ] Customer profile unification pipeline
- [ ] Real-time streaming ingestion
- [ ] Dynamic audience segmentation builder
- [ ] Reverse ETL connectors (HubSpot, Salesforce, Meta Ads)
- [ ] Customer 360 API for downstream apps

## Lien Ket

- Skills: `segment-cdp`, `analytics-tracking`, `data-pipeline-etl`, `product-analytics`
- Sources: [Gartner CDP 2026](https://www.cxtoday.com/customer-analytics-intelligence/gartner-magic-quadrant-cdp-2026/)

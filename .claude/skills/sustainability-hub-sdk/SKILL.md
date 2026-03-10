---
name: sustainability-hub-sdk
description: Unified sustainability SDK — carbon accounting, ESG reporting, climate risk. Use for emissions tracking, sustainability dashboards, climate compliance, ESG scoring.
license: MIT
version: 1.0.0
---

# Sustainability Hub SDK Skill

Build carbon accounting, ESG reporting, and climate risk systems with unified sustainability facades.

## When to Use

- Carbon footprint calculation and tracking
- ESG (Environmental, Social, Governance) reporting
- Climate risk assessment and modeling
- Sustainability dashboard development
- Carbon credit marketplace integration
- Regulatory compliance (CSRD, TCFD, SEC Climate)

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/sustainability-hub-sdk/carbon-accounting` | CarbonAccountingFacade | Scope 1/2/3, offsets |
| `@agencyos/sustainability-hub-sdk/esg-reporting` | ESGReportingFacade | Frameworks, scores, disclosure |
| `@agencyos/sustainability-hub-sdk/climate-risk` | ClimateRiskFacade | Scenarios, physical/transition risk |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-climate` | Core climate engine |

## Usage

```typescript
import { CarbonAccountingFacade, ESGReportingFacade, ClimateRiskFacade } from '@agencyos/sustainability-hub-sdk';
```

## Related Skills

- `sustainability-esg-agent` — ESG AI agent
- `climate-tech` — Climate technology patterns
- `climate-carbon-accounting` — Carbon accounting details
- `carbon-accounting-api` — Carbon API reference
- `energy-esg` — Energy sector ESG

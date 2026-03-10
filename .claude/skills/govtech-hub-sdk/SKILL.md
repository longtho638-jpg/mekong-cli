---
name: govtech-hub-sdk
description: Unified GovTech SDK — citizen services, digital identity, government procurement, regulatory compliance, audit trails. Use for e-government, civic tech, procurement platforms.
license: MIT
version: 1.0.0
---

# GovTech Hub SDK Skill

Build e-government portals, procurement systems, and regulatory compliance platforms.

## When to Use

- Citizen service portals and digital identity (eKYC)
- Government procurement and tender management
- Regulatory compliance and reporting
- Audit trail and policy document management
- Vendor evaluation and contract tracking
- Open data and civic tech platforms

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/govtech-hub-sdk/citizen` | CitizenFacade | Profiles, services, digital ID |
| `@agencyos/govtech-hub-sdk/procurement` | ProcurementFacade | Tenders, bids, contracts |
| `@agencyos/govtech-hub-sdk/compliance` | ComplianceFacade | Reports, audit trails, policies |

## Usage

```typescript
import { createCitizenPortal, createProcurementManager } from '@agencyos/govtech-hub-sdk';
```

## Related Skills

- `government-govtech` — GovTech platform patterns
- `civic-govtech` — Civic technology reference
- `defense-govtech-ai` — Defense & security AI

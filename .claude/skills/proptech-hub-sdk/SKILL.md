---
name: proptech-hub-sdk
description: Unified PropTech SDK — property management, real estate listings, smart buildings, valuation, tenant screening. Use for PropTech apps, real estate marketplaces, property platforms.
license: MIT
version: 1.0.0
---

# PropTech Hub SDK Skill

Build property management platforms, real estate marketplaces, and smart building systems.

## When to Use

- Property listing and marketplace development
- Rental and lease management platforms
- Property valuation and AVM (Automated Valuation Models)
- Smart building and IoT access control
- Tenant screening and background checks
- Real estate investment platforms

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/proptech-hub-sdk/property` | PropertyFacade | Listings, tenants, leases |
| `@agencyos/proptech-hub-sdk/valuation` | ValuationFacade | AVM, comparables, market analysis |
| `@agencyos/proptech-hub-sdk/smart-building` | SmartBuildingFacade | Access control, energy, IoT |

## Usage

```typescript
import { createPropertyManager, createValuationEngine } from '@agencyos/proptech-hub-sdk';
import { createSmartBuildingController } from '@agencyos/proptech-hub-sdk/smart-building';
```

## Related Skills

- `property-proptech` — PropTech reference patterns
- `real-estate-agent` — Real estate AI workflows

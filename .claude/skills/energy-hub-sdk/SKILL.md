---
name: energy-hub-sdk
description: Unified Energy SDK — smart grid management, renewable energy, carbon trading, energy billing, IoT meter integration. Use for energy platforms, utility companies, carbon markets, smart home apps.
license: MIT
version: 1.0.0
---

# Energy Hub SDK Skill

Build smart grid platforms, renewable energy management systems, and carbon trading tools.

## When to Use

- Smart grid monitoring and demand response
- Renewable energy asset management (solar, wind, hydro)
- Carbon credit issuance, trading, and retirement
- Energy billing, tariff management, and invoice generation
- IoT smart meter integration and real-time consumption
- Virtual power plant (VPP) and peer-to-peer energy trading

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/energy-hub-sdk/grid` | GridFacade | Grid monitoring, demand response, outages |
| `@agencyos/energy-hub-sdk/renewables` | RenewablesFacade | Solar, wind, storage assets |
| `@agencyos/energy-hub-sdk/carbon` | CarbonFacade | Credits, trading, retirement, reporting |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-energy` | Core energy engine |
| `@agencyos/vibe-smart-grid` | Grid management |
| `@agencyos/vibe-carbon` | Carbon accounting and trading |

## Usage

```typescript
import { createGridManager, createRenewablesManager, createCarbonMarket } from '@agencyos/energy-hub-sdk';

const reading = await createGridManager().ingestMeterReading({
  meterId: 'meter_001',
  timestamp: new Date(),
  kwh: 12.4,
  peakDemandKw: 3.2,
});

const asset = await createRenewablesManager().registerAsset({
  type: 'solar',
  capacityKw: 100,
  location: { lat: 10.77, lng: 106.69 },
  ownerId: 'org_123',
});

const credit = await createCarbonMarket().issueCredit({
  assetId: asset.id,
  periodMwh: 450,
  vintage: 2026,
  standard: 'VCS',
});
```

## Key Types

- `MeterReading` — consumption, demand, timestamps, tariff zone
- `EnergyAsset` — capacity, generation data, certificates, owner
- `CarbonCredit` — serial number, vintage, standard, retirement status
- `GridEvent` — outage, demand spike, frequency deviation

## Related Skills

- `sustainability-hub-sdk` — ESG reporting patterns
- `web3-hub-sdk` — Tokenized carbon credits on-chain

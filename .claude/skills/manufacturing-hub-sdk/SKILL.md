---
name: manufacturing-hub-sdk
description: Unified Manufacturing SDK — MES, production scheduling, quality control (SPC), supply chain, BOM management. Use for IIoT, smart factory, MES, quality systems.
license: MIT
version: 1.0.0
---

# Manufacturing Hub SDK Skill

Build smart factory systems, MES platforms, and quality control solutions.

## When to Use

- Manufacturing Execution Systems (MES)
- Production scheduling and OEE tracking
- Quality control and SPC (Statistical Process Control)
- Supply chain and inventory optimization
- Bill of Materials (BOM) management
- IIoT sensor integration and monitoring

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/manufacturing-hub-sdk/production` | ProductionFacade | Orders, machines, OEE |
| `@agencyos/manufacturing-hub-sdk/quality` | QualityFacade | Inspections, SPC, NCRs |
| `@agencyos/manufacturing-hub-sdk/supply-chain` | SupplyChainFacade | Orders, inventory, BOM |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-physical-ai` | Physical AI / robotics |
| `@agencyos/vibe-robotics` | Robotics automation |

## Usage

```typescript
import { createProductionScheduler, createQualityManager } from '@agencyos/manufacturing-hub-sdk';
```

## Related Skills

- `manufacturing-iiot` — IIoT patterns
- `manufacturing-iiot-agent` — Manufacturing AI workflows

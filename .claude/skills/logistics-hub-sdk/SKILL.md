---
name: logistics-hub-sdk
description: Unified logistics SDK — supply chain, autonomous delivery, warehouse operations. Use for fleet management, route optimization, inventory tracking, last-mile delivery.
license: MIT
version: 1.0.0
---

# Logistics Hub SDK Skill

Build supply chain platforms, autonomous delivery systems, and warehouse operations with unified logistics facades.

## When to Use

- Supply chain visibility and optimization
- Autonomous delivery fleet management
- Warehouse management systems (WMS)
- Route optimization and tracking
- Inventory management across locations
- Last-mile delivery orchestration

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/logistics-hub-sdk/supply-chain` | SupplyChainFacade | Visibility, forecasting, procurement |
| `@agencyos/logistics-hub-sdk/autonomous-delivery` | AutonomousDeliveryFacade | Fleet, routing, dispatch |
| `@agencyos/logistics-hub-sdk/warehouse` | WarehouseFacade | WMS, picking, inventory |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-logistics` | Core logistics engine |

## Usage

```typescript
import { SupplyChainFacade, AutonomousDeliveryFacade, WarehouseFacade } from '@agencyos/logistics-hub-sdk';
```

## Related Skills

- `logistics-ai-agent` — AI logistics optimization
- `autonomous-supply-chain` — Autonomous supply chain patterns
- `supply-chain-agent` — Supply chain AI agent
- `fleet-ev-mobility` — Fleet and EV management

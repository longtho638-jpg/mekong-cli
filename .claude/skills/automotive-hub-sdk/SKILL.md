---
name: automotive-hub-sdk
description: Unified Automotive SDK — fleet management, EV charging, mobility-as-a-service, vehicle tracking. Use for fleet ops, ride-sharing, EV infrastructure, connected vehicles.
license: MIT
version: 1.0.0
---

# Automotive Hub SDK Skill

Build fleet management systems, EV charging networks, and mobility platforms.

## When to Use

- Fleet management and vehicle tracking
- EV charging station networks
- Battery health monitoring and analytics
- Ride-sharing and mobility-as-a-service (MaaS)
- Route optimization and logistics
- Connected vehicle telematics

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/automotive-hub-sdk/fleet` | FleetFacade | Vehicles, tracking, maintenance |
| `@agencyos/automotive-hub-sdk/ev` | EVFacade | Charging stations, battery, sessions |
| `@agencyos/automotive-hub-sdk/mobility` | MobilityFacade | Trips, drivers, routes |

## Usage

```typescript
import { createFleetManager, createChargingNetwork } from '@agencyos/automotive-hub-sdk';
```

## Related Skills

- `automotive-mobility` — Automotive industry patterns
- `fleet-ev-mobility` — Fleet & EV reference

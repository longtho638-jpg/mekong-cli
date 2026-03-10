---
name: hospitality-hub-sdk
description: Unified Hospitality SDK — hotel booking, guest experience, loyalty programs, housekeeping, revenue management. Use for hotel PMS, travel platforms, resort systems.
license: MIT
version: 1.0.0
---

# Hospitality Hub SDK Skill

Build hotel management systems, booking engines, and guest experience platforms.

## When to Use

- Hotel property management systems (PMS)
- Booking engine and reservation management
- Guest loyalty and rewards programs
- Housekeeping and maintenance scheduling
- Revenue management and dynamic pricing
- Travel and tourism platforms

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/hospitality-hub-sdk/booking` | BookingFacade | Reservations, availability, rooms |
| `@agencyos/hospitality-hub-sdk/guest` | GuestFacade | Profiles, loyalty, preferences |
| `@agencyos/hospitality-hub-sdk/operations` | OperationsFacade | Housekeeping, maintenance, revenue |

## Usage

```typescript
import { createBookingEngine, createGuestManager } from '@agencyos/hospitality-hub-sdk';
```

## Related Skills

- `hospitality-agent` — Hospitality AI workflows
- `travel-tourism` — Travel platform patterns

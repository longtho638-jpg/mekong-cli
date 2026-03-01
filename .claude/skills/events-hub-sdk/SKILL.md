---
name: events-hub-sdk
description: Unified Events SDK — event creation, ticketing, attendee management, virtual events, sponsorship. Use for event platforms, conference management, hybrid event apps, venue booking.
license: MIT
version: 1.0.0
---

# Events Hub SDK Skill

Build event management platforms, ticketing systems, and hybrid/virtual event experiences.

## When to Use

- Event creation, scheduling, and venue management
- Ticket sales, QR check-in, and capacity management
- Attendee registration, badges, and networking
- Virtual and hybrid event streaming integration
- Sponsorship packages and exhibitor management
- Post-event analytics and feedback collection

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/events-hub-sdk/event` | EventFacade | Events, sessions, venues, agenda |
| `@agencyos/events-hub-sdk/ticketing` | TicketingFacade | Tickets, QR codes, check-in |
| `@agencyos/events-hub-sdk/virtual` | VirtualFacade | Streaming, rooms, networking |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-events` | Core event management |
| `@agencyos/vibe-ticketing` | Ticket lifecycle |
| `@agencyos/vibe-virtual-events` | Virtual/hybrid streaming |

## Usage

```typescript
import { createEventManager, createTicketingEngine, createVirtualEventHub } from '@agencyos/events-hub-sdk';

const event = await createEventManager().create({
  name: 'AgencyOS Summit 2026',
  startDate: '2026-09-15T09:00:00Z',
  endDate: '2026-09-16T18:00:00Z',
  venue: { name: 'Convention Center', capacity: 2000 },
  format: 'hybrid',
});

const ticket = await createTicketingEngine().issue({
  eventId: event.id,
  tierId: 'general-admission',
  attendeeEmail: 'guest@example.com',
  quantity: 2,
});

const room = await createVirtualEventHub().createRoom({
  eventId: event.id,
  name: 'Keynote Stage',
  capacity: 5000,
  streamProvider: 'mux',
});
```

## Key Types

- `Event` — metadata, sessions, speakers, sponsors, capacity
- `Ticket` — QR code, tier, seat assignment, transfer history
- `Attendee` — registration, badge, check-in status, networking profile
- `VirtualRoom` — stream URL, recording, chat, polling

## Related Skills

- `commerce-hub-sdk` — Payment and checkout patterns
- `community-hub` — Attendee community and networking

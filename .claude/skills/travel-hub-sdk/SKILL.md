---
name: travel-hub-sdk
description: Unified Travel SDK — flight/hotel booking, itinerary planning, loyalty programs, travel insurance, GDS integration. Use for OTAs, corporate travel, travel agent portals.
license: MIT
version: 1.0.0
---

# Travel Hub SDK Skill

Build online travel agencies, corporate travel platforms, and loyalty reward systems.

## When to Use

- Flight, hotel, car, and activity search and booking
- Itinerary planning and trip management
- Loyalty points accrual and redemption
- GDS (Amadeus, Sabre, Travelport) integration
- Travel insurance upsell and claims
- Corporate travel policy enforcement

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/travel-hub-sdk/booking` | BookingFacade | Search, reserve, ticket, cancel |
| `@agencyos/travel-hub-sdk/itinerary` | ItineraryFacade | Trip planning, day-by-day schedule |
| `@agencyos/travel-hub-sdk/loyalty` | LoyaltyFacade | Points, tiers, redemptions |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-travel` | Core travel engine |
| `@agencyos/vibe-gds` | GDS adapter layer |
| `@agencyos/vibe-loyalty` | Loyalty program management |

## Usage

```typescript
import { createBookingEngine, createItineraryManager, createLoyaltyEngine } from '@agencyos/travel-hub-sdk';

const flights = await createBookingEngine().searchFlights({
  origin: 'SGN',
  destination: 'NRT',
  date: '2026-04-01',
  passengers: 2,
  cabin: 'economy',
});

const trip = await createItineraryManager().create({
  name: 'Japan Spring 2026',
  startDate: '2026-04-01',
  endDate: '2026-04-10',
  bookingIds: [flights[0].id],
});

const redemption = await createLoyaltyEngine().redeem({
  memberId: 'mem_123',
  points: 5000,
  reward: 'flight-upgrade',
});
```

## Key Types

- `FlightOffer` — itinerary, fare, baggage allowance, fare rules
- `HotelProperty` — rooms, rates, amenities, cancellation policy
- `TripItinerary` — day segments, bookings, documents
- `LoyaltyAccount` — tier, points balance, expiry

## Related Skills

- `commerce-hub-sdk` — Payment and checkout patterns
- `insurtech-hub-sdk` — Travel insurance integration

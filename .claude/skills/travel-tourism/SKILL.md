---
name: travel-tourism
description: Travel booking APIs, GDS systems, property management, experience platforms, loyalty programs. Use for OTAs, travel tech, booking engines, hospitality systems.
license: MIT
version: 1.0.0
---

# Travel & Tourism Skill

Build travel booking platforms, property management systems, and tourism experiences with modern distribution APIs.

## When to Use

- Travel booking engine (flights, hotels, cars)
- GDS and NDC integration (Amadeus, Sabre)
- Property management system (PMS) for hotels
- Activity and experience marketplace
- Loyalty and rewards program implementation
- Dynamic pricing and revenue management
- Multi-currency and travel payments
- Travel insurance API integration
- Destination marketing and content
- Sustainable tourism tracking

## Tool Selection

| Need | Choose |
|------|--------|
| Flight booking | Amadeus (Self-Service APIs), Duffel, Kiwi.com |
| Hotel booking | Booking.com Connectivity, Cloudbeds PMS |
| GDS access | Sabre (REST), Travelport (JSON), Amadeus |
| NDC standard | Amadeus NDC, IATA ONE Order |
| Experiences | GetYourGuide Partner API, Viator/TripAdvisor |
| PMS | Cloudbeds, Mews, Oracle OPERA Cloud |
| Channel manager | SiteMinder, Channex.io (API-first) |
| Revenue mgmt | IDeaS (ML pricing), Duetto, RoomPriceGenie |
| Travel payments | Nium (cross-border), Payoneer, Wise Business API |
| Insurance | Cover Genius (XCover API), Battleface |

## Travel Booking Architecture

```
Customer Search
    ↓
┌─────────────────────────────────────────────┐
│           Aggregation Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Flights  │  │ Hotels   │  │Activities│  │
│  │ (Duffel) │  │(Amadeus) │  │(Viator)  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
    ↓
Pricing Engine (dynamic markup, FX conversion)
    ↓
Booking Engine (PNR creation, payment capture)
    ↓
Post-Booking (confirmation, e-ticket, itinerary)
    ↓
Fulfillment (supplier notifications, vouchers)
```

## Flight Search Pattern (Duffel API)

```python
import duffel

client = duffel.Duffel(access_token="DUFFEL_TOKEN")

# Search flights
offer_request = client.offer_requests.create({
    "slices": [{
        "origin": "SGN",
        "destination": "NRT",
        "departure_date": "2026-04-15"
    }],
    "passengers": [{"type": "adult"}],
    "cabin_class": "economy"
})

# Get offers sorted by price
offers = client.offers.list(offer_request.id, sort="total_amount")
best = offers[0]
print(f"{best.owner.name}: {best.total_amount} {best.total_currency}")

# Book
order = client.orders.create({
    "selected_offers": [best.id],
    "passengers": [{"given_name": "John", "family_name": "Doe", ...}],
    "payments": [{"type": "balance", "amount": best.total_amount, "currency": best.total_currency}]
})
```

## Hotel Revenue Management

```
Demand Forecasting
  → Historical occupancy + booking pace
  → Event calendar (conferences, holidays, local events)
  → Competitor rate shopping (OTA scraping / RateGain)
  → Weather and seasonality factors
  → ML model → predicted demand curve
  → Dynamic rate adjustment per room type per night
  → Push rates to channel manager → all OTAs updated
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| RevPAR | Room Revenue / Available Rooms | Maximize |
| ADR | Room Revenue / Rooms Sold | Market dependent |
| Occupancy Rate | Rooms Sold / Available Rooms | 70-85% |
| GOPPAR | Gross Operating Profit / Available Rooms | > ADR × 40% |
| Booking Conversion | Bookings / Searches | > 3% |
| Cancellation Rate | Cancellations / Total Bookings | < 15% |
| NPS | Promoters - Detractors | > 50 |
| Look-to-Book | Searches before booking | < 5 |
| TTV | Total Transaction Value | Growth metric |
| Commission Rate | Commission / TTV | 10-20% (OTA) |

## Distribution Channels

| Channel | Commission | Control | Volume |
|---------|-----------|---------|--------|
| Direct website | 0% | Full | Low-Med |
| Booking.com | 15-25% | Limited | High |
| Expedia | 15-25% | Limited | High |
| GDS (Amadeus/Sabre) | $3-8/booking | Medium | Med |
| Metasearch (Google/Tripadvisor) | CPC model | Medium | Med |
| Wholesale/B2B | 20-30% | Low | Variable |

## References

- Amadeus Self-Service APIs: https://developers.amadeus.com
- Duffel API: https://duffel.com/docs
- Cloudbeds API: https://docs.cloudbeds.com
- GetYourGuide Partner: https://partner.getyourguide.com
- Channex.io: https://docs.channex.io

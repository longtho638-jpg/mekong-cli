---
name: event-management
description: Event platforms, ticketing APIs, virtual/hybrid events, sponsorship, venue management, networking. Use for conferences, meetups, festivals, corporate events, webinars.
license: MIT
version: 1.0.0
---

# Event Management Skill

Build event platforms, ticketing systems, and hybrid experiences with modern registration, networking, and analytics tools.

## When to Use

- Event registration and ticketing platform
- Virtual/hybrid event production
- White-label ticketing API integration
- Check-in and badge management
- Sponsorship tracking and ROI measurement
- Event marketing and promotion campaigns
- Venue and space management
- AI-powered attendee networking/matchmaking
- Event analytics and ROI reporting
- Multi-event portfolio management

## Tool Selection

| Need | Choose |
|------|--------|
| Event platform | Eventbrite (3.7%+$1.79), Luma (5%, 0% with Plus), Bizzabo (enterprise) |
| Virtual/hybrid | RingCentral Events (ex-Hopin), Zoom Events (100K+ capacity) |
| White-label tickets | TicketSocket (full REST), Ticketsauce, Future Ticketing |
| Check-in | Whova (QR), CrowdPass (NFC/RFID), Cvent OnArrival |
| Sponsorship | SponsorCX (mobile app), Sponsy (ESP integrations), KORE |
| Networking | Brella (intent-based), Grip (70M recommendations/yr) |
| Venue management | Planning Pod (40+ integrations), Tripleseat (hospitality) |
| Marketing | ActiveCampaign (1000+ integrations), HubSpot (CRM-native) |
| Analytics | Bizzabo, EventsAir, Swapcard, AnyRoad |
| Payments | Stripe (direct), Square (in-person), PayPal |

## Event Platform Architecture

```
Marketing Layer
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Landing  │  │ Email    │  │ Social   │
│ Page     │  │ Sequence │  │ Ads      │
└──────────┘  └──────────┘  └──────────┘
        ↓
Registration & Ticketing
┌─────────────────────────────────────────┐
│ Ticket types → Promo codes → Waitlist   │
│ Custom forms → Payment → Confirmation   │
└─────────────────────────────────────────┘
        ↓
Event Day
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Check-in │  │ Sessions │  │ Network  │
│ QR/NFC   │  │ Schedule │  │ Match    │
└──────────┘  └──────────┘  └──────────┘
        ↓
Post-Event
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Survey   │  │ Content  │  │ ROI      │
│ NPS      │  │ On-demand│  │ Report   │
└──────────┘  └──────────┘  └──────────┘
```

## Ticketing API Integration (Eventbrite)

```python
import requests

headers = {"Authorization": f"Bearer {EVENTBRITE_TOKEN}"}

# Create event
event = requests.post("https://www.eventbriteapi.com/v3/organizations/{org_id}/events/",
    headers=headers,
    json={
        "event": {
            "name": {"html": "Tech Conference 2026"},
            "start": {"timezone": "Asia/Ho_Chi_Minh", "utc": "2026-06-15T09:00:00Z"},
            "end": {"timezone": "Asia/Ho_Chi_Minh", "utc": "2026-06-15T18:00:00Z"},
            "currency": "USD",
            "online_event": False,
            "venue_id": "venue_123"
        }
    }
)

# Create ticket class
ticket = requests.post(f"https://www.eventbriteapi.com/v3/events/{event_id}/ticket_classes/",
    headers=headers,
    json={
        "ticket_class": {
            "name": "Early Bird",
            "quantity_total": 200,
            "cost": "USD,4900",  # $49.00
            "sales_start": "2026-03-01T00:00:00Z",
            "sales_end": "2026-05-01T00:00:00Z"
        }
    }
)

# Webhook: order.placed → send confirmation + add to CRM
```

## AI Networking/Matchmaking

```
Attendee Profile Input:
  → Registration data (role, company, industry)
  → Stated interests and goals
  → Session attendance history
  → Past event connections

AI Matching Engine (Brella/Grip):
  → 100+ attribute analysis per attendee
  → Intent-based matching (not just demographics)
  → Real-time recommendation updates
  → Meeting scheduling with calendar integration
  → Grip: 70M recommendations/year

Output:
  → "You should meet [Person X]: 92% match"
  → Suggested meeting times + locations
  → Post-event connection follow-up
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Attendance Rate | Attendees / Registered | 60-80% |
| Registration Conversion | Registrations / Landing page visits | > 5% |
| NPS | Promoters - Detractors (post-event survey) | > 50 |
| Cost per Attendee | Total event cost / Attendees | Minimize |
| Revenue per Attendee | Total revenue / Attendees | Maximize |
| Sponsorship ROI | Sponsor value delivered / Sponsorship cost | > 3:1 |
| Session Attendance | Avg attendees per session / Total attendees | > 40% |
| Networking Meetings | Meetings booked / Attendees | > 2 per person |
| Lead Quality | SQLs generated / Total leads | > 20% |
| Content Views | On-demand views / Total sessions | > 50% |

## Event Budget Template

```
Revenue Streams:
  Ticket sales           40-60%
  Sponsorship            25-40%
  Exhibition booths      10-20%
  Workshops/add-ons      5-10%

Cost Centers:
  Venue & catering       30-40%
  Speakers & content     10-15%
  Marketing & promotion  15-20%
  Technology (platform)  10-15%
  Staff & operations     10-15%
  Contingency            5-10%

Break-even: Revenue ≥ Costs
Target margin: 20-30% for commercial events
```

## Recommended Stacks

```
STARTUP (< 500 attendees, ~$1K/event):
  Luma (registration) → Whova (check-in) → HubSpot (marketing) → GA4

GROWTH (500-2K attendees, ~$5-15K/event):
  Eventbrite + Zoom Events (hybrid) → Brella (networking)
  → ActiveCampaign (marketing) → Stripe (payments)

ENTERPRISE (1K+ attendees, $15-50K+/event):
  Bizzabo/Cvent → RingCentral Events (hybrid) → Brella/Grip (networking)
  → SponsorCX (sponsorship) → Custom analytics dashboard
```

## References

- Eventbrite API: https://www.eventbrite.com/platform/api
- Luma: https://lu.ma
- Bizzabo: https://www.bizzabo.com/docs
- Brella: https://www.brella.io
- Grip: https://www.grip.events
- RingCentral Events: https://events.ringcentral.com
- Zoom Events: https://zoom.us/docs

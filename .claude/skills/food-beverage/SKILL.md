---
name: food-beverage
description: Restaurant POS, food delivery, kitchen management, menu engineering, food safety, CPG. Use for restaurant tech, ghost kitchens, food manufacturing, recipe costing.
license: MIT
version: 1.0.0
---

# Food & Beverage Skill

Build restaurant technology, food delivery platforms, and F&B operations with modern POS, kitchen management, and food safety tools.

## When to Use

- Restaurant POS system setup and integration
- Online ordering and delivery platform
- Kitchen display system (KDS) implementation
- Menu engineering and dynamic pricing
- Food safety compliance (HACCP, FDA)
- Recipe costing and inventory management
- Reservation and waitlist systems
- Ghost kitchen / cloud kitchen operations
- Food manufacturing and CPG tech
- Multi-location restaurant management

## Tool Selection

| Need | Choose |
|------|--------|
| Cloud POS | Toast (API-first), Square, Lightspeed Restaurant |
| Delivery aggregation | Olo (Rails), Checkmate, ItsaCheckmate |
| Direct delivery | DoorDash Drive API, Uber Direct, Relay |
| KDS | Fresh KDS, Toast KDS, QSR Automations |
| Reservations | OpenTable (Connect API), Resy, Yelp Reservations |
| Inventory | MarketMan, BlueCart, xtraCHEF (by Toast) |
| Menu management | Popmenu, BentoBox, Olo (Omnivore) |
| Food safety | FoodDocs (AI), ComplianceMate, Jolt |
| Loyalty | Thanx, Punchh (by PAR), Square Loyalty |
| Analytics | Restaurant365, Plate IQ, Avero |

## Restaurant Tech Stack Architecture

```
Customer Touchpoints
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Dine-in  │  │ Online   │  │ Delivery │  │ Kiosk    │
│ (POS)    │  │ (Web/App)│  │ (3P Apps)│  │ (Self)   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
        ↓            ↓            ↓            ↓
┌─────────────────────────────────────────────────────┐
│              Order Management Hub                    │
│  Unified orders → Kitchen routing → Prep tracking   │
└─────────────────────────────────────────────────────┘
        ↓                    ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ KDS (Kitchen)│  │ Inventory    │  │ Payments     │
│ Prep timing  │  │ Decrement    │  │ Processing   │
│ Station route│  │ Auto-order   │  │ Tip mgmt     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Online Ordering Integration (DoorDash Drive)

```python
# DoorDash Drive API — Delivery-as-a-Service
import requests

headers = {
    "Authorization": f"Bearer {DOORDASH_TOKEN}",
    "Content-Type": "application/json"
}

delivery = requests.post("https://openapi.doordash.com/drive/v2/deliveries",
    headers=headers,
    json={
        "external_delivery_id": "order_12345",
        "pickup_address": "123 Restaurant St, City, ST 12345",
        "pickup_phone_number": "+11234567890",
        "dropoff_address": "456 Customer Ave, City, ST 12345",
        "dropoff_phone_number": "+10987654321",
        "order_value": 3500,  # $35.00 in cents
        "items": [{"name": "Pad Thai", "quantity": 2}],
        "pickup_time": "2026-03-01T18:30:00Z"
    }
)
# Returns tracking_url, dasher info, ETA
```

## Menu Engineering Matrix

```
              HIGH Popularity
              ┌───────────────────────┐
              │  STARS ⭐             │  PUZZLES 🧩
  HIGH        │  High margin +       │  High margin +
  Profit      │  High popularity     │  Low popularity
              │  → Keep & promote    │  → Reposition/rename
              ├───────────────────────┤
              │  PLOWHORSES 🐴       │  DOGS 🐕
  LOW         │  Low margin +        │  Low margin +
  Profit      │  High popularity     │  Low popularity
              │  → Re-engineer cost  │  → Remove/replace
              └───────────────────────┘
              LOW Popularity
```

## Recipe Costing Formula

```
Food Cost % = (Beginning Inventory + Purchases - Ending Inventory) / Food Sales × 100
Plate Cost = Σ(ingredient_qty × ingredient_unit_cost) + waste_factor
Menu Price = Plate Cost / Target Food Cost %
Contribution Margin = Menu Price - Plate Cost
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Food Cost % | Food costs / Food revenue | 28-35% |
| Labor Cost % | Labor costs / Total revenue | 25-35% |
| Prime Cost % | (Food + Labor) / Revenue | < 65% |
| Table Turnover | Guests served / Seats available | 2-3x lunch, 1.5-2x dinner |
| Average Check | Total revenue / Guest count | Maximize |
| RevPASH | Revenue / Available Seat Hours | Maximize |
| Online Order % | Online orders / Total orders | > 30% |
| Waste % | Wasted food cost / Total food cost | < 4% |
| Customer Retention | Repeat customers / Total | > 30% |
| Speed of Service | Order to delivery time | < 15min dine-in |

## Food Safety Compliance

```yaml
haccp_principles:
  1. Hazard analysis
  2. Critical control points (CCP)
  3. Establish critical limits
  4. Monitoring procedures
  5. Corrective actions
  6. Verification procedures
  7. Record-keeping

temperature_logs:
  - Cold storage: < 40°F (4°C)
  - Hot holding: > 140°F (60°C)
  - Danger zone: 40-140°F (4-60°C) — max 4 hours
  - Automated via IoT sensors → FoodDocs/ComplianceMate
```

## References

- Toast API: https://doc.toasttab.com
- DoorDash Drive: https://developer.doordash.com
- Square API: https://developer.squareup.com
- OpenTable Connect: https://developer.opentable.com
- Restaurant365: https://www.restaurant365.com

---
name: last-mile-delivery-logistics
description: "Last-mile delivery optimization, route planning, real-time tracking, proof of delivery, crowd-sourced delivery — activate when building delivery management platforms, courier apps, or logistics optimization systems"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Last-Mile Delivery & Logistics — Skill

> Last-mile costs represent 53% of total shipping expense; AI-driven dynamic routing and crowd-sourced delivery networks became the dominant competitive moats in 2025 e-commerce fulfillment.

## When to Activate
- Building a delivery management platform (DMS) or courier management system
- Implementing route optimization for delivery fleets (TSP/VRP solvers)
- Adding real-time driver tracking and ETA prediction to an application
- Designing proof-of-delivery (POD) workflows (photo, signature, OTP)
- Integrating crowd-sourced delivery (gig economy) driver networks
- Building driver mobile apps with offline-first capability
- Setting up delivery zone management and SLA monitoring

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Route Optimization | VRP/TSP solving with time windows, capacity, priority constraints | Google OR-Tools, Routific, Vroom |
| Real-Time Tracking | Driver GPS streaming, ETA recalculation, geofence events | Onfleet, Bringg, Here Tracking |
| Proof of Delivery | Photo capture, e-signature, OTP confirmation, barcode scan | Onfleet POD, custom mobile SDK |
| Dispatch & Assignment | Auto-assign orders to nearest available driver, priority queuing | Circuit, Bringg dispatcher |
| Crowd-Sourced Delivery | On-demand gig driver marketplace, surge pricing, driver scoring | Lalamove API, DoorDash Drive API |
| Analytics & SLAs | On-time rate, failed delivery rate, cost-per-delivery dashboards | Tableau, custom BI, Bringg analytics |

## Architecture Patterns
```
[Order Management System]
      │ webhook: order_created
      ▼
[Delivery Management Platform]
      ├── Zone Assignment → nearest depot/hub
      ├── Route Optimizer (VRP) → batched stops/driver
      │       constraints: time windows, vehicle capacity
      └── Driver Assignment → push task to driver app
      │ WebSocket / MQTT
      ▼
[Driver Mobile App] (offline-first PWA or native)
      │ GPS telemetry every 5s
      ▼
[Tracking Service] → customer SMS/email ETA updates
      │ geofence: 500m from delivery → notify customer
      ▼
[POD Capture] → photo + GPS timestamp → S3
      │
      ▼
[OMS] — delivery confirmed, invoice triggered
```

```python
# Onfleet task creation
import onfleet

client = onfleet.Onfleet(api_key=ONFLEET_API_KEY)
task = client.tasks.create({
    "destination": {
        "address": {"unparsed": "123 Main St, Ho Chi Minh City, Vietnam"},
    },
    "recipients": [{"name": "Nguyen Van A", "phone": "+84901234567"}],
    "pickupTask": False,
    "notes": "Leave at door if absent",
    "completionRequirements": {
        "minimumAge": 0,
        "notes": False,
        "photo": True,
        "signature": False,
    },
})
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Onfleet | Full DMS: dispatch, tracking, POD, analytics | From $500/mo (tasks-based) |
| Bringg | Enterprise delivery orchestration, multi-carrier | Enterprise contract |
| Routific | Route optimization SaaS, time-window VRP | From $49/driver/mo |
| Circuit | SMB route planning and driver app | From $100/mo (5 drivers) |
| Lalamove | On-demand crowd-sourced delivery API (SEA/global) | Per-delivery commission |

## Related Skills
- `robotics-warehouse-automation` — Warehouse-to-van handoff integration
- `backend-development` — Real-time WebSocket tracking APIs and event streaming
- `databases` — Geospatial queries (PostGIS) for zone management and driver matching

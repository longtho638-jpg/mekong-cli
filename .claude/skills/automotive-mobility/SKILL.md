---
name: automotive-mobility
description: Connected vehicles, EV charging, fleet management, ADAS, telematics, dealer systems. Use for automotive tech, mobility platforms, EV infrastructure, vehicle diagnostics.
license: MIT
version: 1.0.0
---

# Automotive & Mobility Skill

Build connected vehicle platforms, EV charging infrastructure, fleet management, and automotive commerce with modern APIs and telematics.

## When to Use

- Connected vehicle data integration (telematics, OBD-II)
- EV charging network APIs and OCPP implementation
- Fleet management and dispatch optimization
- Automotive marketplace and vehicle valuation
- ADAS/autonomous driving platform integration
- Vehicle diagnostics and predictive maintenance
- Dealer management system (DMS) setup
- Auto insurance telematics (UBI)
- Parts procurement and aftermarket platforms
- Mobility-as-a-Service (MaaS) applications

## Tool Selection

| Need | Choose |
|------|--------|
| Vehicle data API | Smartcar (vendor-agnostic, OAuth), Geotab, Samsara |
| EV charging | ChargePoint (14K+ stations), OCPP 2.1 protocol |
| Fleet management | Samsara (#1 G2), RTA Fleet360, Verizon Connect |
| Vehicle valuation | KBB API, Edmunds (250+ data sources, 40M reports/mo) |
| ADAS platform | Mobileye EyeQ6H, Applied Intuition (simulation) |
| OBD diagnostics | OBDeleven (OEM-licensed), XTOOL D7 v2.0, OBDAI |
| DMS | CDK Global, Tekion (cloud-native), Dealertrack |
| Insurance telematics | Smartcar UBI API, Root Insurance, Metromile |
| Parts procurement | Partly (AI VIN→parts), PartsTrader (live quoting) |
| Route optimization | Google OR-Tools, HERE Routing API, Mapbox |

## Connected Vehicle Architecture

```
Vehicle ECU / OBD-II Port
    ↓ (CAN bus / CAN FD)
Telematics Control Unit (TCU)
    ↓ (Cellular 4G/5G)
Cloud Platform (Smartcar / Geotab)
    ↓ (REST API + OAuth 2.0)
┌─────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Fleet    │  │ Insurance│  │ Maint.   │  │
│  │ Tracking │  │ UBI      │  │ Predict  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ EV       │  │ Driver   │  │ Market   │  │
│  │ Charging │  │ Behavior │  │ place    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

## Smartcar Vehicle Data Integration

```python
import smartcar

# OAuth 2.0 flow for vehicle access
client = smartcar.AuthClient(
    client_id="CLIENT_ID",
    client_secret="CLIENT_SECRET",
    redirect_uri="https://app.example.com/callback"
)

# After user authorizes
access = client.exchange_code(auth_code)
vehicle_ids = smartcar.get_vehicles(access["access_token"])
vehicle = smartcar.Vehicle(vehicle_ids.vehicles[0], access["access_token"])

# Read vehicle data
location = vehicle.location()      # GPS coordinates
odometer = vehicle.odometer()      # Mileage
battery = vehicle.battery()        # EV battery level + range
fuel = vehicle.fuel()              # ICE fuel level
tire = vehicle.tire_pressure()     # All 4 tires
```

## OCPP 2.1 EV Charging Pattern

```
Charging Station (EVSE)
    ↓ OCPP 2.1 (WebSocket + JSON)
Central System (CSMS)
    ↓
┌─────────────────────────────────────────┐
│ Key OCPP 2.1 Messages:                  │
│ • BootNotification → station online     │
│ • Authorize → validate RFID/app user    │
│ • TransactionEvent → start/update/stop  │
│ • MeterValues → energy consumption      │
│ • SetChargingProfile → smart charging   │
│ • ReservationRequest → reserve connector│
│                                         │
│ NEW in 2.1 (Jan 2025, 137 countries):   │
│ • Vehicle-to-Grid (V2G) support         │
│ • ISO 15118 Plug & Charge               │
│ • Dynamic pricing profiles              │
└─────────────────────────────────────────┘
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Vehicle Uptime | Online time / Total time | > 98% |
| Fleet Fuel Efficiency | Miles / Gallon (fleet avg) | > 7.5 MPG |
| EV Charging Utilization | Active charging hrs / Available hrs | > 80% |
| Equipment Utilization | Production time / Available time | > 85% |
| Defect Rate | Defects per million (PPM) | < 500 PPM |
| ADAS Disengagement | Events per 1000 km | < 0.1 |
| UBI Savings | Avg discount vs standard policy | 30-35% |
| Parts Fill Rate | Orders filled / Total orders | > 95% |
| DMS Lead Conversion | Leads converted / Total leads | > 15% |
| Gross Margin | (Revenue - COGS) / Revenue | > 25% |

## Insurance Telematics (UBI) Model

```
Driver Behavior Data Collection:
  → Hard braking events (G-force threshold)
  → Rapid acceleration patterns
  → Cornering severity
  → Speed vs posted limit
  → Time-of-day driving patterns
  → Phone usage detection
  → Miles driven

Scoring: 0-100 (weighted composite)
  → < 50: High risk (+20% premium)
  → 50-70: Standard (base rate)
  → 70-85: Good (-15% discount)
  → 85+: Excellent (-35% discount)

21M+ US policyholders (2025), 82% consumer acceptance
```

## References

- Smartcar API: https://smartcar.com/docs
- OCPP Protocol: https://openchargealliance.org
- Geotab: https://docs.geotab.com
- Samsara: https://developers.samsara.com
- ChargePoint: https://developer.chargepoint.com
- KBB API: https://developer.kbb.com
- Tekion DMS: https://tekion.com

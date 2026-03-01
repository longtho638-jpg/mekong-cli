---
name: property-proptech
description: Property management, real estate listings, PropTech platforms, rental management, property valuation, smart buildings. Use for PropTech apps, real estate marketplaces, property management systems.
license: MIT
version: 1.0.0
---

# Property & PropTech Skill

Build property management platforms, real estate marketplaces, smart building systems, and PropTech applications with modern real estate APIs.

## When to Use

- Property listing and marketplace development
- Rental and lease management platforms
- Property valuation and AVM (Automated Valuation Models)
- Smart building and access control systems
- Tenant screening and background checks
- Real estate CRM and transaction management
- Mortgage and lending technology
- Property inspection and maintenance management
- Real estate investment and crowdfunding platforms
- Construction project management

## Tool Selection

| Need | Choose |
|------|--------|
| Property listings data | Zillow API (Bridge), Realtor.com API, RETS/RESO |
| Property management | Buildium, AppFolio, Yardi Voyager |
| Tenant screening | TransUnion SmartMove, Certn, RentPrep |
| Smart access control | Latch, ButterflyMX, Brivo (cloud-based) |
| Property valuation | HouseCanary API, ATTOM Data, CoreLogic |
| CRM for real estate | Follow Up Boss, kvCORE, Chime |
| Virtual tours | Matterport SDK, Zillow 3D Home |
| Mortgage tech | Blend, Encompass (ICE), Better.com API |
| Maintenance management | Propertyware, Maintenance IQ, UpKeep |
| Investment platform | Fundrise API, CrowdStreet |

## PropTech Architecture

```
Tenants / Buyers / Agents
    ↓ (Web / Mobile / IoT)
┌────────────────────────────────────────────┐
│  Application Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Listing  │  │ Tenant   │  │ Payment  │ │
│  │ Search   │  │ Portal   │  │ Gateway  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Property Management Core                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Lease    │  │ Maint.   │  │ Screening│ │
│  │ Mgmt     │  │ Requests │  │ & Verify │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Smart    │  │ Valuation│  │ Analytics│
│ Building │  │ AVM API  │  │ Dashboard│
│ IoT      │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘
```

## Property Data API Integration

```python
import requests

# ATTOM Property Data API
ATTOM_KEY = "your_api_key"

# Get property details by address
response = requests.get(
    "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail",
    headers={"apikey": ATTOM_KEY, "Accept": "application/json"},
    params={
        "address1": "123 Main St",
        "address2": "San Francisco, CA 94105"
    }
)
property_data = response.json()
# property_data → lot size, bedrooms, bathrooms, year built, AVM value

# Get comparable sales
comps = requests.get(
    "https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/comparable",
    headers={"apikey": ATTOM_KEY, "Accept": "application/json"},
    params={"attomId": property_data["property"][0]["identifier"]["attomId"]}
)
```

## Data Standards

| Standard | Purpose | Status |
|----------|---------|--------|
| RESO (Real Estate Standards) | Property data exchange | Production (v2.0) |
| RETS | Legacy listing feeds | Being replaced by RESO Web API |
| IDX | Internet Data Exchange | Broker-to-broker listing sharing |
| MISMO | Mortgage data standards | Production (v3.x) |
| IFC (BIM) | Building Information Model | ISO 16739 |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Occupancy Rate | Occupied units / Total units | > 95% |
| Rent Collection Rate | Collected / Billed rent | > 98% |
| Time-to-Lease | Vacancy → Signed lease avg | < 30 days |
| Maintenance Response | Request → Resolution avg | < 48 hours |
| Tenant Retention | Renewals / Expiring leases | > 60% |
| Cap Rate | NOI / Property Value | Market-dependent |
| AVM Accuracy | Predicted vs Sold price deviation | < 5% |
| Listing-to-Close | Listed → Sold avg days | Market-dependent |

## References

- ATTOM Data: https://api.developer.attomdata.com
- HouseCanary: https://www.housecanary.com/api
- RESO Standards: https://www.reso.org
- Buildium: https://developer.buildium.com
- Matterport SDK: https://matterport.github.io/showcase-sdk
- Latch: https://www.latch.com
- Brivo: https://www.brivo.com/api
- AppFolio: https://www.appfolio.com

---
name: energy-esg
description: Energy management, carbon accounting, ESG reporting, smart grid, EV charging, renewable energy. Use for sustainability platforms, emissions tracking, green tech compliance.
license: MIT
version: 1.0.0
---

# Energy, Utilities & ESG Skill

Build energy management platforms, carbon accounting systems, ESG compliance tools, and smart grid integrations.

## When to Use

- Carbon accounting and emissions tracking (Scope 1/2/3)
- ESG reporting and regulatory compliance (CSRD, SEC)
- Energy management and building optimization
- Smart grid integration and demand response
- EV fleet charging management
- Renewable energy project management
- Carbon offset marketplace integration
- Utility data aggregation and analytics
- Sustainability reporting automation
- Climate risk assessment and decarbonization planning

## Tool Selection

| Need | Choose |
|------|--------|
| Utility data aggregation | Arcadia (10K+ utilities), EnergyCAP |
| Carbon accounting (enterprise) | Persefoni (CSRD/ISSB), Watershed (holistic) |
| Carbon accounting (SMB) | Greenly (AI-powered), Coolset (supply chain) |
| Carbon API | Climatiq (REST API + SDK, emission factors DB) |
| Smart grid protocol | OpenADR 3.0 (Rust, REST+JSON), OpenLEADR |
| Building optimization | GridPoint (HVAC automation), Verdigris (AI analytics) |
| EV fleet charging | Samsara (#1 fleet), ev.energy SDK, Ampcontrol |
| ESG data API | MSCI ESG API (4K+ datapoints), Sustainalytics |
| Renewable project mgmt | Sitetracker (construction), Radian Digital (early-stage) |
| ESG reporting | Normative (CSRD), Persefoni (ISSB) |

## Emissions Architecture

```
Data Sources (meters, invoices, IoT sensors)
    ↓
┌────────────────────────────────────────────┐
│  Data Ingestion Layer                       │
│  Arcadia API │ Climatiq API │ Manual Upload │
└─────────────────────┬──────────────────────┘
                      ↓
┌────────────────────────────────────────────┐
│  Carbon Engine                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Scope 1  │  │ Scope 2  │  │ Scope 3  │ │
│  │ Direct   │  │ Electric │  │ Supply   │ │
│  │ (fuel)   │  │ (grid)   │  │ Chain    │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ CSRD/SEC │  │ Decarb   │  │ ESG      │
│ Reports  │  │ Roadmap  │  │ Ratings  │
└──────────┘  └──────────┘  └──────────┘
```

## Climatiq API Integration

```python
import requests

CLIMATIQ_API_KEY = "your_api_key"

# Estimate emissions from electricity consumption
response = requests.post(
    "https://api.climatiq.io/estimate",
    headers={"Authorization": f"Bearer {CLIMATIQ_API_KEY}"},
    json={
        "emission_factor": {
            "activity_id": "electricity-supply_grid-source_residual_mix",
            "source": "EPA",
            "region": "US",
        },
        "parameters": {
            "energy": 1000,
            "energy_unit": "kWh"
        }
    }
)
result = response.json()
# result["co2e"] → kg CO2 equivalent
# result["co2e_unit"] → "kg"
```

## ESG Reporting Scopes

| Scope | Definition | Examples |
|-------|-----------|----------|
| Scope 1 | Direct emissions from operations | Gas boilers, fleet vehicles, on-site generation |
| Scope 2 | Indirect from purchased electricity | Grid power, district heating |
| Scope 3 | All other indirect emissions | Supply chain, business travel, waste, downstream use |

## Regulatory Landscape (2026)

| Framework | Status | Requirement |
|-----------|--------|-------------|
| EU CSRD | Active (simplified) | ~430 mandatory datapoints, >1000 employees + €450M turnover |
| US SEC Climate | Indefinite hold | State-level (CA begins 2026 reporting) |
| ISSB/IFRS S1-S2 | Active | Global sustainability standards |
| GRI Standards | Voluntary | Impact-focused reporting |

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Carbon Intensity | kg CO2e / revenue unit | Year-over-year reduction |
| Energy Efficiency | Output / Input energy | Continuous improvement |
| Renewable % | Renewable / Total energy | > 50% by 2030 |
| Scope 3 Coverage | Tracked categories / 15 total | > 80% |
| Data Accuracy | Verified / Total data points | > 95% |
| Reporting Compliance | Met deadlines / Required | 100% |
| Reduction Rate | (Y1 - Y2) / Y1 emissions | > 4.2% annual (SBTi) |
| EV Fleet % | EV vehicles / Total fleet | Growing quarterly |

## Protocol Comparison

| Protocol | Use Case | Status |
|----------|----------|--------|
| OpenADR 3.0 | Smart grid demand response | Pre-standardization 2026 |
| OCPP 2.0.1 | EV charger communication | Production |
| IEEE 2030.5 | Smart energy profile | Production |
| Modbus/TCP | Building automation | Legacy but widespread |
| BACnet | HVAC systems | Industry standard |

## References

- Arcadia: https://www.arcadia.com
- Climatiq API: https://www.climatiq.io
- Persefoni: https://persefoni.com
- Watershed: https://www.watershed.com
- Greenly: https://greenly.earth
- OpenADR Alliance: https://www.openadr.org
- MSCI ESG API: https://developer.msci.com
- GridPoint: https://www.gridpoint.com
- ev.energy: https://www.ev.energy
- Samsara: https://www.samsara.com

---
name: carbon-accounting-api
description: "Expert in Carbon Accounting API integration and CSRD/ESRS compliance automation. Covers Climatiq REST API (ISO 14067 certified), GHG Protocol Scope 1/2/3 calculations, EU CSRD double materiality, ESRS reporting standards, XBRL tagging, carbon offset verification (Verra, Gold Standard), Scope 3 supply chain collaboration, and audit-ready emissions trails. 2026: EU CSRD mandatory for 50,000+ companies; Climatiq covers 50,000+ emission factors. Use when: carbon accounting, GHG emissions, Scope 1 2 3, CSRD, ESRS, Climatiq, emission factors, carbon credits, ESG reporting, net zero, decarbonization, carbon footprint API."
source: research-driven-2026
---

# Carbon Accounting API & CSRD Compliance — Skill

> EU CSRD is mandatory for FY2025 reporting (50,000+ companies). Climatiq API provides ISO 14067-certified emission factors across 50,000+ activities. Double materiality assessment is the critical differentiator from TCFD.

## When to Activate

- User needs GHG emissions calculation via API (Scope 1, 2, or 3)
- EU CSRD / ESRS compliance reporting automation
- Carbon footprint widget or dashboard for SaaS product
- Supply chain (Scope 3 Category 1-15) emissions collection
- Carbon credit purchase, retirement, or verification workflow
- Net-zero pathway modeling or SBTi target setting

## Core Capabilities

| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Scope 1 Emissions | Direct combustion, refrigerants, fugitive | Climatiq `/estimate` endpoint |
| Scope 2 Emissions | Electricity: market-based + location-based | Climatiq electricity factors |
| Scope 3 Emissions | 15 categories: supply chain, travel, waste | Climatiq + supplier data |
| CSRD Reporting | Double materiality, ESRS E1-E5 disclosures | XBRL generator, Greenly, Normative |
| Carbon Credits | VCS/Gold Standard credit verification, retirement | Verra API, Gold Standard API |
| Utility Bill OCR | Extract kWh/therms from PDF bills automatically | Google Document AI, Textract |
| Audit Trail | Immutable log of every calculation with factors used | PostgreSQL + append-only log |
| SBTi Modeling | Science-based target pathway calculation | Python + SBTI official tool |

## Architecture Patterns

### Climatiq API — Scope 1 Direct Emissions

```python
import httpx
import os
from pydantic import BaseModel
from typing import Literal

CLIMATIQ_BASE = "https://api.climatiq.io"

class EmissionResult(BaseModel):
    co2e: float          # kg CO2 equivalent
    co2e_unit: str       # always "kg"
    co2e_calculation_method: str
    emission_factor: dict
    constituent_gases: dict  # CO2, CH4, N2O breakdown

async def calculate_scope1_combustion(
    fuel_type: Literal["natural_gas", "diesel", "petrol", "lpg"],
    quantity: float,
    unit: Literal["litre", "cubic_metre", "kg", "MWh"],
) -> EmissionResult:
    """Calculate Scope 1 emissions from stationary combustion."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{CLIMATIQ_BASE}/data/v1/estimate",
            headers={
                "Authorization": f"Bearer {os.environ['CLIMATIQ_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={
                "emission_factor": {
                    "activity_id": f"fuel_type_{fuel_type}-fuel_use",
                    "data_version": "^22",  # latest stable version
                    "region": "GLOBAL",     # or "GB", "DE", "US", etc.
                    "year": 2024,
                },
                "parameters": {
                    "energy": quantity,
                    "energy_unit": unit,
                }
            }
        )
        resp.raise_for_status()
        return EmissionResult(**resp.json())

async def calculate_scope2_electricity(
    kwh: float,
    region: str,  # e.g., "DE", "US-CA", "GB"
    method: Literal["market_based", "location_based"] = "location_based",
) -> EmissionResult:
    """Calculate Scope 2 electricity emissions."""
    activity_id = (
        "electricity-energy_source_grid_mix"
        if method == "location_based"
        else "electricity-supply_grid-source_residual_mix"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{CLIMATIQ_BASE}/data/v1/estimate",
            headers={"Authorization": f"Bearer {os.environ['CLIMATIQ_API_KEY']}"},
            json={
                "emission_factor": {
                    "activity_id": activity_id,
                    "region": region,
                    "year": 2024,
                    "data_version": "^22",
                },
                "parameters": {"energy": kwh, "energy_unit": "kWh"}
            }
        )
        resp.raise_for_status()
        return EmissionResult(**resp.json())
```

### Scope 3 — Batch Calculation (15 Categories)

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class Scope3Activity:
    category: int      # 1-15 per GHG Protocol
    description: str
    activity_id: str   # Climatiq activity ID
    parameters: dict[str, Any]

async def calculate_scope3_batch(activities: list[Scope3Activity]) -> list[dict]:
    """
    Batch calculate Scope 3 emissions across all 15 categories.
    Uses Climatiq /batch endpoint (max 100 items per request).
    """
    batch_items = [
        {
            "emission_factor": {
                "activity_id": a.activity_id,
                "data_version": "^22",
                "region": "GLOBAL",
            },
            "parameters": a.parameters,
        }
        for a in activities
    ]

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{CLIMATIQ_BASE}/data/v1/estimate/batch",
            headers={"Authorization": f"Bearer {os.environ['CLIMATIQ_API_KEY']}"},
            json={"requests": batch_items}
        )
        results = resp.json()["results"]

    return [
        {
            "category": activities[i].category,
            "description": activities[i].description,
            "co2e_kg": results[i]["co2e"],
            "emission_factor_name": results[i]["emission_factor"]["name"],
            "source": results[i]["emission_factor"]["source"],
        }
        for i in range(len(activities))
    ]

# Example Scope 3 activities:
EXAMPLE_SCOPE3 = [
    Scope3Activity(1, "Purchased goods - steel", "material_use-type_steel", {"mass": 1000, "mass_unit": "kg"}),
    Scope3Activity(6, "Business travel - flights", "passenger_transport-type_plane-distance_long_haul_gt_3700km-class_economy", {"passengers": 1, "distance": 5000, "distance_unit": "km"}),
    Scope3Activity(11, "Product use - electricity", "electricity-energy_source_grid_mix", {"energy": 500, "energy_unit": "kWh"}),
]
```

### CSRD Double Materiality Assessment

```python
from enum import Enum
from pydantic import BaseModel

class MaterialityType(str, Enum):
    IMPACT = "impact"          # Company's impact on environment/society
    FINANCIAL = "financial"    # Environment/society's impact on company

class ESRSTopic(str, Enum):
    # ESRS E1-E5: Environmental
    E1_CLIMATE = "E1-Climate change"
    E2_POLLUTION = "E2-Pollution"
    E3_WATER = "E3-Water and marine"
    E4_BIODIVERSITY = "E4-Biodiversity"
    E5_CIRCULAR = "E5-Resource use and circular economy"
    # ESRS S1-S4: Social
    S1_OWN_WORKFORCE = "S1-Own workforce"
    # ESRS G1: Governance
    G1_CONDUCT = "G1-Business conduct"

class MaterialityAssessment(BaseModel):
    topic: ESRSTopic
    materiality_type: MaterialityType
    impact_score: float   # 0-10: severity × likelihood × scale
    financial_score: float  # 0-10: magnitude × likelihood × time_horizon
    is_material: bool
    disclosure_requirements: list[str]  # ESRS data point IDs
    data_sources: list[str]

def assess_double_materiality(
    topic: ESRSTopic,
    impact_severity: float,    # 1-10
    impact_likelihood: float,  # 0-1
    impact_scope: float,       # 1-10 (number affected)
    financial_magnitude: float, # 1-10 (€ impact)
    financial_likelihood: float, # 0-1
) -> MaterialityAssessment:
    """
    ESRS 1 para. 46: Topic is material if impact OR financial score >= threshold.
    EFRAG threshold: 4.0/10 for large companies.
    """
    MATERIALITY_THRESHOLD = 4.0

    impact_score = (impact_severity * impact_likelihood * impact_scope) / 10
    financial_score = financial_magnitude * financial_likelihood

    is_material = impact_score >= MATERIALITY_THRESHOLD or financial_score >= MATERIALITY_THRESHOLD

    # Map to required ESRS disclosures
    disclosure_map = {
        ESRSTopic.E1_CLIMATE: [
            "E1-1 Transition plan", "E1-4 GHG reduction targets",
            "E1-6 Gross Scope 1/2/3 GHG emissions", "E1-7 GHG removals"
        ],
    }

    return MaterialityAssessment(
        topic=topic,
        materiality_type=MaterialityType.IMPACT if impact_score > financial_score else MaterialityType.FINANCIAL,
        impact_score=round(impact_score, 2),
        financial_score=round(financial_score, 2),
        is_material=is_material,
        disclosure_requirements=disclosure_map.get(topic, []),
        data_sources=["Internal energy meters", "Climatiq API", "Supplier questionnaires"],
    )
```

### Utility Bill OCR → Emissions (Scope 2 automation)

```python
import boto3  # or google.cloud.documentai

def extract_kwh_from_utility_bill(pdf_bytes: bytes, region: str = "GB") -> dict:
    """
    Extract electricity consumption from PDF utility bill using AWS Textract,
    then calculate Scope 2 emissions via Climatiq.
    """
    textract = boto3.client("textract", region_name="eu-west-1")

    response = textract.analyze_document(
        Document={"Bytes": pdf_bytes},
        FeatureTypes=["FORMS", "TABLES"]
    )

    # Extract key-value pairs from bill
    kvp = {}
    for block in response["Blocks"]:
        if block["BlockType"] == "KEY_VALUE_SET" and "KEY" in block.get("EntityTypes", []):
            key_text = block.get("Text", "")
            # Find corresponding value block
            for rel in block.get("Relationships", []):
                if rel["Type"] == "VALUE":
                    for val_id in rel["Ids"]:
                        # Lookup value block text
                        kvp[key_text.lower()] = val_id

    # Parse kWh from common field names
    kwh_fields = ["total units", "energy consumed", "units used", "kwh", "electricity used"]
    kwh = None
    for field in kwh_fields:
        if field in kvp:
            kwh = float(kvp[field].replace(",", ""))
            break

    return {"kwh": kwh, "region": region, "source": "utility_bill_ocr"}
```

### Carbon Credit Verification (Verra VCS Registry)

```python
import httpx

VERRA_API = "https://registry.verra.org/uiapi"

async def verify_carbon_credit(
    project_id: str,
    vintage_year: int,
    quantity_tonnes: float,
) -> dict:
    """
    Verify VCS carbon credits via Verra Registry API.
    Check project status, methodology, and retirement record.
    """
    async with httpx.AsyncClient() as client:
        # Get project details
        proj = await client.get(
            f"{VERRA_API}/resource/projects",
            params={"resourceIds": project_id}
        )
        proj_data = proj.json()

        # Check issuances for vintage year
        issuances = await client.get(
            f"{VERRA_API}/resource/issuances",
            params={
                "resourceIdentifier": project_id,
                "vintageStartYear": vintage_year,
                "vintageEndYear": vintage_year,
            }
        )

        return {
            "project_id": project_id,
            "project_name": proj_data[0].get("resourceName") if proj_data else None,
            "methodology": proj_data[0].get("methodology") if proj_data else None,
            "status": proj_data[0].get("resourceStatus") if proj_data else "UNKNOWN",
            "vintage_year": vintage_year,
            "available_tonnes": issuances.json()[0].get("totalVCUs", 0) if issuances.json() else 0,
            "registry_url": f"https://registry.verra.org/app/projectDetail/VCS/{project_id}",
        }
```

## Key Technologies & APIs

- **Climatiq API v1**: `https://api.climatiq.io/data/v1/estimate` — 50,000+ emission factors, ISO 14067 certified. Pricing: free tier 100 calls/month; paid from $99/month
- **Climatiq Activity Search**: `GET /data/v1/search?query=electricity&region=DE` — discover correct `activity_id`
- **Verra Registry API**: `https://registry.verra.org/uiapi` — VCS carbon credit verification
- **Gold Standard Impact Registry**: `https://registry.goldstandard.org/projects` — certified credit verification
- **EFRAG ESRS XBRL Taxonomy**: `https://www.efrag.org/taxonomy` — official XBRL tags for CSRD reporting
- **GHG Protocol Tool**: `https://ghgprotocol.org/calculation-tools` — Excel-based; Climatiq automates these calculations
- **SBTi Corporate Tool**: `https://sciencebasedtargets.org/resources/files/SBTi-Corporate-Manual.pdf`
- **Cloud Carbon Footprint**: `https://www.cloudcarbonfootprint.org` — open-source AWS/GCP/Azure emissions
- **iLEAP (Open Footprint)**: `https://ileap-foundation.github.io/ileap-openapi/` — Scope 3 data exchange API between companies

## Implementation Checklist

- [ ] Register at `climatiq.io` — get API key, verify rate limits (100/month free, 10,000+/month paid)
- [ ] Map all emission sources to Climatiq `activity_id` using search endpoint
- [ ] Implement Scope 1: stationary combustion + mobile combustion + refrigerants separately
- [ ] Implement Scope 2: both location-based AND market-based (CSRD requires both)
- [ ] Identify Scope 3 categories applicable to business (Category 1+11 = typical >70% of footprint)
- [ ] Set up utility bill OCR pipeline (AWS Textract or Google Document AI)
- [ ] Build double materiality assessment matrix for ESRS E1 at minimum
- [ ] Generate XBRL-tagged report using EFRAG taxonomy for CSRD submission
- [ ] Implement audit log: store `activity_id` + `emission_factor.id` + `calculation_date` per record
- [ ] Configure annual recalculation on Climatiq factor updates (factors update ~quarterly)

## Best Practices

- **Store emission factor IDs, not just values** — Climatiq factors update; storing `emission_factor.id` allows recalculation with latest values for prior years
- **Market-based vs location-based Scope 2** — always calculate both; CSRD ESRS E1-6 requires both disclosed; market-based reflects renewable energy purchases (RECs/GOs)
- **Scope 3 materiality threshold** — GHG Protocol: include categories representing >1% of total; in practice, Category 1 (purchased goods) + Category 11 (product use) = 70–90% for manufacturers
- **CSRD timing** — large EU companies (>500 employees): FY2024 report due 2025; large non-EU companies with EU revenue >€150M: FY2028. Plan integration timeline accordingly
- **iLEAP for Scope 3 Cat 1** — use iLEAP open API standard for requesting primary emission data from suppliers; avoid spend-based estimates when primary data available

## Anti-Patterns

- **Spend-based Scope 3 only** — spend-based estimates have ±300% error margin; use physical activity data (kg, kWh, km) whenever possible for Categories 1, 3, 4
- **Single global emission factor for electricity** — electricity grid intensity varies 100x between regions (FR nuclear = 58 gCO2/kWh vs PL coal = 760 gCO2/kWh); always use region-specific factors
- **Ignoring Scope 3 Category 15** — investments/financed emissions are now mandatory for financial sector under ESRS; often the largest category for banks
- **CSRD = TCFD** — CSRD includes TCFD-like disclosures but adds double materiality and 1,000+ ESRS data points TCFD doesn't require; they are not interchangeable

## References

- Climatiq API Reference: `https://docs.climatiq.io`
- Climatiq Activity Search: `https://www.climatiq.io/explorer`
- EFRAG ESRS Standards: `https://www.efrag.org/esrs`
- GHG Protocol Corporate Standard: `https://ghgprotocol.org/corporate-standard`
- Verra VCS Registry API: `https://registry.verra.org/uiapi/swagger-ui/index.html`
- iLEAP OpenAPI (Scope 3): `https://ileap-foundation.github.io/ileap-openapi/`
- Cloud Carbon Footprint (OSS): `https://www.cloudcarbonfootprint.org/docs`
- CSRD Text (EUR-Lex): `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464`

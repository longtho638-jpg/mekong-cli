---
name: construction-tech
description: "Expert in Construction Technology & BIM integration. Covers Procore REST API v2, Autodesk Construction Cloud (ACC) API, BIM 360, IFC/openBIM standards, agentic AI for construction (Datagrid acquisition Jan 2026), permit/RFI/submittal automation, safety compliance workflows, cost estimation APIs, and field productivity tools. Use when: Procore, BIM, construction management, ACC, IFC, permit workflow, RFI automation, submittal, cost estimation, field productivity, construction AI, ConTech."
source: research-driven-2026
---

# Construction Technology & BIM — Skill

> Construction AI accelerated in Jan 2026 when Procore acquired Datagrid for agentic AI in construction workflows. BIM adoption is now mandatory on EU public projects >1M EUR.

## When to Activate

- User mentions Procore, Autodesk ACC, BIM 360, Revit API, or IFC
- Building permit workflow automation, RFI/submittal processing
- Construction cost estimation API integration
- BIM model data extraction, clash detection pipelines
- Field inspection reporting, safety compliance tracking
- ConTech SaaS products targeting GCs, subs, or owners

## Core Capabilities

| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Project Management | Budgets, schedules, change orders, cost codes | Procore REST API v2 |
| BIM Data | Model files, clash detection, quantity takeoff | Autodesk ACC API, BIM 360 |
| Document Control | RFIs, submittals, drawings, specs, O&M manuals | Procore Documents API |
| Field Operations | Observations, punchlist, daily logs, photos | Procore Field Productivity API |
| Safety | Incident reports, inspections, OSHA logs, training records | Procore Safety API |
| Estimating | Cost codes, budgets, contracts, purchase orders | Procore ERP Integrations |
| Agentic AI | Auto-triage RFIs, draft responses, identify risk clauses | Datagrid (Procore), OpenAI function calling |

## Architecture Patterns

### Procore REST API v2 — OAuth 2.0 Flow

```python
import httpx

PROCORE_BASE = "https://api.procore.com"

async def get_procore_token(client_id: str, client_secret: str) -> str:
    """OAuth 2.0 client credentials for service accounts."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PROCORE_BASE}/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            }
        )
        return resp.json()["access_token"]

async def list_projects(token: str, company_id: int) -> list[dict]:
    """Fetch all active projects for a company."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PROCORE_BASE}/rest/v1.0/projects",
            headers={"Authorization": f"Bearer {token}"},
            params={"company_id": company_id, "filters[status]": "Active"}
        )
        return resp.json()

async def list_rfis(token: str, project_id: int) -> list[dict]:
    """Fetch all open RFIs for a project."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PROCORE_BASE}/rest/v1.0/projects/{project_id}/rfis",
            headers={"Authorization": f"Bearer {token}"},
            params={"filters[status]": "open"}
        )
        return resp.json()
```

### Autodesk ACC / BIM 360 — APS (Forge) SDK

```python
from autodesk_forge_sdk import AuthClient, ModelDerivativeClient
import os

# APS (formerly Forge) OAuth 2.0 two-legged
auth = AuthClient(
    client_id=os.environ["APS_CLIENT_ID"],
    client_secret=os.environ["APS_CLIENT_SECRET"]
)
token = auth.authenticate(["data:read", "data:write"])

# Translate IFC/RVT to SVF2 for viewer
md = ModelDerivativeClient(token.access_token)
job = md.translate(
    urn="base64_encoded_urn",
    output_formats=[{"type": "svf2", "views": ["2d", "3d"]}]
)
```

### Agentic RFI Triage (Datagrid-style pattern)

```python
from openai import AsyncOpenAI
import json

client = AsyncOpenAI()

RFI_TRIAGE_PROMPT = """
You are a construction superintendent AI. Given an RFI from the field:
1. Classify urgency: CRITICAL / HIGH / MEDIUM / LOW
2. Route to: Architect / Structural Engineer / MEP / Owner / GC
3. Draft a preliminary response if answerable from plans
4. Flag if RFI creates a potential change order

RFI: {rfi_text}
Drawing references: {drawing_refs}
"""

async def triage_rfi(rfi_text: str, drawing_refs: list[str]) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": RFI_TRIAGE_PROMPT.format(
                rfi_text=rfi_text,
                drawing_refs=", ".join(drawing_refs)
            )
        }]
    )
    return json.loads(response.choices[0].message.content)
```

### IFC File Parsing (openBIM)

```python
import ifcopenshell
import ifcopenshell.util.element as Element

def extract_quantities(ifc_path: str) -> list[dict]:
    """Extract all quantities from IFC model for cost estimation."""
    model = ifcopenshell.open(ifc_path)
    walls = model.by_type("IfcWall")
    results = []
    for wall in walls:
        props = Element.get_psets(wall, psets_only=True)
        qsets = Element.get_psets(wall, qtos_only=True)
        results.append({
            "id": wall.GlobalId,
            "name": wall.Name,
            "type": wall.is_a(),
            "properties": props,
            "quantities": qsets,
        })
    return results
```

## Key Technologies & APIs

- **Procore API v2**: `https://developers.procore.com/reference/rest/v1` — REST, OAuth 2.0, webhooks via `developers.procore.com/webhooks`
- **Autodesk Platform Services (APS)**: `https://aps.autodesk.com` — replaces Forge API, supports ACC + BIM 360
- **APS Model Derivative API**: Translate RVT/IFC → SVF2/OBJ/glTF for web viewer
- **ifcopenshell**: `pip install ifcopenshell` — open-source IFC parsing library
- **BIMLauncher**: Cross-platform BIM workflow automation (connects Revit, Navisworks, Solibri)
- **IFC 4.3**: Latest openBIM standard, ISO 16739-1:2024
- **BCF (BIM Collaboration Format)**: Issue tracking across BIM tools, ISO 21597

## Implementation Checklist

- [ ] Register app at `developers.procore.com` — get `client_id` + `client_secret`
- [ ] Configure OAuth 2.0 scopes: `data:read`, `data:write` for ACC projects
- [ ] Set up Procore webhooks: `POST /rest/v1.0/webhooks` for real-time triggers
- [ ] Map Procore cost codes to internal ERP cost centers
- [ ] Implement IFC parser for quantity takeoff automation
- [ ] Set up BCF-server for cross-platform issue tracking
- [ ] Configure Procore budget module: cost codes → budget items → change orders
- [ ] Add OSHA 300 log integration via Procore Safety API
- [ ] Validate IFC geometry with BIMvision or xBIM Toolkit before import

## Best Practices

- **Pagination**: Procore API returns max 100 items per page — always implement cursor pagination with `page` + `per_page` params
- **Webhooks over polling**: Use Procore webhooks (`/rest/v1.0/webhooks`) for RFI/submittal events — polling at scale is rate-limited
- **IFC GlobalId**: Always use `IfcGloballyUniqueId` (GUID) as primary key for element tracking across BIM model versions
- **Scope 3 cost tracking**: Map IFC IfcCostItem → Procore budget items for integrated cost control
- **Rate limits**: Procore API = 3,600 requests/hour per token — cache project lists and company data aggressively

## Anti-Patterns

- **Polling Procore for RFI updates** — use webhooks; polling exceeds rate limits on large projects with 5,000+ RFIs
- **Storing IFC files in Postgres BLOBs** — use object storage (S3/R2) + APS for versioned BIM model storage
- **Hardcoding cost code IDs** — cost codes vary per company/project; always fetch via `/rest/v1.0/cost_codes` endpoint
- **Ignoring BCF threading** — BCF issues have `topic_guid` + `comment_guid` hierarchy; flattening loses traceability

## References

- Procore API Docs: `https://developers.procore.com/reference/rest/v1`
- APS (Autodesk Platform Services): `https://aps.autodesk.com/en/docs/data/v2/reference/http/`
- ifcopenshell: `https://ifcopenshell.org/docs`
- IFC 4.3 Standard: `https://ifc43-docs.buildingsmart.org`
- BIM 360 / ACC Migration Guide: `https://aps.autodesk.com/en/docs/acc/v1/overview/`
- Procore Webhooks: `https://developers.procore.com/documentation/webhooks`
- BCF OpenAPI: `https://github.com/buildingSMART/BCF-API`

---
name: carbon-credit-trading
description: "Carbon credit marketplace — carbon offset verification, MRV (measurement, reporting, verification), registry integration, voluntary carbon markets. Activate when building carbon accounting platforms, offset marketplaces, or ESG compliance tools."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Carbon Credit Trading — Skill

> Voluntary carbon market projected to reach $50B by 2030; Article 6 of Paris Agreement operationalized in 2025 created standardized international carbon trading rules.

## When to Activate
- Building carbon offset purchase or retirement workflows
- Integrating with carbon registries (Verra, Gold Standard, ACR)
- Implementing MRV (Measurement, Reporting, Verification) data pipelines
- Designing carbon portfolio management or trading dashboards
- Adding Scope 1/2/3 emissions tracking with offset reconciliation
- Creating tokenized carbon credit issuance on blockchain
- Building corporate carbon neutrality certification workflows

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Offset Procurement | Credit search, price discovery, purchase, retirement | Patch API, Cloverly, Xpansiv CBL |
| Registry Integration | Serial number verification, retirement certificate fetch | Verra VCS, Gold Standard, ACR |
| MRV Pipeline | Satellite-based emissions monitoring, third-party audit ingestion | Pachama, SilviaTerra, Sylvera |
| Credit Quality Scoring | Additionality, permanence, co-benefit ratings | Sylvera, BeZero Carbon, Calyx Global |
| Tokenization | On-chain carbon credit wrapping, fractionalization | Toucan Protocol, KlimaDAO, Moss.Earth |
| Emissions Accounting | GHG Protocol Scope 1/2/3 calculation + offset netting | Persefoni, Watershed, Greenly |

## Architecture Patterns
```typescript
// Carbon offset retirement workflow
async function retireOffsetsForEmissions(
  orgId: string,
  emissionsKgCO2e: number,
  vintage: number
): Promise<RetirementCertificate> {
  const tonnes = emissionsKgCO2e / 1000;

  // Find best-fit credits by quality score + price
  const credits = await patch.listProjects({
    type: "forestry",
    vintage_year: vintage,
    min_sylvera_rating: "A",
    available_volume_gte: tonnes,
  });
  const best = credits[0]; // sorted by quality/price ratio

  // Purchase and retire in one atomic call
  const order = await patch.createOrder({
    project_id: best.id,
    mass_g: emissionsKgCO2e * 1000, // Patch uses grams
    metadata: { org_id: orgId, purpose: "scope3_offset" },
  });

  // Fetch Verra registry retirement certificate
  const cert = await verra.getRetirementCertificate(order.registry_serial);
  await carbonLedger.record(orgId, { order, certificate: cert });
  return cert;
}
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Patch API | Carbon offset marketplace API, procurement + retirement | Per-tonne fee |
| Cloverly | Embed carbon offsetting in checkout flows | Per-transaction |
| Sylvera | Carbon credit quality ratings, portfolio analytics | Subscription |
| Verra | VCS registry, retirement record verification | Free registry access |
| Gold Standard | Premium carbon standard registry | Free registry access |
| Toucan Protocol | Tokenized carbon credits (BCT, NCT) on Polygon | Gas + bridge fee |

## Related Skills
- `circular-economy-waste-tech` — Waste diversion carbon credits, landfill avoidance offsets
- `agri-tech-precision-farming` — Soil carbon sequestration MRV, regenerative ag credits
- `regtech` — Article 6 compliance, double-counting prevention, beneficial ownership

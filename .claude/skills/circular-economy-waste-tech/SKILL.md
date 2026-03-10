---
name: circular-economy-waste-tech
description: "Circular economy platforms — waste management, recycling optimization, EPR compliance, material passports, reverse logistics. Activate when building waste tracking, sustainability reporting, or circular product lifecycle systems."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Circular Economy & Waste Tech — Skill

> Global circular economy market hits $4.5T by 2030; EU EPR regulations and ESG mandates are forcing brands to build material traceability systems in 2025-2026.

## When to Activate
- Building material passport or product lifecycle tracking systems
- Implementing EPR (Extended Producer Responsibility) compliance reporting
- Designing recycling stream optimization or contamination detection
- Integrating with waste collection route management platforms
- Creating reverse logistics flows for product take-back programs
- Building ESG / circularity metrics dashboards
- Implementing deposit-return scheme (DRS) management systems

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Material Passport | Digital product identity, component traceability, end-of-life data | Circulor, Madaster, GS1 Digital Link |
| Waste Stream AI | Computer vision sorting classification, contamination detection | AMP Robotics, Greyparrot, ZenRobotics |
| Collection Routing | Smart bin fill-level sensors, dynamic route optimization | Rubicon, Sensoneo, Bigbelly |
| EPR Compliance | Producer obligation calculation, registry reporting, fee management | Comply Direct, Greyparrot Analytics |
| Reverse Logistics | Take-back portal, return shipping label generation, refurb tracking | Loop Industries, Optoro |
| Carbon Accounting | Waste-to-energy offsets, Scope 3 emissions from waste | Persefoni, Watershed |

## Architecture Patterns
```python
# Material passport with lifecycle event tracking
async def record_lifecycle_event(product_id: str, event: LifecycleEvent) -> MaterialPassport:
    passport = await material_registry.get(product_id)
    passport.events.append({
        "stage": event.stage,           # manufacture | sale | repair | return | recycle
        "timestamp": event.ts,
        "location": event.facility_id,
        "material_composition": event.materials,  # {"PET": 0.7, "HDPE": 0.3}
        "co2_kg": event.carbon_footprint,
    })
    # EPR obligation check
    if event.stage == "sale" and passport.market == "EU":
        await epr_registry.record_placement(product_id, passport.weight_kg, passport.material_class)

    await material_registry.save(passport)
    return passport
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Rubicon | Waste collection management, route optimization | SaaS per-location |
| AMP Robotics | AI-powered robotic sorting for MRFs | Hardware + software lease |
| Greyparrot | Computer vision waste analytics for conveyor belts | Per-site subscription |
| Circulor | Material traceability, blockchain-anchored passports | Enterprise |
| Madaster | Building material passport registry | Per-project |
| Sensoneo | Smart bin ultrasonic fill-level sensors | Hardware + platform |

## Related Skills
- `carbon-credit-trading` — Recycling-based carbon offsets, waste diversion credits
- `smart-city-urban-tech` — Smart bin IoT networks, city waste fleet management
- `agri-tech-precision-farming` — Agricultural waste streams, biowaste-to-compost tracking

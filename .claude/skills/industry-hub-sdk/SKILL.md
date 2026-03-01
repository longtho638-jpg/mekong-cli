---
name: industry-hub-sdk
description: Unified industry verticals SDK — construction, climate/ESG, robotics, logistics, physical AI, space tech. Use for industry-specific solutions.
license: MIT
version: 1.0.0
---

# Industry Hub SDK Skill

Build industry-specific solutions with unified construction, climate, robotics, and logistics facades.

## When to Use

- Construction project management and BIM
- Carbon tracking and ESG reporting
- Robotics fleet management and autonomous systems
- Supply chain and logistics optimization
- Physical AI and spatial computing
- Space tech applications

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/industry-hub-sdk/construction` | ConstructionFacade | Projects, BIM, safety |
| `@agencyos/industry-hub-sdk/climate` | ClimateFacade | Carbon, ESG, offsets |
| `@agencyos/industry-hub-sdk/robotics` | RoboticsFacade | Fleet, tasks, spatial |
| `@agencyos/industry-hub-sdk/logistics` | LogisticsFacade | Shipments, routes, warehouse |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-construction` | Construction tech |
| `@agencyos/vibe-climate` | Climate/ESG |
| `@agencyos/vibe-robotics` | Robotics systems |
| `@agencyos/vibe-physical-ai` | Physical AI |
| `@agencyos/vibe-space-tech` | Space technology |
| `@agencyos/vibe-spatial` | Spatial computing |
| `@agencyos/vibe-logistics` | Supply chain |

---
name: construction-hub-sdk
description: Unified Construction SDK — BIM, project management, safety compliance, cost estimation, RFI/submittal tracking. Use for ConTech, BIM platforms, construction project management.
license: MIT
version: 1.0.0
---

# Construction Hub SDK Skill

Build construction management platforms, BIM viewers, and safety compliance systems.

## When to Use

- Construction project management (Procore-style)
- BIM model viewing and clash detection
- RFI and submittal tracking
- Safety inspection and incident reporting
- Cost estimation and budget tracking
- Change order management

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/construction-hub-sdk/project` | ProjectFacade | Projects, BIM, RFIs, submittals |
| `@agencyos/construction-hub-sdk/safety` | SafetyFacade | Inspections, incidents, compliance |
| `@agencyos/construction-hub-sdk/estimation` | EstimationFacade | Costs, budgets, change orders |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-construction` | Core construction engine |

## Usage

```typescript
import { createProjectManager, createSafetyManager } from '@agencyos/construction-hub-sdk';
```

## Related Skills

- `construction-tech` — Construction technology & BIM reference
- `construction-agent` — Construction AI workflows

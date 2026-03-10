---
name: healthcare-hub-sdk
description: Unified healthcare SDK — digital therapeutics, telehealth, patient data. Use for health platforms, telemedicine, patient management, clinical workflows.
license: MIT
version: 1.0.0
---

# Healthcare Hub SDK Skill

Build health platforms, telemedicine systems, and patient data pipelines with unified healthcare facades.

## When to Use

- Digital therapeutics (DTx) platform setup
- Telehealth video/chat integration
- Patient data management (HIPAA-aware)
- Clinical workflow automation
- Health monitoring dashboards
- Wellness platform architecture

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/healthcare-hub-sdk/digital-therapeutics` | DigitalTherapeuticsFacade | DTx programs, adherence |
| `@agencyos/healthcare-hub-sdk/telehealth` | TelehealthFacade | Video visits, scheduling |
| `@agencyos/healthcare-hub-sdk/patient-data` | PatientDataFacade | Records, consent, privacy |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-digital-therapeutics` | Core DTx engine |

## Usage

```typescript
import { DigitalTherapeuticsFacade, TelehealthFacade, PatientDataFacade } from '@agencyos/healthcare-hub-sdk';
```

## Related Skills

- `healthcare-agent` — Healthcare AI workflows
- `digital-therapeutics` — DTx patterns
- `longevity-biotech` — Longevity research
- `pharma-biotech` — Pharma pipelines

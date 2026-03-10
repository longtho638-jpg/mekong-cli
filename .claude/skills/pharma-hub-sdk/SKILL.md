---
name: pharma-hub-sdk
description: Unified Pharma SDK — drug discovery pipeline, clinical trials, regulatory submission, pharmaceutical distribution, pharmacovigilance. Use for pharma platforms, CROs, drug distribution networks.
license: MIT
version: 1.0.0
---

# Pharma Hub SDK Skill

Build pharmaceutical R&D platforms, regulatory submission tools, and drug distribution networks.

## When to Use

- Drug discovery pipeline and compound tracking
- Clinical trial design, enrollment, and data capture
- Regulatory submission (FDA, EMA, ICH) document management
- Pharmaceutical supply chain and cold-chain logistics
- Pharmacovigilance and adverse event reporting
- Prescription management and drug-drug interaction checks

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/pharma-hub-sdk/discovery` | DiscoveryFacade | Compounds, trials, pipeline |
| `@agencyos/pharma-hub-sdk/regulatory` | RegulatoryFacade | Submissions, dossiers, approvals |
| `@agencyos/pharma-hub-sdk/distribution` | DistributionFacade | Supply chain, cold-chain, recalls |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-pharma` | Core pharma engine |
| `@agencyos/vibe-clinical-trials` | Clinical trial management |
| `@agencyos/vibe-regulatory` | Regulatory affairs automation |

## Usage

```typescript
import { createDiscoveryPipeline, createRegulatoryManager, createDistributionNetwork } from '@agencyos/pharma-hub-sdk';

const compound = await createDiscoveryPipeline().addCompound({
  name: 'VX-2041',
  targetIndication: 'T2D',
  phase: 'preclinical',
  molecularWeight: 412.5,
});

const submission = await createRegulatoryManager().createDossier({
  compoundId: compound.id,
  authority: 'FDA',
  submissionType: 'NDA',
  targetDate: '2027-01-15',
});

const shipment = await createDistributionNetwork().dispatchBatch({
  productId: 'DRUG-001',
  batchNumber: 'B2026-0412',
  destination: 'warehouse_NY',
  coldChain: { minTemp: 2, maxTemp: 8 },
});
```

## Key Types

- `Compound` — molecular data, phase, patent expiry, trial links
- `ClinicalTrial` — protocol, cohorts, endpoints, IRB approval
- `RegulatoryDossier` — submission package, review status, agency correspondence
- `PharmaBatch` — lot number, expiry, cold-chain log, recall status

## Related Skills

- `healthcare-hub-sdk` — Patient and clinical data patterns
- `legal-hub-sdk` — Regulatory compliance frameworks

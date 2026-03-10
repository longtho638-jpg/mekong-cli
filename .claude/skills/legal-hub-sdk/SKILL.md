---
name: legal-hub-sdk
description: Unified legal SDK — contracts, compliance, IP management. Use for contract lifecycle, compliance automation, intellectual property tracking.
license: MIT
version: 1.0.0
---

# Legal Hub SDK Skill

Build contract management, compliance systems, and IP tracking with unified legal facades.

## When to Use

- Contract lifecycle management (CLM)
- Compliance automation and monitoring
- IP/patent portfolio tracking
- Legal document generation and review
- Regulatory change monitoring
- Due diligence workflows

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/legal-hub-sdk/contract` | ContractFacade | CLM, templates, signatures |
| `@agencyos/legal-hub-sdk/compliance` | ComplianceFacade | Regulations, audits, alerts |
| `@agencyos/legal-hub-sdk/ip` | IPFacade | Patents, trademarks, licensing |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-compliance-auto` | Compliance automation engine |

## Usage

```typescript
import { ContractFacade, ComplianceFacade, IPFacade } from '@agencyos/legal-hub-sdk';
```

## Related Skills

- `legal-agent` — Legal AI assistant
- `legaltech-contract-intelligence` — Contract analysis
- `contract-lifecycle-management` — CLM workflows
- `compliance-automation` — Regulatory automation
- `ip-patent` — IP management

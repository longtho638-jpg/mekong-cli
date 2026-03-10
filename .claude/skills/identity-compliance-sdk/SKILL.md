---
name: identity-compliance-sdk
description: Unified identity & compliance SDK — DID, verifiable credentials, KYC/AML, consent management, GDPR/CCPA. Use for digital identity, compliance automation, privacy engineering.
license: MIT
version: 1.0.0
---

# Identity & Compliance SDK Skill

Build identity verification, compliance automation, and consent management with unified facades.

## When to Use

- Decentralized Identity (DID) implementation
- Verifiable credentials issuance and verification
- KYC/AML compliance workflows
- Consent management (GDPR, CCPA)
- Audit trail and compliance reporting
- Privacy engineering patterns

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/identity-compliance-sdk/identity` | IdentityFacade | DID, verifiable credentials, KYC |
| `@agencyos/identity-compliance-sdk/compliance` | ComplianceFacade | Regulatory, AML, audit trails |
| `@agencyos/identity-compliance-sdk/consent` | ConsentFacade | GDPR/CCPA consent, preferences |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-identity` | Core identity engine |
| `@agencyos/vibe-compliance` | Compliance framework |
| `@agencyos/vibe-compliance-auto` | Automated compliance |
| `@agencyos/vibe-consent` | Consent management |

## Usage

```typescript
import { IdentityFacade, ComplianceFacade, ConsentFacade } from '@agencyos/identity-compliance-sdk';
```

## Related Skills

- `decentralized-identity` — DID/VC patterns
- `compliance-automation` — Regulatory automation
- `data-privacy-engineering` — Privacy engineering
- `regtech-compliance` — RegTech reference

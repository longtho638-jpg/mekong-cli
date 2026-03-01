---
name: insurtech-hub-sdk
description: Unified InsurTech SDK — insurance policy management, claims processing, underwriting automation, risk assessment, premium calculation. Use for insurance platforms, claims systems, broker portals.
license: MIT
version: 1.0.0
---

# InsurTech Hub SDK Skill

Build insurance platforms, claims management systems, and underwriting automation tools.

## When to Use

- Insurance policy creation, renewal, and cancellation
- Claims submission, tracking, and settlement
- Underwriting risk assessment and premium calculation
- Broker and agent management portals
- Reinsurance and treaty management
- Regulatory compliance and actuarial reporting

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/insurtech-hub-sdk/policy` | PolicyFacade | Policies, endorsements, renewals |
| `@agencyos/insurtech-hub-sdk/claims` | ClaimsFacade | Claims, adjusters, settlements |
| `@agencyos/insurtech-hub-sdk/underwriting` | UnderwritingFacade | Risk, pricing, appetite |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-insurtech` | Core insurance engine |
| `@agencyos/vibe-claims` | Claims processing |
| `@agencyos/vibe-underwriting` | Risk underwriting |

## Usage

```typescript
import { createPolicyManager, createClaimsProcessor, createUnderwriter } from '@agencyos/insurtech-hub-sdk';

const policy = await createPolicyManager().issue({
  productCode: 'AUTO-COMP',
  insuredId: 'cust_123',
  premium: 1200,
  term: '12M',
});

const claim = await createClaimsProcessor().submit({
  policyId: policy.id,
  lossDate: new Date(),
  lossType: 'collision',
  estimatedAmount: 5000,
});

const risk = await createUnderwriter().assess({
  applicantId: 'cust_456',
  product: 'HOME',
  factors: { age: 35, location: 'zone-A' },
});
```

## Key Types

- `Policy` — policy lifecycle with endorsements and riders
- `Claim` — claim with status, adjuster notes, payment schedule
- `RiskScore` — underwriting score with appetite flags
- `Premium` — calculated premium with rating factors

## Related Skills

- `fintech` — Financial services patterns
- `legal-hub-sdk` — Regulatory compliance reference

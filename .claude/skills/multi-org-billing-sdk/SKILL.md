---
name: multi-org-billing-sdk
description: Multi-org billing SDK — tenant-scoped webhook orchestration, subdomain routing, org-aware subscription activation. Use for multi-tenant SaaS billing, B2B subscriptions.
license: MIT
version: 1.0.0
---

# Multi-Org Billing SDK Skill

Build multi-tenant billing systems with tenant-scoped webhooks, subdomain routing, and org-aware subscriptions.

## When to Use

- Multi-tenant SaaS billing setup
- Org-scoped subscription management
- Tenant-aware webhook processing
- Subdomain-based billing routing
- B2B subscription activation
- Multi-org payment orchestration

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/multi-org-billing-sdk/orchestrator` | MultiOrgBillingOrchestrator | Tenant-scoped webhook pipeline |
| `@agencyos/multi-org-billing-sdk/tenant-router` | MultiOrgTenantRouter | Subdomain → org resolution |
| `@agencyos/multi-org-billing-sdk/types` | Types | Shared type definitions |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-payment` | Payment processing |
| `@agencyos/vibe-ops` | Operations framework |
| `@agencyos/vibe-subscription` | Subscription lifecycle |

## Usage

```typescript
import { MultiOrgBillingOrchestrator } from '@agencyos/multi-org-billing-sdk/orchestrator';
import { MultiOrgTenantRouter } from '@agencyos/multi-org-billing-sdk/tenant-router';
```

## Pipeline

```
Webhook → Signature verify → Tenant resolution (subdomain/orgId)
→ Org-scoped subscription activation → Billing audit log
```

## Related Skills

- `billing-orchestration` — Webhook pipeline reference
- `billing-sdk` — Core billing patterns
- `subscription-saas-ops` — SaaS subscription operations
- `webhook-billing-sdk` — Unified webhook facade

---
name: commerce-hub-sdk
description: Unified commerce SDK — e-commerce, POS, F&B, composable commerce. Use for online stores, restaurant systems, point-of-sale, multi-channel retail, MACH architecture.
license: MIT
version: 1.0.0
---

# Commerce Hub SDK Skill

Build e-commerce platforms, POS systems, and F&B solutions with unified commerce facades.

## When to Use

- E-commerce storefront and cart/checkout
- Point-of-sale (POS) system development
- Food & beverage ordering and menu management
- Multi-channel retail orchestration
- Composable commerce (MACH architecture)
- Inventory and order management

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/commerce-hub-sdk/ecommerce` | EcommerceFacade | Catalog, cart, checkout, orders |
| `@agencyos/commerce-hub-sdk/pos` | POSFacade | Terminals, receipts, cash management |
| `@agencyos/commerce-hub-sdk/fnb` | FnBFacade | Menu, kitchen display, table management |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-ecommerce` | Core e-commerce engine |
| `@agencyos/vibe-pos` | POS system |
| `@agencyos/vibe-fnb` | Food & beverage |
| `@agencyos/vibe-composable-commerce` | MACH patterns |

## Usage

```typescript
import { EcommerceFacade, POSFacade, FnBFacade } from '@agencyos/commerce-hub-sdk';
```

## Related Skills

- `composable-commerce-mach` — MACH architecture patterns
- `ecommerce-agent` — E-commerce AI workflows
- `restaurant-pos-system` — Restaurant POS reference
- `agentic-commerce` — Agentic commerce patterns
- `vietnamese-ecommerce` — Vietnam e-commerce specifics

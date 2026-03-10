---
name: fashion-hub-sdk
description: Unified Fashion SDK — AI styling, product catalog, size recommendation, supply chain, trend analytics. Use for fashion retail, D2C brands, styling apps, fashion marketplaces.
license: MIT
version: 1.0.0
---

# Fashion Hub SDK Skill

Build fashion retail platforms, AI styling tools, and supply chain management systems.

## When to Use

- Product catalog with size/color variant management
- AI-powered outfit recommendations and styling
- Size and fit prediction from body measurements
- Supply chain: sourcing, production, logistics tracking
- Trend analytics and demand forecasting
- Virtual try-on and lookbook generation

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/fashion-hub-sdk/catalog` | CatalogFacade | Products, variants, collections |
| `@agencyos/fashion-hub-sdk/styling` | StylingFacade | AI outfits, recommendations, try-on |
| `@agencyos/fashion-hub-sdk/supply` | SupplyFacade | Sourcing, production, logistics |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-fashion` | Core fashion engine |
| `@agencyos/vibe-ai-styling` | AI styling and recommendations |
| `@agencyos/vibe-supply-chain` | Supply chain management |

## Usage

```typescript
import { createCatalogManager, createStylingEngine, createSupplyChain } from '@agencyos/fashion-hub-sdk';

const product = await createCatalogManager().create({
  name: 'Silk Wrap Dress',
  category: 'dresses',
  variants: [{ size: 'S', color: 'ivory', sku: 'DRS-001-S-IV' }],
  price: 189,
});

const outfit = await createStylingEngine().recommend({
  customerId: 'cust_123',
  occasion: 'business-casual',
  bodyMeasurements: { bust: 88, waist: 68, hips: 94 },
});

const order = await createSupplyChain().createProductionOrder({
  productId: product.id,
  quantity: 500,
  supplierId: 'sup_456',
  deadline: '2026-06-01',
});
```

## Key Types

- `Product` — catalog item with variants, media, sizing guide
- `OutfitRecommendation` — styled look with item list and fit score
- `SizeProfile` — body measurements mapped to brand size charts
- `ProductionOrder` — supplier order with milestones and QC checkpoints

## Related Skills

- `commerce-hub-sdk` — E-commerce checkout patterns
- `logistics-hub-sdk` — Last-mile delivery integration

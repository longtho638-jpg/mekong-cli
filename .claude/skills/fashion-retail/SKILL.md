---
name: fashion-retail
description: E-commerce platforms, PIM, visual AI, virtual try-on, demand forecasting, OMS, returns, sizing tech. Use for fashion brands, retail platforms, D2C commerce.
license: MIT
version: 1.0.0
---

# Fashion & Retail Technology Skill

Build fashion e-commerce platforms, product information systems, visual AI experiences, and retail operations with modern headless commerce.

## When to Use

- Headless e-commerce platform selection and setup
- Product Information Management (PIM) integration
- Virtual try-on and visual AI features
- Demand forecasting and inventory optimization
- Order Management System (OMS) implementation
- Returns management and reverse logistics
- AI-powered sizing and fit technology
- Sustainability tracking for fashion supply chain
- Influencer marketing platform integration
- Omnichannel retail operations

## Tool Selection

| Need | Choose |
|------|--------|
| Headless commerce (open-source) | Medusa.js (MIT, Node.js, zero license) |
| Headless commerce (enterprise) | commercetools (GraphQL+REST, $100K+/yr) |
| SaaS commerce | Shopify Plus (for simplicity, but outgrowth risk) |
| PIM (pure data) | Akeneo (open-source + enterprise tiers) |
| PXM (data + analytics) | Salsify (syndication + digital shelf) |
| PIM (full-featured OSS) | Pimcore (PIM + DAM + AI enrichment) |
| Virtual try-on | Vue.ai (AR dressing room), Zeekit (body-realistic) |
| AI sizing | True Fit (genome model), 3DLOOK (phone scan) |
| Demand forecasting | Synaos, Relex Solutions, Blue Yonder |
| OMS | Fluent Commerce (cloud-native), Manhattan Active |
| Returns | Loop Returns (Shopify), Narvar, Happy Returns |
| Sustainability | TrusTrace (supply chain), Higg Index |

## Headless Commerce Architecture

```
Frontend (Next.js / Remix / Mobile)
    ↓ (REST / GraphQL)
Headless Commerce Engine (Medusa.js / commercetools)
    ↓
┌────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Product  │  │ Cart &   │  │ Payment  │ │
│  │ Catalog  │  │ Checkout │  │ Gateway  │ │
│  │ (PIM)    │  │          │  │ (Stripe) │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Inventory│  │ Order    │  │ Returns  │ │
│  │ Mgmt     │  │ Mgmt     │  │ Mgmt     │ │
│  │          │  │ (OMS)    │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────────────────────┘
    ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Visual   │  │ Demand   │  │ Sustain- │
│ AI/AR    │  │ Forecast │  │ ability  │
└──────────┘  └──────────┘  └──────────┘
```

## Medusa.js Integration

```typescript
import Medusa from "@medusajs/medusa-js"

const medusa = new Medusa({ baseUrl: "http://localhost:9000" })

// List products with variants
const { products } = await medusa.products.list({
  limit: 20,
  expand: "variants,variants.prices,images"
})

// Create cart and add item
const { cart } = await medusa.carts.create()
await medusa.carts.lineItems.create(cart.id, {
  variant_id: "variant_01H...",
  quantity: 1
})

// Complete checkout
await medusa.carts.complete(cart.id)
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Conversion Rate | Orders / Visitors | 2-4% (fashion avg) |
| AOV | Total Revenue / Orders | Per brand benchmark |
| Return Rate | Returns / Orders | < 20% (vs 30% industry avg) |
| Size Accuracy | Correct fit / Total orders | > 85% with AI sizing |
| PIM Completeness | Filled attributes / Total | > 95% |
| Time-to-Market | Concept → Live listing | < 2 weeks |
| Inventory Turnover | COGS / Avg Inventory | 4-6x annually |
| Customer LTV | Avg Order × Frequency × Lifespan | Growing QoQ |
| Cart Abandonment | Abandoned / Started carts | < 65% |
| Virtual Try-On Conv. | Try-on users conv. rate | 2-3x baseline |

## PIM Data Model

```
Product
├── Basic Info (name, brand, season, collection)
├── Attributes (color, size, material, care instructions)
├── Media (images, videos, 360° views, AR assets)
├── Pricing (base, sale, regional, currency)
├── Variants (size × color matrix)
├── Categories (taxonomy, tags, filters)
├── Localization (translations, regional sizing)
└── Sustainability (materials origin, certifications, Higg score)
```

## Size & Fit AI Pattern

```
1. Data Collection → Body measurements (phone scan / quiz)
2. Size Mapping → Match to brand-specific size charts
3. Fit Prediction → ML model (True Fit genome / 3DLOOK)
4. Recommendation → "Your best fit: M (95% confidence)"
5. Feedback Loop → Return reasons feed model retraining
```

## References

- Medusa.js: https://docs.medusajs.com
- commercetools: https://docs.commercetools.com
- Akeneo PIM: https://docs.akeneo.com
- Salsify: https://www.salsify.com
- Vue.ai: https://vue.ai
- True Fit: https://www.truefit.com
- Loop Returns: https://www.loopreturns.com
- TrusTrace: https://www.trustrace.com
- Fluent Commerce: https://fluentcommerce.com

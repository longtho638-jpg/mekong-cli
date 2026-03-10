# Composable Commerce (MACH) — Modular E-Commerce Architecture

Build headless, API-first commerce platforms using MACH principles. $7.8B market by 2027, 18% CAGR.

## When to Use
- Building headless commerce with decoupled frontend/backend
- Migrating monolithic e-commerce to composable architecture
- Integrating best-of-breed commerce services via APIs
- Implementing multi-channel commerce (web, mobile, POS, social)

## Key Concepts
| Term | Meaning |
|------|---------|
| MACH | Microservices, API-first, Cloud-native, Headless |
| PBC | Packaged Business Capability — modular commerce unit |
| OMS | Order Management System |
| PIM | Product Information Management |
| Headless | Frontend decoupled from commerce engine |
| Storefront API | GraphQL/REST API exposing catalog, cart, checkout |

## Core Modules
```
Catalog & PIM
  ├── Product modeling (variants, bundles, digital)
  ├── Category taxonomy
  ├── Pricing engine (dynamic, tiered, B2B)
  └── Inventory sync (multi-warehouse)

Cart & Checkout
  ├── Persistent cart (anonymous + authenticated)
  ├── Promotion engine (coupon, discount, BOGO)
  ├── Tax calculation (TaxJar, Avalara)
  └── Multi-payment orchestration

Order Management
  ├── Order lifecycle FSM
  ├── Fulfillment routing (3PL, dropship, in-store)
  ├── Returns & refunds engine
  └── Subscription orders (recurring)

Storefront Experience
  ├── Headless CMS integration
  ├── Search & merchandising (Algolia, Typesense)
  ├── Personalization engine
  └── Multi-channel publishing
```

## Key Integrations
| Category | Services |
|----------|---------|
| Commerce Engines | commercetools, Medusa, Saleor, Shopify Hydrogen |
| CMS | Contentful, Sanity, Strapi |
| Search | Algolia, Typesense, Meilisearch |
| Payments | Stripe, Adyen, PayOS |
| Fulfillment | ShipStation, EasyPost, Shippo |

## Implementation Patterns
```typescript
interface ComposableCommerceConfig {
  engine: 'commercetools' | 'medusa' | 'saleor' | 'custom';
  storefrontApi: 'graphql' | 'rest';
  currency: string;
  locale: string;
}

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: { amount: number; currency: string };
  discounts: { code: string; amount: number }[];
}

interface OrderFulfillment {
  orderId: string;
  strategy: 'ship-from-store' | 'warehouse' | 'dropship' | '3pl';
  carrier: string;
  trackingNumber?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';
}
```

## SDK
`@agencyos/vibe-composable-commerce` — catalog API, cart engine, checkout orchestration, fulfillment routing

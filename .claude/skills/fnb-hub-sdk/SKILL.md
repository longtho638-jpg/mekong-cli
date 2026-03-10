---
name: fnb-hub-sdk
description: Unified F&B SDK — restaurant management, food delivery, kitchen display, recipe database, table reservations. Use for restaurant tech, food delivery platforms, kitchen management.
license: MIT
version: 1.0.0
---

# F&B Hub SDK Skill

Build restaurant management systems, food delivery platforms, and kitchen operations tools.

## When to Use

- Restaurant management and POS integration
- Table reservation systems
- Food delivery dispatch and driver management
- Kitchen display and order routing
- Recipe database and cost per serving
- Ingredient inventory and expiry tracking

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/fnb-hub-sdk/restaurant` | RestaurantFacade | Restaurants, tables, menus |
| `@agencyos/fnb-hub-sdk/delivery` | DeliveryFacade | Orders, drivers, zones |
| `@agencyos/fnb-hub-sdk/kitchen` | KitchenFacade | KDS, recipes, ingredients |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-fnb` | Core F&B engine |
| `@agencyos/vibe-food-tech` | Food technology |
| `@agencyos/vibe-pos` | POS system |

## Usage

```typescript
import { createRestaurantManager, createDeliveryDispatcher } from '@agencyos/fnb-hub-sdk';
```

## Related Skills

- `food-beverage` — F&B industry patterns
- `precision-food-tech` — Food technology reference

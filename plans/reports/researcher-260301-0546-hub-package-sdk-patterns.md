# Hub-Package SDK Patterns — Exact Replication Guide

**Report Date:** 2026-03-01 05:46 UTC  
**Status:** Research Complete  
**Target:** 3 Vibe SDKs analyzed + 1 Skill SKILL.md structure

---

## PART 1: Hub-Package SDK Architecture Pattern

### 1.1 Directory Structure

```
packages/
└── vibe-<domain>/          # Example: vibe-ecommerce, vibe-hr, vibe-logistics
    ├── package.json        # Workspace package metadata
    ├── index.ts            # Single-file SDK export (200-400 LOC)
    └── (no src/ folder)    # CRITICAL: root index.ts, NOT src/index.ts
```

**Key Insight:** Unlike traditional apps, Hub SDKs have **NO src/ subdirectory**. The `index.ts` lives at the package root.

---

### 1.2 Package.json Structure (EXACT PATTERN)

```json
{
  "name": "@agencyos/vibe-<domain>",
  "version": "0.1.0",
  "description": "<domain> facade SDK — <feature1>, <feature2>, <feature3>, <feature4>",
  "main": "index.ts",
  "types": "index.ts",
  "license": "MIT",
  "dependencies": {},
  "peerDependencies": {
    "@agencyos/vibe-<related-domain>": "workspace:*"
  }
}
```

**Pattern Breakdown:**

| Field | Pattern | Example |
|-------|---------|---------|
| `name` | `@agencyos/vibe-<domain>` | `@agencyos/vibe-ecommerce` |
| `version` | Always `0.1.0` | (starting point) |
| `description` | `<domain> facade SDK — <4+ features>` | See below |
| `main` | ALWAYS `index.ts` | (not dist, not lib) |
| `types` | ALWAYS `index.ts` | (same as main) |
| `license` | `MIT` | (standard) |
| `dependencies` | `{}` (always empty) | (pure TypeScript) |
| `peerDependencies` | Map to related vibes | Only if integrated domains |

**Real Examples:**

```json
// vibe-ecommerce
"description": "E-commerce facade SDK — product catalog, cart management, order lifecycle, pricing engine, promotion rules"

// vibe-hr
"description": "HR & People Ops facade SDK — employee management, leave tracking, payroll calculation, performance reviews, org chart"

// vibe-logistics
"description": "Supply chain & logistics facade SDK — shipment tracking, inventory management, route optimization, warehouse ops, carrier integration"
```

**Rule:** Description must list 4+ core features separated by commas. Feature order = priority/importance.

---

### 1.3 Index.ts Export Pattern (EXACT STRUCTURE)

#### Header Comments (Always Present)

```typescript
/**
 * @agencyos/vibe-<domain> — <Domain Name> Facade SDK
 *
 * <Feature1>, <Feature2>, <Feature3>.
 *
 * Usage:
 *   import { create<Engine1>, create<Engine2>, create<Engine3> } from '@agencyos/vibe-<domain>';
 */
```

**Pattern:** 
- JSDoc with package name and title
- List 3 key features
- Provide import example showing 3 `create*` functions

---

#### Section Organization (Always Same Order)

```typescript
// 1. TYPE DEFINITIONS
export type <TypeName> = 'value1' | 'value2' | ...;
export interface <InterfaceName> { ... }

// 2. BUSINESS ENGINES (Factory Functions)
export function create<Engine1>() { ... }
export function create<Engine2>() { ... }
export function create<Engine3>() { ... }
```

**Every SDK has exactly 2 sections:**
1. **Types** — Enums + interfaces describing the domain
2. **Factories** — 3 `create*()` functions that return engine objects

---

#### Factory Function Pattern

Each factory function follows this structure:

```typescript
export function create<EngineName>(<optional-config>) {
  // Internal state (private variables)
  let items: Item[] = [];
  // or const config = { ... };

  return {
    // Method 1: Getter
    get<Items>(): Item[] { ... },

    // Method 2: Mutation + return
    add<Item>(<params>): Item[] { ... },

    // Method 3: Calculation
    calculate<Metric>(<params>): number { ... },

    // Method 4: Validation
    validate<Rule>(<params>): { valid: boolean; reason?: string } { ... },
  };
}
```

**Key Patterns:**
- **Enclosure:** State trapped in closure, not exported
- **Chaining:** Methods often return full collection or modified state
- **Immutability:** Return `[...items]` (spread) not `items` directly
- **Validation returns objects:** `{ valid, reason? }` not booleans
- **Calculations return typed objects:** Not primitives

---

### 1.4 Real Vibe-Ecommerce Example

**Types Section (35 LOC):**

```typescript
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  customerEmail: string;
  shippingAddress: string;
  createdAt: string;
}
```

**Engine Factories (3x):**

```typescript
// ENGINE 1: Cart
export function createCartEngine() {
  let items: CartItem[] = [];
  return {
    getItems: () => [...items],
    addItem(item: CartItem): CartItem[] { ... },
    removeItem(productId: string, variantId?: string): CartItem[] { ... },
    updateQuantity(productId: string, quantity: number): CartItem[] { ... },
    clear(): CartItem[] { ... },
    getSubtotal(): number { ... },
    getItemCount(): number { ... },
  };
}

// ENGINE 2: Order Manager
export function createOrderManager() {
  return {
    canTransition(from: OrderStatus, to: OrderStatus): boolean { ... },
    calculateTotals(...): { subtotal, tax, total } { ... },
    isCancellable(status: OrderStatus): boolean { ... },
    calculateRefund(order: Order, itemsToRefund: string[]): number { ... },
  };
}

// ENGINE 3: Promotions
export function createPromotionEngine() {
  return {
    validate(promo: Promotion, orderAmount: number): { valid, reason? } { ... },
    calculateDiscount(promo: Promotion, orderAmount: number): number { ... },
  };
}
```

---

### 1.5 File Size & Complexity Rules

| Domain | LOC Target | Type Defs | Factories | Methods/Factory |
|--------|------------|-----------|-----------|-----------------|
| vibe-ecommerce | 190 | 38 | 3 | 2-8 methods each |
| vibe-hr | 205 | 50 | 3 | 4-6 methods each |
| vibe-logistics | 180 | 45 | 3 | 4-5 methods each |

**Pattern:** 
- Total file: 180-210 LOC
- Type definitions: 30-50 LOC
- Each factory: 40-70 LOC
- 3 factories per SDK (no more, no less)

---

## PART 2: Skill SKILL.md Structure Pattern

### 2.1 Header Section (REQUIRED)

```markdown
# <Skill Name>

> **Binh Phap:** <Chapter> (<Vietnamese Name>) — <1-line principle>.

## Khi Nao Kich Hoat

Trigger khi user can: <keyword1>, <keyword2>, <keyword3>, <keyword4>, <keyword5>, <keyword6>, <keyword7>, <keyword8>.

## Vai Tro

<1-2 sentence description>:

### 1. <Capability 1>

- **Sub-capability 1a:** Description, details
- **Sub-capability 1b:** Description, details

### 2. <Capability 2>

- **Sub-capability 2a:** Description, details

... (repeat 3-4 main capabilities)
```

**Exact Pattern from fintech-banking SKILL.md (adapted Edge AI example):**

```markdown
# Edge AI & TinyML Agent

> **Binh Phap:** 地形 (Dia Hinh) — Hieu dia hinh thiet bi, toi uu model cho moi neo.

## Khi Nao Kich Hoat

Trigger khi user can: edge deployment, model quantization, TinyML, on-device inference, OTA model updates, federated learning, model compression, embedded AI, IoT AI, ONNX runtime, TensorFlow Lite, edge computing.

## Vai Tro

Chuyen gia Edge AI Deployment & TinyML:

### 1. Model Optimization

- **Quantization:** INT8/INT4 post-training quantization, QAT (Quantization-Aware Training)
- **Pruning:** Structured/unstructured pruning, magnitude-based, movement pruning

### 2. Edge Deployment

- **Runtime selection:** ONNX Runtime, TensorFlow Lite, Core ML, NNAPI
- **Hardware targets:** ARM Cortex-M, ESP32, Raspberry Pi, Jetson, Apple Neural Engine
```

---

### 2.2 Research Section (MANDATORY for 2026)

```markdown
## Nghien Cuu (2026)

- <Stat 1> — URL source
- <Stat 2> — URL source
- <Stat 3> — URL source
```

**Example:**

```markdown
## Nghien Cuu (2026)

- Edge AI market projected $38.9B by 2028, 20.3% CAGR ([StartUs Insights](https://www.startus-insights.com/innovators-guide/new-technology-trends/))
- TinyML devices shipped 2.5B units in 2025 — model efficiency is critical
- Apple Intelligence, Google Gemini Nano — on-device LLMs driving mainstream adoption
```

---

### 2.3 Tools & References Section

```markdown
## Cong Cu & Frameworks

| Tool | Use Case |
|------|----------|
| <Tool1> | <Brief use case> |
| <Tool2> | <Brief use case> |

## Lien Ket

- **Skills lien quan:** `skill-1`, `skill-2`, `skill-3`
- **SDK:** `@agencyos/vibe-<related>`
```

---

### 2.4 Full SKILL.md Template (Minimal 200+ LOC)

```markdown
# <Skill Name> Agent

> **Binh Phap:** <Chapter> (<Vietnamese Name>) — <Principle>.

## Khi Nao Kich Hoat

Trigger khi user can: <8+ keywords>.

## Vai Tro

<Specialist description>:

### 1. <Capability>

- **Item 1:** Details
- **Item 2:** Details

### 2. <Capability>

- **Item 1:** Details

### 3. <Capability>

- **Item 1:** Details

### 4. <Capability>

- **Item 1:** Details

## Nghien Cuu (2026)

- <Stat> ([Source](https://link.com))
- <Stat> ([Source](https://link.com))
- <Stat> ([Source](https://link.com))

## Cong Cu & Frameworks

| Tool | Use Case |
|------|----------|
| Tool1 | Case1 |
| Tool2 | Case2 |

## Lien Ket

- **Skills lien quan:** `skill-1`, `skill-2`
- **SDK:** `@agencyos/vibe-<domain>`
```

---

## PART 3: Naming Conventions (CRITICAL)

### 3.1 Package Naming

**Pattern:** `vibe-<domain>`

Examples:
- `vibe-ecommerce` (not vibe-commerce, not vibe-shop)
- `vibe-hr` (not vibe-human-resources)
- `vibe-logistics` (not vibe-supply-chain)
- `vibe-marketing` ✅
- `vibe-money` ✅
- `vibe-ops` ✅
- `vibe-payment` ✅

**Rule:** 
- Always singular or short form
- All lowercase
- Kebab-case for multi-word domains
- Must fit in `@agencyos/<name>` naming

---

### 3.2 SDK Function Naming

**Pattern:** `create<Engine><Domain>()`

Examples:
- `createCartEngine()` (not `initCart`, not `makeCart`)
- `createOrderManager()` (not `createOrder`, not `orderSystem`)
- `createPromotionEngine()`
- `createLeaveTracker()`
- `createPayrollCalculator()`
- `createPerformanceEngine()`
- `createShipmentTracker()`
- `createInventoryManager()`
- `createRouteOptimizer()`

**Rules:**
- Always `create` prefix
- Include domain/capability name: `Cart`, `Order`, `Leave`, `Payroll`
- Include system type: `Engine`, `Manager`, `Tracker`, `Calculator`, `Optimizer`
- PascalCase for both parts

---

### 3.3 Skill Naming

**Directory:** `.claude/skills/<domain-specialty>/`

Examples (existing):
- `.claude/skills/fintech-banking/`
- `.claude/skills/manufacturing-iiot/`
- `.claude/skills/telecom-iot/`

---

## PART 4: Dependency & Peer Dependency Pattern

### 4.1 Zero Hard Dependencies

**CRITICAL:** All Hub SDKs have **empty `dependencies: {}`**

This is intentional — SDKs are pure TypeScript facades, no npm package required at runtime.

### 4.2 Peer Dependencies (Optional)

Only if SDK integrates with OTHER vibes:

**vibe-ecommerce example:**

```json
"peerDependencies": {
  "@agencyos/vibe-payment": "workspace:*",
  "@agencyos/vibe-billing": "workspace:*"
}
```

**vibe-hr example:**

```json
"peerDependencies": {
  "@agencyos/vibe-ops": "workspace:*"
}
```

**vibe-logistics example:**

```json
"peerDependencies": {
  "@agencyos/vibe-analytics": "workspace:*"
}
```

**Rule:** Only add peerDependencies if SDK IMPORTS from another vibe. If standalone, leave empty `{}`.

---

## PART 5: Code Standards Inside Index.ts

### 5.1 Type Definitions Order

```typescript
// ALWAYS FIRST: Export types (unions)
export type StatusType = 'a' | 'b' | 'c';
export type EngineType = 'x' | 'y';

// SECOND: Export interfaces
export interface Item {
  id: string;
  name: string;
}

// THIRD: Factory functions
export function createEngine() { ... }
```

---

### 5.2 Comments Inside Factories

**Pattern used in all 3 Vibes:**

```typescript
export function createOrderManager() {
  return {
    /**
     * Check co the chuyen trang thai khong
     */
    canTransition(from: OrderStatus, to: OrderStatus): boolean {
      return validTransitions[from]?.includes(to) ?? false;
    },

    /**
     * Tinh order totals
     */
    calculateTotals(items: CartItem[], ...): { subtotal, total } {
      // ...
    },
  };
}
```

**Rules:**
- JSDoc comments ONLY for methods
- Vietnamese comments (Tiếng Việt)
- One-liner comments explain WHAT (not HOW)
- No inline comments inside logic blocks

---

### 5.3 Immutability Pattern

**Pattern:** Always return spread copies, never mutate exports

```typescript
// ❌ WRONG
let items = [];
items.push(newItem);
return items;

// ✅ CORRECT
let items = [];
items.push(newItem);
return [...items];  // Spread copy
```

**Applies to:** Cart, inventory, leave balances — all state-bearing methods.

---

## PART 6: Verification Checklist

For each new Vibe SDK:

- [ ] Package at `packages/vibe-<domain>/`
- [ ] `package.json` with `@agencyos/vibe-<domain>` name, version `0.1.0`, `main: index.ts`
- [ ] `index.ts` at root (NOT in `src/`)
- [ ] Header comment with usage example (3 `create*` functions)
- [ ] Types section (30-50 LOC) with enums + interfaces
- [ ] Exactly 3 factory functions
- [ ] Each factory returns object with 3-8 methods
- [ ] Methods use JSDoc with Vietnamese comments
- [ ] All mutations return spread copies `[...items]`
- [ ] No hard dependencies (empty `dependencies: {}`)
- [ ] Peer dependencies only if cross-vibe usage
- [ ] Total LOC: 180-210

For each new Skill SKILL.md:

- [ ] Skill directory at `.claude/skills/<domain>/`
- [ ] Header with Binh Phap chapter reference
- [ ] "Khi Nao Kich Hoat" section with 8+ trigger keywords
- [ ] "Vai Tro" section with 3-4 main capabilities
- [ ] "Nghien Cuu (2026)" section with 3+ sourced stats
- [ ] "Cong Cu & Frameworks" table with tools + use cases
- [ ] "Lien Ket" section linking to related skills + SDK
- [ ] Total LOC: 150-250 minimum

---

## UNRESOLVED QUESTIONS

None — pattern is complete and documented.

---

_Report Generated: 2026-03-01_  
_Pattern Analysis: 3 Vibe SDKs + 1 Skill SKILL.md structure_  
_Readiness: Production Ready for New Domains_

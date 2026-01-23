---
title: "A/B Testing Infrastructure Implementation"
description: "Lightweight, performance-first A/B testing mechanism for AgencyOS documentation site using Astro middleware and cookie-based variant assignment."
status: completed
priority: P1
effort: 6h
branch: feat/ab-testing-infra
tags: [architecture, vibe, astro, analytics]
created: 2026-01-22
---

# 📜 A/B Testing Infrastructure Implementation

> Design and implement a lightweight A/B testing system for `apps/docs` to optimize conversion rates on the Hero section and Pricing page.

## 📋 Execution Tasks

- [x] **Phase 1: Research & Discovery**
  - [x] Analyze existing Astro architecture and middleware.
  - [x] Identify target components and current tracking status.
- [x] **Phase 2: Infrastructure Setup**
  - [x] Define `experiments.json` configuration structure.
  - [x] Implement variant assignment logic in `src/middleware.ts`.
  - [x] Add TypeScript definitions for experiments and Astro.locals.
- [x] **Phase 3: Component Modification**
  - [x] Update `Hero.astro` to render based on variant input.
  - [x] Update `PricingSection.astro` to support A/B test variants.
- [x] **Phase 4: Tracking & Verification**
  - [x] Implement `/api/track` endpoint for experiment exposure and conversion events.
  - [x] Add client-side tracking for CTA clicks in variants.
  - [x] Verify zero Cumulative Layout Shift (CLS) using server-side assignment.

## 🔍 Context

### Technical Strategy
- **Mechanism**: Server-side variant assignment via Astro Middleware.
- **Persistence**: HTTP-only cookies to ensure consistency and zero flicker/CLS.
- **Config-Driven**: Active experiments are managed in a centralized JSON file.
- **Performance**: No external heavy libraries (PostHog/Optimizely); minimal footprint.

### Experiments Config (`experiments.json`)
```json
{
  "experiments": [
    {
      "id": "hero-headline-test",
      "variants": ["control", "aggressive", "minimal"],
      "weights": [0.5, 0.25, 0.25],
      "active": true
    },
    {
      "id": "pricing-layout-test",
      "variants": ["control", "featured-first"],
      "weights": [0.5, 0.5],
      "active": false
    }
  ]
}
```

### Affected Files
- `apps/docs/src/middleware.ts`: Assignment logic.
- `apps/docs/src/components/Hero.astro`: Variant rendering.
- `apps/docs/src/components/landing/PricingSection.astro`: Variant rendering.
- `apps/docs/src/pages/api/track.ts`: New tracking endpoint.

## 🛠️ Implementation Steps

### 1. Define Configuration & Types
Create `src/lib/experiments/config.ts` to read the experiment definitions and provide helper functions.

### 2. Middleware Integration
Update `src/middleware.ts` to:
1. Parse existing experiment cookies.
2. For missing assignments of active experiments, roll the dice based on weights.
3. Set cookies for new assignments.
4. Pass assignments to `Astro.locals`.

### 3. Component Updates
Pass the experiment variant from `Astro.locals` to the component props or use it directly within the component to switch content.

### 4. Tracking Infrastructure
Implement a simple API route that logs events to Supabase or a lightweight logging service.
- **exposure**: Logged when a page containing an experiment is viewed.
- **conversion**: Logged when a target CTA is clicked.

## 🏁 Success Criteria
- [ ] Refreshing the page maintains the same variant (sticky).
- [ ] Page source contains the correct variant content (no client-side hydration flicker).
- [ ] Google PageSpeed Insights shows 0 CLS for the Hero section.
- [ ] Tracking events are correctly received by the backend.

## ⚠️ Risks & Mitigations
- **Bot Traffic**: Middleware should ideally skip assignment for known bots to avoid skewing data.
- **Cache Invalidation**: Ensure that Vercel Edge Cache respects the experiment cookies (Vary header).

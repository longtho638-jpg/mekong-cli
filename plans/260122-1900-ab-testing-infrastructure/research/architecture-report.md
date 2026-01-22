# Research Report: A/B Testing Architecture for Astro (SSR)

## 🎯 Objective
Design a zero-CLS, performance-first A/B testing infrastructure for AgencyOS docs (Astro SSR).

## 🏗️ Proposed Architecture

### 1. Server-Side Variant Assignment
- **Mechanism**: Astro Middleware (`src/middleware.ts`).
- **Flow**:
  1. Middleware intercepts request.
  2. Check for existing experiment cookies (e.g., `exp_hero_test`).
  3. If missing:
     - Roll a random number.
     - Select variant based on weights in `experiments.json`.
     - Store assignment in `Astro.locals.experiments`.
     - Set `Set-Cookie` header for the selected variant.
  4. If present:
     - Validate variant exists in current config.
     - Store in `Astro.locals.experiments`.

### 2. Zero-CLS Strategy
By assigning the variant on the server, the HTML returned to the browser already contains the correct content.
- No "flicker" of content.
- No layout shifts caused by client-side JS changing the DOM after initial render.

### 3. Bot Detection
Use `ua-parser-js` to detect bots and search engine crawlers.
- **Rule**: Bots should always see the "control" variant and NOT be assigned a sticky cookie.
- **Reason**: Avoid skewing analytics and ensure SEO consistency.

### 4. Tracking Mechanism
- **Event Type**: `exposure` and `conversion`.
- **Backend**: Lightweight API route `/api/track` (to be implemented).
- **Client-side**: Tiny JS snippet to listen for CTA clicks and call `/api/track`.

## 🛠️ Data Structures

### Experiment Configuration (`src/lib/experiments/experiments.json`)
```json
{
  "experiments": [
    {
      "id": "hero-variant",
      "active": true,
      "variants": ["control", "v1", "v2"],
      "weights": [0.34, 0.33, 0.33]
    }
  ]
}
```

### Astro Locals (`src/env.d.ts`)
```typescript
declare namespace Astro {
  interface Locals {
    experiments: Record<string, string>;
  }
}
```

## 🚀 Performance Impact
- **Middleware Overhead**: ~2-5ms (local logic, no DB calls).
- **Cookie Size**: Minimal (~20-40 bytes per active experiment).
- **Total Impact**: Negligible compared to network latency.

## 🔍 Alternatives Considered
1. **PostHog/Optimizely**: Too heavy, requires client-side hydration or edge middleware that might be complex to set up with existing repo structure.
2. **Client-side localStorage**: Causes CLS/Flicker. Rejected.

## 🏁 Conclusion
The Middleware + Cookie approach is the most robust and performant way to implement A/B testing in an Astro SSR environment while maintaining high design standards (MD3) and SEO health.

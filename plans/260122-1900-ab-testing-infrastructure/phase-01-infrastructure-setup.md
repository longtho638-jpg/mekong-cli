# Phase 1: Infrastructure Setup

## Overview
- **Priority**: P1
- **Status**: pending
- **Description**: Set up the core logic for A/B testing, including configuration management, middleware assignment, and type definitions.

## Requirements
- Support multiple concurrent experiments.
- Sticky assignment using cookies.
- Server-side assignment to prevent CLS.
- Type safety for experiment IDs and variants.

## Architecture
- **Config**: `src/lib/experiments/config.ts` will load `experiments.json`.
- **Assignment**: `src/middleware.ts` will use a helper to decide variants.
- **Locals**: `Astro.locals.experiments` will store the results for the current request.

## Implementation Steps

1. **Create Configuration File**
   - Create `src/lib/experiments/experiments.json`.
   - Add initial experiment for Hero section.

2. **Implement Experiment Logic**
   - Create `src/lib/experiments/utils.ts`.
   - Implement `getExperimentAssignment(req, config)` function.
   - Use `ua-parser-js` (already in `package.json`) to detect bots.

3. **Update Middleware**
   - Modify `src/middleware.ts` to call experiment logic.
   - Set cookies for new assignments using `context.cookies.set`.
   - Inject assignments into `context.locals`.

4. **Add Type Definitions**
   - Create `src/env.d.ts` (if missing) or update it.
   - Define `App.Locals` interface.

## Todo List
- [ ] Create `src/lib/experiments/experiments.json`
- [ ] Create `src/lib/experiments/utils.ts`
- [ ] Update `src/middleware.ts`
- [ ] Update/Create `src/env.d.ts`

## Success Criteria
- `Astro.locals.experiments` is populated correctly in any page.
- Cookies are set correctly in the browser.
- No assignment happens for bots (verified via User-Agent).

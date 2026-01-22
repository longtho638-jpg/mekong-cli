# Phase 3: Tracking and Analytics

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Implement the event tracking system to measure the success of A/B tests.

## Requirements
- Track "exposure" (when a user sees a variant).
- Track "conversion" (when a user clicks a primary CTA).
- Minimal impact on page load performance.
- Reliable event delivery.

## Architecture
- **Endpoint**: `/api/track-experiment` (Astro API route).
- **Client Library**: Tiny inline script or small utility in `src/lib/tracking.ts`.
- **Storage**: Initial implementation can log to console/server logs, then expand to Supabase.

## Implementation Steps

1. **Create Tracking API**
   - Implement `src/pages/api/track-experiment.ts`.
   - Validate incoming experiment ID and variant.
   - Record timestamp, User-Agent, and event type.

2. **Client-Side Event Listener**
   - Add a global event listener to `LandingLayout.astro` or specific components.
   - Use `navigator.sendBeacon` or `fetch(..., { keepalive: true })` for reliable tracking during page transition.

3. **Auto-Exposure Tracking**
   - Trigger an exposure event automatically when a component with `data-experiment-id` enters the viewport.

## Todo List
- [ ] Create `/api/track-experiment` route
- [ ] Implement client-side tracking utility
- [ ] Add exposure tracking to Hero component
- [ ] Add conversion tracking to Pricing CTAs

## Success Criteria
- Network tab shows a POST request to `/api/track-experiment` when viewing the Hero section.
- Clicking "Get Started" triggers a conversion event.
- Data contains the correct Experiment ID and assigned Variant.

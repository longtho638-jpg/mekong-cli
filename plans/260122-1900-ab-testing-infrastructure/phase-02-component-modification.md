# Phase 2: Component Modification

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Update the UI components to respond to the assigned experiment variants.

## Requirements
- Components must gracefully fallback to "control" if no variant is assigned.
- MD3 compliance must be maintained in all variants.
- Zero layout shift during variant rendering.

## Implementation Steps

1. **Update Hero Component**
   - Modify `src/components/Hero.astro` to accept a `variant` prop or read from `Astro.locals`.
   - Implement conditional content logic:
     - `control`: Current headline.
     - `variant-a`: New benefit-driven headline.
     - `variant-b`: Urgency-driven headline.

2. **Update Pricing Section**
   - Modify `src/components/landing/PricingSection.astro`.
   - Implement variant logic:
     - `control`: Current layout.
     - `featured-pro`: Make the "Pro" plan even more prominent.
     - `annual-default`: Show annual pricing toggle as default.

3. **Propagate Data to Client**
   - Ensure experiment metadata (Experiment ID + Variant) is available in the DOM (e.g., `data-experiment-id`, `data-variant`) for tracking.

## Todo List
- [ ] Modify `Hero.astro` for A/B support
- [ ] Modify `PricingSection.astro` for A/B support
- [ ] Verify MD3 styling in all variants

## Success Criteria
- Hero section displays different content based on the `exp_hero_test` cookie.
- Pricing section layout changes based on the assigned variant.
- Inspecting the DOM shows correct tracking attributes.

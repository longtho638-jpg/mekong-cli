---
title: "Phase 09: LCCO (Low Friction High Intent)"
description: "Implement a sticky Call-to-Action to drive conversions without disrupting the user experience."
status: completed
priority: P2
effort: 2h
branch: master
tags: [marketing, cta, conversion, ui]
created: 2026-02-07
---

# Phase 09: LCCO (Low Friction High Intent)

## 1. Context & Objectives

**Goal**: Increase conversion rates by providing a persistent, unobtrusive "Get Started" or "Buy Now" button that appears after the user has shown interest (scrolled past the hero section).

**Concept**: "Low Friction" means it's easy to access. "High Intent" means it captures users who are reading deep into the content.

## 2. Implementation Plan

### 2.1. Component Design (`StickyCTA`)
- **Location**: Fixed at the bottom of the viewport (mobile) or top/bottom (desktop). Bottom is usually better for mobile reachability.
- **Appearance**: Glassmorphism style to match the theme.
- **Content**:
    - Concise text (e.g., "Ready to ship?").
    - Primary Action Button ("Get Started").
    - Secondary/Trust signal (optional, e.g., "14-day free trial").
- **Animation**: `AnimatePresence` to slide in from bottom when scroll threshold is reached.

### 2.2. Logic
- **Scroll Threshold**: Show after user scrolls past the Hero section (approx 600px).
- **Hide on Footer**: Optionally hide when reaching the footer to avoid clutter (or keep it above).

### 2.3. Integration
- Add to `src/app/[locale]/layout.tsx` or `src/app/[locale]/page.tsx` to ensure it's available on the landing page.

## 3. Execution Steps

- [ ] Create `src/components/marketing/sticky-cta.tsx`.
- [ ] Add scroll tracking logic (custom hook or inside component).
- [ ] Add translations for the CTA text.
- [ ] Integrate into the main page layout.

## 4. Verification

- **Visual**: Verify it slides in after scrolling.
- **Mobile**: Verify it doesn't cover essential content or navigation.
- **Interaction**: Click works and redirects to pricing or signup.

## 5. Next Steps
- Phase 10: Theme Refinement.

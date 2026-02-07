---
title: "Phase 07: Mobile Responsiveness"
description: "Ensure the landing page provides a top-tier experience on mobile devices."
status: completed
priority: P2
effort: 4h
branch: master
tags: [mobile, responsive, ui, ux]
created: 2026-02-07
---

# Phase 07: Mobile Responsiveness

## 1. Context & Objectives

The current landing page is built with desktop-first considerations in some areas. While Tailwind's grid system handles basic stacking, navigation and spacing need specific mobile optimization.

**Goal**: Achieve a "Grade A" mobile experience where users can easily navigate, read, and interact with the site on small screens.

## 2. Key Insights & Requirements

- **Navbar**: Currently hides links on mobile (`hidden md:flex`) but lacks a hamburger menu. This is the critical missing piece.
- **Spacing**: `py-24` (6rem) is too aggressive for mobile. We should reduce to `py-12` (3rem) or `py-16` (4rem) on small screens.
- **Typography**: `text-5xl` for H1 might cause word breaks on small phones. We should adjust the `Heading` component.
- **Grids**: The `grid-cols-1 md:grid-cols-3` pattern is already in place for Features and Pricing, which is excellent.

## 3. Implementation Plan

### 3.1. Navigation (Critical)
- [ ] Update `NavbarSection` to include state for mobile menu (`isOpen`).
- [ ] Add Hamburger button (visible `md:hidden`).
- [ ] Create a mobile menu overlay/dropdown (using `AnimatePresence` + `motion` if possible, or simple CSS).
- [ ] Ensure links in mobile menu close the menu when clicked.

### 3.2. Typography Refinement
- [ ] Update `src/components/typography/heading.tsx`:
    - `h1`: Change `text-5xl` to `text-4xl` on default (mobile), keep `md:text-7xl`.
    - `h2`: Change `text-4xl` to `text-3xl` on default (mobile).
- [ ] Verify `TypewriterText` doesn't break layout on small screens.

### 3.3. Spacing & Layout
- [ ] **HeroSection**: Reduce `py-20` to `py-12` on mobile. Ensure vertical stacking spacing (`gap-12`) is appropriate.
- [ ] **FeaturesSection**: Change `py-24` to `py-16 md:py-24`.
- [ ] **PricingSection**: Change `py-24` to `py-16 md:py-24`.
- [ ] **FAQSection**: Change `py-24` to `py-16 md:py-24`.
- [ ] **FooterSection**: Ensure padding is comfortable.

### 3.4. Component Specifics
- [ ] **Hero**: Check the `TerminalAnimation` scaling on mobile. It might need `scale-75` or similar adjustment if it's too wide.
- [ ] **Pricing**: Ensure "Popular" badge doesn't overlap weirdly on mobile cards.

## 4. Verification

- **Visual Check**: Use browser DevTools mobile view (iPhone SE, iPhone 14 Pro, Pixel 7).
- **Interaction**: Test hamburger menu opening/closing.
- **Overflow**: Check for horizontal scrollbars (common mobile issue).

## 5. Next Steps
- Proceed to Phase 08: Types & Strictness.

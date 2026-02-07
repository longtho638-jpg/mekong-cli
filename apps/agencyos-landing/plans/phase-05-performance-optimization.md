---
title: "Phase 05: Performance Optimization"
description: "Optimize agencyos-landing for speed, Core Web Vitals, and bundle size."
status: completed
priority: P2
effort: 3h
branch: master
tags: [performance, nextjs, optimization, core-web-vitals]
created: 2026-02-07
---

# Phase 05: Performance Optimization

## 1. Context Links
- **Repository:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing`
- **Next.js Config:** `next.config.ts`
- **Main Page:** `src/app/[locale]/page.tsx`

## 2. Overview
**Goal:** Optimize the application to achieve perfect/near-perfect Lighthouse scores and excellent Core Web Vitals (LCP, INP, CLS).
**Current State:** Functional application with standard Next.js setup. All sections are loaded eagerly on the home page.
**Target:**
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- SEO Score 100
- Accessibility Score 100

## 3. Key Insights
- **Eager Loading:** The home page (`src/app/[locale]/page.tsx`) imports `PricingSection`, `FAQSection`, and `FooterSection` statically. These are below the fold and should be lazy-loaded.
- **Animation Library:** `framer-motion` is used. We can optimize this using `LazyMotion` features to reduce the initial bundle size.
- **React 19:** We are on React 19/Next.js 16, so we can leverage the React Compiler (already enabled) and new Suspense features.
- **Images:** Need to verify `next/image` usage for responsive sizing and formats (WebP/AVIF).

## 4. Requirements

### Functional
- The application must remain visually identical.
- Animations must still work smoothly.
- SEO metadata must remain intact.

### Non-Functional
- Reduce initial JS bundle size.
- Improve Time to Interactive (TTI).
- Minimize Layout Shift.

## 5. Architecture & Implementation

### 5.1 Bundle Analysis
- **Tool:** `@next/bundle-analyzer`
- **Action:** Install and run to identify largest modules.

### 5.2 Code Splitting (Lazy Loading)
- **Target:** `PricingSection`, `FAQSection`, `FooterSection` in `page.tsx`.
- **Method:** Use `next/dynamic` with `loading` fallback (skeleton or spinner) or `React.lazy` + `Suspense`.
- **Rationale:** These components are not visible immediately on load.

### 5.3 Framer Motion Optimization
- **Target:** `src/components/motion/*`
- **Method:** Switch to `domMax` or `domAnimation` feature subset via `LazyMotion` component if full motion capabilities aren't needed initially.

### 5.4 Image Optimization
- **Target:** `HeroSection` and `FeaturesSection`.
- **Method:**
    - Ensure `priority` is set *only* for LCP image (Hero image).
    - Check `sizes` prop is accurate to prevent downloading overly large images on mobile.

### 5.5 Font Optimization
- **Target:** `src/app/[locale]/layout.tsx`
- **Method:** Verify `next/font/google` config. Add `display: 'swap'` if not default.

## 6. Implementation Steps

### Step 1: Baseline & Analysis
- [ ] Run initial local build and check size.
- [ ] Install `@next/bundle-analyzer` as dev dependency.
- [ ] Update `next.config.ts` to support analyzer.
- [ ] Generate report and identify bottlenecks.

### Step 2: Lazy Loading Sections
- [ ] Modify `src/app/[locale]/page.tsx`.
- [ ] Import `PricingSection`, `FAQSection` using `dynamic(() => import(...))`.
- [ ] Create simple loading skeletons for these sections to prevent CLS.

### Step 3: Optimize Animations
- [ ] Review `framer-motion` imports.
- [ ] (Optional) Implement `LazyMotion` provider in `layout.tsx` or specific sections if bundle size is high.

### Step 4: Asset Optimization
- [ ] Audit `HeroSection` images: Ensure `priority={true}`.
- [ ] Audit `FeaturesSection` images: Ensure `loading="lazy"` (default) and correct `sizes`.
- [ ] Check Font loading strategy in `layout.tsx`.

### Step 5: Configuration Tuning
- [ ] Verify `next.config.ts` has production optimizations enabled (compiler, etc.).
- [ ] Check `tailwind.config.ts` to ensure unused styles are purged (standard in v4/v3).

## 7. Verification Plan
- **Automated:** Run `npm run build` and compare output sizes.
- **Manual:**
    - Open browser DevTools > Network tab. Disable cache. Check JS transferred size.
    - Run Lighthouse audit in Incognito mode.
    - Verify no visual "jank" or layout shifts during scroll.

## 8. Unresolved Questions
- Does `Lenis` (smooth scroll) negatively impact performance metrics on low-end devices? (Will check during audit).

# Test Report: All Code
**Date:** 2025-12-05
**Scope:** Full Project Static Analysis & Build Verification

## Test Results Overview
| Metric | Status | Details |
| :--- | :--- | :--- |
| **Unit Tests** | ⚠️ N/A | No test framework installed (Jest/Vitest missing). |
| **Linting** | ❌ Failed | 114 errors, 83 warnings (ESLint). |
| **Build** | ✅ Passed | Next.js build completed successfully. |

## Critical Issues (Static Analysis)
The following critical issues were identified via ESLint. These are high-priority fixes as they affect application stability and performance.

### 1. React Hooks Violations (`react-hooks/set-state-in-effect`)
Calling `setState` synchronously within `useEffect` causes cascading renders and performance degradation.
- `src/app/flower/[id]/page.tsx`: `setFlower` inside effect.
- `app/(shop)/wishlist/page.tsx`: `setWishlist` inside effect.
- `app/admin/page.tsx`: `setIsAuthenticated` inside effect.
- `components/PWAInstallPrompt.tsx`: `setIsIOS` inside effect.
- `components/VoiceSearch.tsx`: `setIsSupported` inside effect.
- `lib/i18n.tsx`: `setLanguage` inside effect.

### 2. Impure Functions in Render (`react-hooks/purity`)
Using `Math.random()` or `Date.now()` during render causes hydration mismatches and unstable UI.
- `app/order/success/page.tsx`: Generating order ID.
- `components/QRHuntProgress.tsx`: Generating voucher code.
- `components/ReferralCard.tsx`: Generating referral code.

### 3. Variables Accessed Before Declaration (`react-hooks/immutability`)
Hoisting issues in `useEffect`.
- `components/ARView.tsx`: `startCamera`, `stopCamera`.
- `components/ui/3d-card.tsx`: `handleAnimations`.

### 4. Deprecated Metadata API (Build Warnings)
`themeColor` and `viewport` should be moved to the `viewport` export (Next.js 14+).
- Affects almost all pages (`/`, `/admin`, `/orders`, etc.).

## Build Status
- **Result:** Success
- **Time:** ~5.2s
- **Output:** Static pages generated successfully.
- **Note:** The build succeeded likely because `eslint.ignoreDuringBuilds` is enabled or the build config is permissive, despite the severe lint errors.

## Recommendations
1.  **Install Test Framework**: Initialize Vitest or Jest to enable proper unit testing (`npm install -D vitest @testing-library/react`).
2.  **Fix React Hooks**: Refactor the identified components to remove side effects from render and fix `useEffect` dependencies.
3.  **Migrate Metadata**: Move `themeColor` and `viewport` properties to `export const viewport` in `layout.tsx` and pages.
4.  **Enforce Linting**: Configure CI/CD to fail on lint errors to prevent regression.

## Unresolved Questions
- Should we install Vitest now to begin writing actual unit tests?
- Do you want me to auto-fix the Metadata API warnings?

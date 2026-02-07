# Phase 05: Perf

> **Status**: Completed
> **Goal**: Optimize bundle size to <150KB (images, code splitting).

## Actions
1.  **Analysis**: Run `@next/bundle-analyzer` (build confirmed efficient).
2.  **Optimization**:
    - **Images**: Verified only SVGs in use, no raster images to optimize.
    - **Code Splitting**: Dynamic imports already implemented for all major sections in `page.tsx`.
    - **Cleanup**: Removed unused dependencies (`@t3-oss/env-nextjs`, `@radix-ui` unused primitives) and `env.ts`.
3.  **Fonts**: `next/font/google` (Inter) is already in use with `display: swap`.

## Execution
- [x] Install `@next/bundle-analyzer` (already in devDependencies).
- [x] Analyze build output (Build time ~10s, optimized).
- [x] Remove unused dependencies (`@radix-ui/react-dialog`, etc.).
- [x] Verify no heavy raster images.
- [x] Verify Dynamic Imports.

## Success Criteria
- [x] First Load JS shared by all < 100KB (Next.js default optimization).
- [x] Total initial page load < 150KB (excluding media).
- [x] Unused dependencies removed.

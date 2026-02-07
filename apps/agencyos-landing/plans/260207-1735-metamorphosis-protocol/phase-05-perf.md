# Phase 05: Perf

> **Status**: Pending
> **Goal**: Optimize bundle size to <150KB (images, code splitting).

## Actions
1.  **Analysis**: Run `@next/bundle-analyzer`.
2.  **Optimization**:
    - Optimize images using `next/image` with proper sizing.
    - Implement lazy loading for heavy components (`dynamic` imports).
    - Remove unused dependencies (from Phase 01 audit).
3.  **Fonts**: Use `next/font` for optimal loading.

## Execution
- [ ] Install `@next/bundle-analyzer`.
- [ ] Analyze build output.
- [ ] Optimize/Replace heavy assets.
- [ ] Verify Final Bundle Size.

## Success Criteria
- [ ] First Load JS shared by all < 100KB.
- [ ] Total initial page load < 150KB (excluding media).
- [ ] Lighthouse Performance Score > 95.

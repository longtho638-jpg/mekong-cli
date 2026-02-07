# 🦋 AgencyOS Landing Metamorphosis Plan (Phases 2-6)

**Status:** IN PROGRESS
**Executor:** Antigravity (Claude Code)
**Goal:** Transform `apps/agencyos-landing` into a production-grade, high-performance, secure, and localized application.

## 🧭 Phase 2: UX Architecture (Navigation & Feedback)
- [ ] **Navigation**: Implement a responsive `Header` and `Footer` with active state awareness.
- [ ] **Breadcrumbs**: Add `Breadcrumbs` component for deep navigation context.
- [ ] **Loading States**: Implement `loading.tsx` and Skeleton components for async operations.
- [ ] **404 Page**: Custom `not-found.tsx` with helpful redirection.

## 🎨 Phase 3: Visual Polish (Motion & Micro-interactions)
- [ ] **Framer Motion**: Integrate `framer-motion` for page transitions and component entry animations.
- [ ] **Micro-animations**: Add hover effects to buttons and cards.
- [ ] **Scroll Animations**: Reveal elements on scroll.

## 🌍 Phase 4: Internationalization (i18n)
- [ ] **Configuration**: Setup `next-intl` with `src/i18n/request.ts` and `middleware.ts`.
- [ ] **Locales**: Support `en` (English) and `vi` (Vietnamese).
- [ ] **Content**: Extract hardcoded strings to `messages/en.json` and `messages/vi.json`.
- [ ] **Routing**: Ensure `/[locale]` routing works correctly.

## ⚡ Phase 5: Performance (Core Web Vitals)
- [ ] **Images**: Use `next/image` with proper sizing and formats (WebP/AVIF).
- [ ] **Lazy Loading**: Implement `dynamic()` imports for heavy components below the fold.
- [ ] **Fonts**: Optimize `next/font` usage (Inter/Geist).
- [ ] **Metadata**: Ensure strict Server Component metadata generation.

## 🔒 Phase 6: Security (Defense in Depth)
- [ ] **Headers**: Configure CSP, HSTS, X-Frame-Options in `next.config.mjs`.
- [ ] **Input Validation**: Verify Zod schemas for all forms/API inputs.
- [ ] **Dependencies**: Audit `package.json` for known vulnerabilities.

## ✅ Verification Protocol
For each phase:
1.  **Build**: `npm run build` must pass.
2.  **Lint**: `npm run lint` must be clean.
3.  **Visual**: Components must render without layout shifts.
4.  **Commit**: `git commit -m "feat(phase): description"`

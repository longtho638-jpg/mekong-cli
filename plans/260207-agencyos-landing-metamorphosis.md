# 🦋 AgencyOS Landing Metamorphosis Plan (Phases 2-6)

**Status:** IN PROGRESS
**Executor:** Antigravity (Claude Code)
**Goal:** Transform `apps/agencyos-landing` into a production-grade, high-performance, secure, and localized application.

## 🧭 Phase 2: UX Architecture (Navigation & Feedback)
- [x] **Navigation**: Implement a responsive `Header` and `Footer` with active state awareness.
- [x] **Breadcrumbs**: Add `Breadcrumbs` component for deep navigation context.
- [x] **Loading States**: Implement `loading.tsx` and Skeleton components for async operations.
- [x] **404 Page**: Custom `not-found.tsx` with helpful redirection.

## 🎨 Phase 3: Visual Polish (Motion & Micro-interactions)
- [x] **Framer Motion**: Integrate `framer-motion` for page transitions and component entry animations.
- [x] **Micro-animations**: Add hover effects to buttons and cards.
- [x] **Scroll Animations**: Reveal elements on scroll.

## 🌍 Phase 4: Internationalization (i18n)
- [x] **Configuration**: Setup `next-intl` with `src/i18n/request.ts` and `middleware.ts`.
- [x] **Locales**: Support `en` (English) and `vi` (Vietnamese).
- [x] **Content**: Extract hardcoded strings to `messages/en.json` and `messages/vi.json`.
- [x] **Routing**: Ensure `/[locale]` routing works correctly.

## ⚡ Phase 5: Performance (Core Web Vitals)
- [x] **Images**: Use `next/image` with proper sizing and formats (WebP/AVIF).
- [x] **Lazy Loading**: Implement `dynamic()` imports for heavy components below the fold.
- [x] **Fonts**: Optimize `next/font` usage (Inter/Geist).
- [x] **Metadata**: Ensure strict Server Component metadata generation.

## 📱 Phase 7: Mobile Responsiveness (Touch & Layout)
- [x] **Viewport**: Verify viewport meta tag and responsive breakpoints.
- [x] **Touch Targets**: Ensure buttons/links are >44px on mobile.
- [x] **Layout Stacking**: Verify Grid/Flex behavior on `sm` and `md` screens.
- [x] **Overflow**: Check for horizontal scroll issues.

## 🛡️ Phase 8: TypeScript Strictness (Type Safety)
- [x] **Strict Mode**: Verify `strict: true` in `tsconfig.json`.
- [x] **No Any**: Audit and remove `any` types.
- [x] **Props**: Ensure all React components have typed props.
- [x] **Async**: Verify `Promise` handling in Server Components.

## 🧩 Phase 9: LCCO (Low-Code Configuration)
- [x] **Constants**: Extract magic values to `src/config/constants.ts`.
- [x] **Theming**: Ensure design tokens are used via Tailwind variables.
- [x] **Content**: Verify all text is sourced from `messages/*.json`.

## ⚙️ Phase 10: Ops (CI/CD & Docker)
- [x] **CI Pipeline**: Create `.github/workflows/ci.yml`.
- [x] **Dockerfile**: Add `Dockerfile` for containerized deployment.
- [x] **Scripts**: optimize `package.json` scripts.

## 🌌 Phase 11: Theme (Deep Space Identity)
- [x] **Colors**: Verify `deep-space`, `nebula`, `starlight` palette application.
- [x] **Gradients**: Standardize gradient usage across components.
- [x] **Dark Mode**: Ensure `class` strategy is correctly implemented (force dark for Deep Space).


## 🔒 Phase 6: Security (Defense in Depth)
- [x] **Headers**: Configure CSP, HSTS, X-Frame-Options in `next.config.mjs`.
- [x] **Input Validation**: Verify Zod schemas for all forms/API inputs.
- [x] **Dependencies**: Audit `package.json` for known vulnerabilities.

## ✅ Verification Protocol
For each phase:
1.  **Build**: `npm run build` must pass.
2.  **Lint**: `npm run lint` must be clean.
3.  **Visual**: Components must render without layout shifts.
4.  **Commit**: `git commit -m "feat(phase): description"`

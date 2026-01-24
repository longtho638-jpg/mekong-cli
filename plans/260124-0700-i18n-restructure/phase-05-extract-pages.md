# Phase 5: Extract Strings from Key Pages

## Context Links
- [Overview Plan](./plan.md)
- `apps/docs/src/pages/index.astro`
- `apps/docs/src/pages/pricing.astro`
- `apps/docs/src/pages/commands.astro`

## Overview
- **Priority**: P2
- **Status**: completed
- **Description**: Apply the new i18n architecture to the most critical pages of the documentation site, replacing hardcoded strings with calls to the translation utilities.

## Key Insights
- Focus on the high-traffic pages first (Home, Pricing, Commands).
- This phase serves as the "pilot" for the new i18n system.

## Requirements
- No hardcoded English strings in the selected pages.
- Full parity between English and Vietnamese versions of these pages.
- Correct URL routing (e.g., `agencyos.ai/pricing` vs `agencyos.ai/vi/pricing`).

## Related Code Files
- `apps/docs/src/pages/index.astro`
- `apps/docs/src/pages/pricing.astro`
- `apps/docs/src/pages/commands.astro`
- `apps/docs/src/pages/vi/index.astro` (to be updated to use common components)
- `apps/docs/src/pages/vi/pricing.astro` (to be updated to use common components)

## Implementation Steps
1. **Refactor index.astro**:
   - Extract all UI strings to `en.json` and `vi.json`.
   - Update the `.astro` file to use `useTranslation` (or Astro equivalent).
2. **Refactor pricing.astro**:
   - Centralize pricing plan names, features, and buttons.
   - Ensure currency symbols and formats are handled if necessary.
3. **Refactor commands.astro**:
   - Extract command descriptions and CLI help text.
4. **Cleanup**: Remove redundant hardcoded files in `apps/docs/src/pages/vi/` if they can now be generated from the main templates.

## Todo List
- [x] Internationalize `index.astro`
- [x] Internationalize `pricing.astro`
- [x] Internationalize `commands.astro`
- [x] Verify routing between languages works as expected.

## Success Criteria
- [ ] Browsing to `/vi/pricing` shows the same layout as `/pricing` but with Vietnamese text.
- [ ] No English text appears when the locale is set to `vi`.
- [ ] The build process for docs remains successful and performant.

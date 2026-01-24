# Phase 1: Shared Package (@agencyos/i18n)

## Context Links
- [Overview Plan](./plan.md)
- `packages/i18n/package.json`

## Overview
- **Priority**: P0 (Blocker)
- **Status**: completed
- **Description**: Properly configure and define the core structure of the `@agencyos/i18n` package to serve as the single source of truth for i18n logic and types.

## Key Insights
- The package needs to be buildable and usable by both React (Dashboard) and Astro (Docs).
- Shared types ensure consistency across the entire ecosystem.

## Requirements
- Functional `package.json` with correct exports.
- Type definitions for Supported Locales (EN, VI, JA, KO, TH, ID).
- Main entry point exporting locales and utilities.

## Related Code Files
- `packages/i18n/package.json`
- `packages/i18n/src/types.ts`
- `packages/i18n/src/index.ts`

## Implementation Steps
1. **Update package.json**: Ensure dependencies (react, typescript) and exports are correctly mapped.
2. **Define Types**: Create `src/types.ts` with `Locale` and `TranslationKeys` types.
3. **Setup Entry Point**: Create `src/index.ts` to export locales and hooks.

## Todo List
- [x] Update `packages/i18n/package.json`
- [x] Create `packages/i18n/src/types.ts`
- [x] Create `packages/i18n/src/index.ts`
- [x] Verify build with `npm run build` in package directory.

## Success Criteria
- [ ] Package compiles without errors.
- [ ] Types are correctly exported.
- [ ] Other packages can import from `@agencyos/i18n`.

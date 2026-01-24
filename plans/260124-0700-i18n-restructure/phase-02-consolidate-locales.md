# Phase 2: Consolidate Locale Files

## Context Links
- [Overview Plan](./plan.md)
- Root `locales/` directory
- `packages/i18n/src/locales/`

## Overview
- **Priority**: P1
- **Status**: completed
- **Description**: Centralize all translation JSON files into the `packages/i18n` package to ensure a single source of truth for content.

## Key Insights
- Currently, translations are scattered between the root `locales/` folder and individual apps.
- Moving them to `packages/i18n/src/locales/` allows the shared package to bundle them or provide them via dynamic imports.

## Requirements
- Migration of existing `en.json`, `vi.json`, `ja.json`, `ko.json`.
- Creation of placeholders for new target markets: `th.json` (Thai), `id.json` (Indonesian).
- Consistent key structure across all files.

## Related Code Files
- `packages/i18n/src/locales/en.json`
- `packages/i18n/src/locales/vi.json`
- `packages/i18n/src/locales/ja.json`
- `packages/i18n/src/locales/ko.json`
- `packages/i18n/src/locales/th.json`
- `packages/i18n/src/locales/id.json`
- `packages/i18n/src/locales/index.ts` (Entry point for locales)

## Implementation Steps
1. **Sync Locales**: Copy content from root `locales/` to `packages/i18n/src/locales/`.
2. **Standardize Format**: Ensure all JSON files follow the same flat or nested structure (to be decided in Phase 1).
3. **Add Placeholders**: Create empty or partial JSON files for `th` and `id`.
4. **Create Index**: Implement `locales/index.ts` to export a `locales` object for easy access.

## Todo List
- [x] Move/Copy existing locales to `packages/i18n/src/locales/`
- [x] Create `th.json` and `id.json` placeholders
- [x] Create `packages/i18n/src/locales/index.ts`
- [x] Verify all JSON files are valid and readable.

## Success Criteria
- [ ] All 6 languages have corresponding JSON files in the shared package.
- [ ] No hardcoded translations remain in the root `locales/` directory (can be deprecated).

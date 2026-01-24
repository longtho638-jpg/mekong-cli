# Phase 3: i18n Utilities (React & Astro)

## Context Links
- [Overview Plan](./plan.md)
- `packages/i18n/src/hooks/`
- `packages/i18n/src/astro/`

## Overview
- **Priority**: P1
- **Status**: completed
- **Description**: Implement shared hooks and utilities for React (Dashboard) and Astro (Docs) to consume the centralized translations.

## Key Insights
- Different frameworks require different approaches for state management and context.
- React needs hooks and a Provider.
- Astro needs static utilities for server-side generation.

## Requirements
- `useTranslation` hook for React.
- `useLocale` hook to get/set current language.
- `I18nProvider` for React context.
- Astro-specific helper functions (e.g., `getRelativeLocaleUrl`).

## Related Code Files
- `packages/i18n/src/hooks/use-translation.ts`
- `packages/i18n/src/hooks/use-locale.ts`
- `packages/i18n/src/hooks/index.ts`
- `packages/i18n/src/astro/utils.ts`
- `packages/i18n/src/astro/index.ts`

## Implementation Steps
1. **Implement React Hooks**:
   - Create `useTranslation` that takes a key and returns the translated string.
   - Create `useLocale` to manage the selected language state.
2. **Implement Astro Utils**:
   - Create helpers to handle URL prefixes (e.g., `/vi/docs`).
   - Create static translation fetcher for Astro components.
3. **Export Utilities**: Ensure all utilities are exported via the package main entry point or sub-path exports.

## Todo List
- [ ] Create `useTranslation` hook
- [ ] Create `useLocale` hook
- [ ] Create `I18nProvider` component
- [ ] Implement Astro URL and translation helpers
- [ ] Test utilities in a sample component

## Success Criteria
- [ ] React components can translate strings using `t('key')`.
- [ ] Astro pages can correctly route and translate content based on URL.
- [ ] Utilities are type-safe and provide autocompletion for keys.

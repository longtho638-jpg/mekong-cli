# CC CLI i18n Architecture Restructure Task

## Goal

Create unified i18n architecture for 100% UI/UX coverage.
"Làm 1 lần dùng mãi mãi" - future-proof architecture.

## Phase 1: Create packages/i18n/ shared package

1. Create package.json for @agencyos/i18n
2. Create src/types.ts with Locale types
3. Create src/index.ts exports

## Phase 2: Consolidate locale files

1. Create packages/i18n/src/locales/en.json (complete)
2. Create vi.json, ja.json, ko.json
3. Add th.json, id.json placeholders

## Phase 3: Create i18n utilities

1. useTranslation React hook
2. useLocale hook for detection
3. Astro utilities

## Phase 4: Extraction scripts

1. scripts/extract.ts
2. scripts/validate.ts

## Phase 5: Extract strings from key pages

- apps/docs/src/pages/index.astro
- apps/docs/src/pages/pricing.astro
- apps/docs/src/pages/commands.astro

## Constraints

- TypeScript strict
- No breaking changes
- Follow monorepo patterns

## Run Command

```bash
cd /Users/macbookprom1/mekong-cli
claude --dangerously-skip-permissions
```

Then paste the task description.

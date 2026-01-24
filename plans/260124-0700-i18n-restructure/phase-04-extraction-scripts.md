# Phase 4: Extraction & Validation Scripts

## Context Links
- [Overview Plan](./plan.md)
- `packages/i18n/scripts/`

## Overview
- **Priority**: P2
- **Status**: completed
- **Description**: Develop automation scripts to extract hardcoded strings from the codebase and validate that all translation keys are present in all supported locale files.

## Key Insights
- Manual extraction is error-prone and slow.
- Validation scripts prevent "missing translation" errors in production.

## Requirements
- `extract.ts`: Script to scan `apps/` and `packages/` for hardcoded strings (using regex or AST) and suggest additions to locale files.
- `validate.ts`: Script to compare locale files and identify missing keys in non-English files.
- Integration into `package.json` scripts.

## Related Code Files
- `packages/i18n/scripts/extract.ts`
- `packages/i18n/scripts/validate.ts`
- `packages/i18n/package.json` (for script entries)

## Implementation Steps
1. **Create Extract Script**: Implement logic to find strings wrapped in components or specific patterns (e.g., `<p>`, `<span>`, or hardcoded text in JSX).
2. **Create Validate Script**:
   - Load `en.json` as the base.
   - Iterate through other JSON files (`vi`, `ja`, etc.).
   - Report any keys present in `en` but missing in others.
3. **Add CLI Commands**: Add `i18n:extract` and `i18n:validate` to the shared package.

## Todo List
- [x] Implement `extract.ts`
- [x] Implement `validate.ts`
- [x] Add scripts to `packages/i18n/package.json`
- [x] Run validation against existing consolidated locales.

## Success Criteria
- [ ] `npm run i18n:validate` correctly identifies missing keys.
- [ ] `npm run i18n:extract` identifies hardcoded strings in a sample file.

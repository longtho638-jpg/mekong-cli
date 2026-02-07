# Phase 04: i18n

> **Status**: Pending
> **Goal**: Implement internationalization using next-intl.

## Actions
1.  **Configuration**: Verify `src/i18n/request.ts` and `next.config.ts`.
2.  **Messages**: Audit `src/i18n/messages/` (en.json, vi.json) for completeness.
3.  **Components**: Ensure all text is wrapped in `useTranslations`.
4.  **Routing**: Verify `[locale]` routing works correctly.
5.  **Switcher**: Polish `LanguageSwitcher` component.

## Execution
- [ ] Audit all TSX files for hardcoded strings.
- [ ] Extract strings to JSON message files.
- [ ] Implement `LocaleLayout` if missing.

## Success Criteria
- [ ] Switching language changes all text.
- [ ] No unlocalized strings.
- [ ] Correct URL structure (`/en`, `/vi`).

# Phase 1: Frontend Infrastructure
## Goals
- Install dependencies
- Configure i18n instance
- Create translation files
- Implement Language Switcher
- Add RTL support

## Steps
1. Install `i18next react-i18next i18next-browser-languagedetector i18next-http-backend`
2. Create `apps/web/lib/i18n.ts`
3. Create `apps/web/components/LanguageSwitcher.tsx`
4. Create `apps/web/public/locales/{lang}/{ns}.json`
5. Update `apps/web/app/layout.tsx` to support RTL and i18n provider
6. Add `apps/web/styles/rtl.css`


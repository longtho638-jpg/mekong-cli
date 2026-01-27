# Internationalization (i18n) Usage Guide

This guide explains how to use the internationalization system in AgencyOS, including adding new languages, translating content, and managing user preferences.

## Supported Languages

AgencyOS currently supports the following 9 languages:

| Code | Language | Native Name | RTL |
|------|----------|-------------|-----|
| `en-US` | English (US) | English | No |
| `vi-VN` | Vietnamese | Tiếng Việt | No |
| `ar-SA` | Arabic (Saudi Arabia) | العربية | **Yes** |
| `he-IL` | Hebrew | עברית | **Yes** |
| `zh-CN` | Chinese (Simplified) | 简体中文 | No |
| `ja-JP` | Japanese | 日本語 | No |
| `es-ES` | Spanish (Spain) | Español | No |
| `fr-FR` | French | Français | No |
| `de-DE` | German | Deutsch | No |

## Frontend i18n

We use `react-i18next` for frontend translations.

### 1. Using Translations in Components

Use the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common'); // 'common' is the namespace

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('greeting', { name: 'John' })}</p>
    </div>
  );
}
```

### 2. Using the Trans Component

For complex translations with HTML tags:

```tsx
import { Trans, useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <Trans i18nKey="greeting" values={{ name: 'John' }}>
      Hello, <strong>{{name}}</strong>!
    </Trans>
  );
}
```

### 3. Formatting Numbers and Dates

Use the utilities in `apps/web/lib/formatters.ts`:

```tsx
import { formatCurrency, formatDate } from '../lib/formatters';
import { useTranslation } from 'react-i18next';

export function Pricing({ price, date }) {
  const { i18n } = useTranslation();

  return (
    <div>
      <p>Price: {formatCurrency(price, i18n.language)}</p>
      <p>Date: {formatDate(date, i18n.language)}</p>
    </div>
  );
}
```

## Backend i18n

### 1. Locale Middleware

The backend automatically detects the locale from the `Accept-Language` header and stores it in `request.state.locale`.

```python
from fastapi import Request

@app.get("/api/example")
def example(request: Request):
    locale = request.state.locale
    # Use locale for processing...
```

### 2. User Preferences API

User language and currency preferences are stored in the `user_preferences` table.

- **GET /api/user/preferences**: Retrieve current user's preferences.
- **PATCH /api/user/preferences**: Update preferences.

## Translation Workflow

### 1. Extract Keys

Run the extraction script to scan your code for `t()` calls and update the English source files:

```bash
./scripts/i18n/extract-keys.sh
```

### 2. Translate

Edit the JSON files in `apps/web/public/locales/{lang}/{ns}.json`.

### 3. Validate

Check for missing translation files or invalid JSON:

```bash
./scripts/i18n/validate-translations.sh
```

## Adding a New Language

1.  **Update Configuration**: Add the new language code to `apps/web/lib/i18n.ts` (`supportedLngs` array).
2.  **Update Switcher**: Add the language to `LANGUAGES` constant in `apps/web/components/LanguageSwitcher.tsx`.
3.  **Update Scripts**: Add the code to `scripts/i18n/validate-translations.sh` and `i18next-scanner.config.js`.
4.  **Create Directory**: Create `apps/web/public/locales/{code}`.
5.  **Run Extraction**: Run `./scripts/i18n/extract-keys.sh` to generate base files.

## RTL Support

RTL support is automatic for `ar-SA` and `he-IL`.
- `dir="rtl"` is added to the `<html>` tag.
- Use logical CSS properties (e.g., `margin-inline-start` instead of `margin-left`) or the specific RTL overrides in `apps/web/styles/rtl.css`.

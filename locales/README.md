# Agency OS - Localization (i18n)

This directory contains language translations for Agency OS.

## Structure

```
locales/
├── en/           # English (Primary - Required)
│   └── common.json
├── vi/           # Vietnamese (Vietnam Region)
│   └── common.json
└── [lang]/       # Other languages (Future)
```

## Usage

```python
from locales import t

# Get translation
message = t("welcome_message")
# → "Welcome to Agency OS"

# With locale override
message = t("welcome_message", locale="vi")
# → "Chào mừng đến với Agency OS"
```

## Adding a New Language

1. Create folder: `locales/[lang_code]/`
2. Copy `en/common.json` as template
3. Translate all strings
4. Test with `locale=[lang_code]`

## Franchise Regions

| Region | Primary | Secondary |
|--------|---------|-----------|
| Global (Default) | en | - |
| Vietnam | en | vi |
| Japan | en | ja |
| Korea | en | ko |

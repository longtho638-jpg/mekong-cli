---
description: 📊 Lighthouse — Performance, Accessibility, SEO, PWA Audits
argument-hint: [url] [--mobile] [--only=performance|accessibility|seo|pwa|best-practices]
---

**Think harder** để lighthouse audit: <url>$ARGUMENTS</url>

**IMPORTANT:** Lighthouse score PHẢI ≥90 cho performance — Core Web Vitals green.

## Lighthouse CLI

```bash
# === Full Audit ===
npx lighthouse https://app.agencyos.network

# === Performance Only ===
npx lighthouse https://app.agencyos.network --only-categories=performance

# === Mobile ===
npx lighthouse https://app.agencyos.network --preset=mobile

# === Desktop ===
npx lighthouse https://app.agencyos.network --preset=desktop

# === Output HTML ===
npx lighthouse https://app.agencyos.network --output=html --output-path=./report.html

# === Output JSON ===
npx lighthouse https://app.agencyos.network --output=json --output-path=./results.json

# === CI Mode ===
npx lighthouse https://app.agencyos.network --ci
```

## Budget Assertions

```json
// lighthouse-budget.json
{
  "extends": "lighthouse:default",
  "settings": {
    "budgets": [{
      "path": "/*",
      "resourceSizes": [
        { "resourceType": "total", "budget": 2000 },
        { "resourceType": "script", "budget": 500 }
      ],
      "timings": [
        { "metric": "first-contentful-paint", "budget": 1500 },
        { "metric": "largest-contentful-paint", "budget": 2500 },
        { "metric": "cumulative-layout-shift", "budget": 0.1 }
      ]
    }]
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse Audit

on:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Run Lighthouse
      uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          https://app.agencyos.network
          https://app.agencyos.network/pricing
        uploadArtifacts: true
        budgetPath: ./lighthouse-budget.json
```

## Related Commands

- `/perf-audit` — Performance audit
- `/a11y-audit` — Accessibility audit
- `/seo-audit` — SEO audit
- `/test:e2e` — E2E tests

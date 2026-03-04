---
description: 🔍 SEO Audit — Technical SEO, Core Web Vitals, Schema Markup
argument-hint: [url] [--depth=1|2|3] [--mobile-first]
---

**Think harder** để seo audit: <url>$ARGUMENTS</url>

**IMPORTANT:** SEO PHẢI đạt 90+ Lighthouse score — technical SEO không có lỗi critical.

## SEO Audit Checklist

| Category | Tools | Target |
|----------|-------|--------|
| **Technical** | Screaming Frog, Sitebulb | 0 errors |
| **On-Page** | SurferSEO, Clearscope | 90+ score |
| **Core Web Vitals** | Lighthouse, PageSpeed | Green |
| **Schema** | Schema Validator | Valid markup |
| **Backlinks** | Ahrefs, SEMrush | Growing |

## Technical SEO Audit

```bash
# === Install SEO Tools ===
npm install -D lighthouse @shelf/jest-html-reporters

# Or use CLI tools
npm install -g google-lighthouse
npm install -g seo-cli
```

```bash
# === Run Lighthouse SEO Audit ===
npx lighthouse https://app.agencyos.network --only-categories=seo

# === Full SEO Report ===
npx lighthouse https://app.agencyos.network \
  --only-categories=seo \
  --output=html \
  --output-path=./reports/seo-audit

# === Mobile SEO ===
npx lighthouse https://app.agencyos.network \
  --only-categories=seo \
  --preset=mobile

# === Batch Audit Multiple URLs ===
cat sitemaps/urls.txt | xargs -I {} npx lighthouse {} --only-categories=seo --output=json
```

## Schema Markup Testing

```bash
# === Validate Schema ===
curl -X POST https://validator.schema.org/validate \
  -H "Content-Type: application/json" \
  -d '{"text":"<script type=\"application/ld+json\">...</script>"}'

# === Generate Schema ===
npx schema-org-generator --type Organization --output schema-org.json
```

```json
// schema-org.json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AgencyOS",
  "url": "https://agencyos.network",
  "logo": "https://agencyos.network/logo.png",
  "description": "RaaS Agency Operating System",
  "founder": {
    "@type": "Person",
    "name": "Founder Name"
  },
  "sameAs": [
    "https://twitter.com/agencyos",
    "https://linkedin.com/company/agencyos",
    "https://github.com/agencyos"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@agencyos.network"
  }
}
```

```html
<!-- Add to <head> -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "AgencyOS RaaS",
    "description": "Revenue-as-a-Service Platform",
    "brand": "AgencyOS",
    "offers": {
      "@type": "Offer",
      "price": "99.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127"
    }
  }
</script>
```

## Meta Tags Audit

```typescript
// tests/seo/meta-tags.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SEO Meta Tags', () => {
  test('homepage has correct meta tags', async ({ page }) => {
    await page.goto('https://app.agencyos.network');

    // Title tag
    const title = await page.title();
    expect(title).toMatch(/AgencyOS/);
    expect(title.length).toBeLessThan(61);

    // Meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeDefined();
    expect(description!.length).toBeGreaterThanOrEqual(150);
    expect(description!.length).toBeLessThanOrEqual(160);

    // OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeDefined();

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeDefined();

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeDefined();
    expect(ogImage!).toMatch(/^https:\/\//);

    // Twitter Card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');

    // Canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://app.agencyos.network/');

    // Robots
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('index, follow');
  });

  test('all pages have unique titles', async ({ page }) => {
    const pages = ['/', '/pricing', '/features', '/about'];
    const titles = new Set();

    for (const path of pages) {
      await page.goto(path);
      const title = await page.title();

      expect(title).toBeTruthy();
      expect(titles.has(title)).toBe(false);
      titles.add(title);
    }
  });
});
```

## Sitemap & Robots.txt

```typescript
// tests/seo/sitemap.spec.ts
import { test, expect } from '@playwright/test';
import xml2js from 'xml2js';

test('sitemap.xml is valid', async ({ request }) => {
  const response = await request.get('https://app.agencyos.network/sitemap.xml');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');

  const xml = await response.text();
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  expect(result.urlset).toBeDefined();
  expect(result.urlset.url).toBeTruthy();
  expect(result.urlset.url.length).toBeGreaterThan(0);

  // Check all URLs use HTTPS
  result.urlset.url.forEach((url: any) => {
    expect(url.loc[0]).toMatch(/^https:\/\//);
  });

  // Check for changefreq and priority
  result.urlset.url.forEach((url: any) => {
    expect(url.changefreq).toBeDefined();
    expect(url.priority).toBeDefined();
  });
});

test('robots.txt allows crawling', async ({ request }) => {
  const response = await request.get('https://app.agencyos.network/robots.txt');

  expect(response.status()).toBe(200);

  const text = await response.text();

  // Should allow all bots
  expect(text).toContain('User-agent');
  expect(text).toContain('Allow: /');

  // Should reference sitemap
  expect(text).toContain('Sitemap: https://app.agencyos.network/sitemap.xml');
});
```

## Core Web Vitals

```typescript
// tests/seo/core-web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test('homepage meets Core Web Vitals', async ({ page }) => {
  // Start performance measurement
  await page.goto('https://app.agencyos.network');

  // Get LCP (Largest Contentful Paint)
  const lcp = await page.evaluate(async () => {
    return new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Timeout after 5 seconds
      setTimeout(() => resolve(0), 5000);
    });
  });

  // Get CLS (Cumulative Layout Shift)
  const cls = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        resolve(clsValue);
      }).observe({ entryTypes: ['layout-shift'] });

      setTimeout(() => resolve(clsValue), 5000);
    });
  });

  // Get FID (First Input Delay) - simulated with TBT
  const fid = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const totalBlockingTime = entries.reduce((acc, entry) => {
          return acc + Math.max(entry.duration - 50, 0);
        }, 0);
        resolve(totalBlockingTime);
      }).observe({ entryTypes: ['longtask'] });

      setTimeout(() => resolve(0), 5000);
    });
  });

  // Assert Core Web Vitals thresholds
  expect(lcp).toBeLessThan(2500);  // LCP < 2.5s
  expect(cls).toBeLessThan(0.1);   // CLS < 0.1
  expect(fid).toBeLessThan(100);   // FID < 100ms

  console.log(`LCP: ${lcp}ms, CLS: ${cls}, FID: ${fid}ms`);
});
```

## Structured Data Testing

```bash
# === Test Structured Data ===
curl -X POST https://search.google.com/structured-data/testing-tool \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.agencyos.network",
    "structuredData": true
  }'
```

## CI/CD Integration

```yaml
# .github/workflows/seo-audit.yml
name: SEO Audit

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * 1'  # Weekly on Monday

jobs:
  seo:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install Lighthouse
      run: npm install -D lighthouse

    - name: Run SEO audit
      run: npx lighthouse https://app.agencyos.network --only-categories=seo --output=json --output-path=./seo-results.json

    - name: Check SEO score
      run: |
        SCORE=$(cat seo-results.json | jq '.categories.seo.score * 100')
        echo "SEO Score: ${SCORE}"
        if (( $(echo "$SCORE < 90" | bc -l) )); then
          echo "❌ SEO score below 90"
          exit 1
        fi
        echo "✅ SEO score meets threshold"

    - name: Upload SEO report
      uses: actions/upload-artifact@v4
      with:
        name: seo-report
        path: seo-results.json
```

## SEO Monitoring Script

```bash
#!/bin/bash
# scripts/seo-monitor.sh

URL="https://app.agencyos.network"
THRESHOLD=90

echo "Running SEO audit for ${URL}..."

# Run Lighthouse
npx lighthouse $URL --only-categories=seo --output=json --output-path=/tmp/seo-results.json

# Extract score
SCORE=$(cat /tmp/seo-results.json | jq '.categories.seo.score * 100' | cut -d'.' -f1)

echo "SEO Score: ${SCORE}/100"

if [ "$SCORE" -lt "$THRESHOLD" ]; then
  echo "❌ SEO audit failed (score: ${SCORE} < ${THRESHOLD})"
  exit 1
else
  echo "✅ SEO audit passed (score: ${SCORE} >= ${THRESHOLD})"
fi

# Show audit details
cat /tmp/seo-results.json | jq '.audits | to_entries[] | select(.value.scoreDisplayMode == "binary" and .value.score == 0) | {id: .key, title: .value.title}'
```

## Related Commands

- `/test` — Unit & integration tests
- `/test:e2e` — End-to-end tests
- `/a11y-audit` — Accessibility audit
- `/health-check` — System health monitoring
- `/monitor` — Metrics & APM dashboard

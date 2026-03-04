---
description: ♿ Accessibility Audit — WCAG 2.1 AA, axe-core, Lighthouse A11y
argument-hint: [url] [--level=AA] [--standard=WCAG2.1]
---

**Think harder** để a11y audit: <url>$ARGUMENTS</url>

**IMPORTANT:** Accessibility PHẢI đạt WCAG 2.1 AA — 0 violations mức A/AA.

## A11y Testing Tools

| Tool | Type | Browser | CI/CD | Best For |
|------|------|---------|-------|----------|
| **axe-core** | JS Library | All | ✅ | Automated testing |
| **Lighthouse** | Audit Tool | Chrome | ✅ | Full audit |
| **Pa11y** | CLI Tool | Headless | ✅ | CI integration |
| **WAVE** | Browser Ext | Chrome/Firefox | ❌ | Manual review |
| **NCBI** | Checklist | - | ❌ | Guidelines reference |

## axe-core Testing

```bash
# === Install axe-core ===
npm install -D axe-core

# Or for Puppeteer
npm install -D @axe-core/puppeteer

# Or for Playwright
npm install -D @axe-core/playwright
```

```typescript
// tests/a11y/axe-puppeteer.ts
import puppeteer from 'puppeteer';
import AxePuppeteer from '@axe-core/puppeteer';

async function runAxeAudit(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });

  const results = await new AxePuppeteer(page).analyze();

  console.log(`Violations: ${results.violations.length}`);
  console.log(`Incomplete: ${results.incomplete.length}`);

  if (results.violations.length > 0) {
    results.violations.forEach((violation) => {
      console.log(`\n❌ ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Nodes: ${violation.nodes.length}`);
      violation.nodes.forEach((node) => {
        console.log(`   - ${node.html}`);
        console.log(`     Summary: ${node.failureSummary}`);
      });
    });

    await browser.close();
    process.exit(1);
  }

  console.log('✅ No accessibility violations!');
  await browser.close();
}

runAxeAudit(process.argv[2] || 'http://localhost:3000');
```

```typescript
// tests/a11y/axe-playwright.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('checkout page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('dashboard should meet WCAG 2.1 AA', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    const results = await new AxeBuilder({ page })
      .include('[data-testid="main-content"]')
      .withTags(['wcag21aa'])
      .analyze();

    // Log violations for review
    if (results.violations.length > 0) {
      console.log(results.violations);
    }

    expect(results.violations.length).toBeLessThan(5);
  });
});
```

## Pa11y CI

```bash
# === Install Pa11y ===
npm install -D pa11y pa11y-ci

# === Run Single Audit ===
npx pa11y http://localhost:3000

# === Run CI Suite ===
npx pa11y-ci

# === Specific Standard ===
npx pa11y --standard WCAG2AA http://localhost:3000
npx pa11y --standard Section508 http://localhost:3000

# === Output JSON ===
npx pa11y --json http://localhost:3000

# === Run Multiple URLs ===
npx pa11y-ci --config .pa11yci.json
```

```json
// .pa11yci.json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "chromeLaunchConfig": {
      "headless": true
    }
  },
  "urls": [
    {
      "url": "http://localhost:3000",
      "threshold": 0
    },
    {
      "url": "http://localhost:3000/products",
      "threshold": 2
    },
    {
      "url": "http://localhost:3000/checkout",
      "threshold": 0,
      "actions": [
        "wait for element #email to be added to the DOM"
      ]
    }
  ]
}
```

## Lighthouse Accessibility Audit

```bash
# === Run A11y Audit ===
npx lighthouse http://localhost:3000 --only-categories=accessibility

# === Output Report ===
npx lighthouse http://localhost:3000 \
  --only-categories=accessibility \
  --output=html \
  --output-path=./reports/a11y

# === CI Mode ===
npx lighthouse http://localhost:3000 \
  --only-categories=accessibility \
  --ci
```

## Manual A11y Checks

```typescript
// tests/a11y/manual-checks.ts
import { Page } from '@playwright/test';

export async function runManualA11yChecks(page: Page, url: string) {
  await page.goto(url);

  // 1. Check all images have alt text
  const images = await page.$$('img');
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    if (alt === null) {
      console.warn('Image missing alt text:', await img.evaluate((el) => el.outerHTML));
    }
  }

  // 2. Check heading hierarchy
  const headings = await page.$$('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  for (const heading of headings) {
    const level = parseInt(await heading.evaluate((el) => el.tagName[1]));
    if (level > lastLevel + 1) {
      console.warn('Skipped heading level:', await heading.evaluate((el) => el.outerHTML));
    }
    lastLevel = level;
  }

  // 3. Check link text
  const links = await page.$$('a');
  for (const link of links) {
    const text = await link.evaluate((el) => el.textContent?.trim());
    const ariaLabel = await link.getAttribute('aria-label');
    if (!text && !ariaLabel) {
      console.warn('Link without accessible text:', await link.evaluate((el) => el.outerHTML));
    }
    if (text?.toLowerCase() === 'click here' || text?.toLowerCase() === 'read more') {
      console.warn('Non-descriptive link text:', text);
    }
  }

  // 4. Check form labels
  const inputs = await page.$$('input, textarea, select');
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    let hasLabel = !!ariaLabel;

    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      hasLabel = hasLabel || !!label;
    }

    if (!hasLabel) {
      console.warn('Input without label:', await input.evaluate((el) => el.outerHTML));
    }
  }

  // 5. Check color contrast (requires additional tooling)
  // Use axe-core or lighthouse for automated contrast checks

  // 6. Test keyboard navigation
  await page.keyboard.press('Tab');
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  console.log('First tab stop:', firstFocused);

  // Tab through entire page
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    if (focused === 'BODY') break; // End of tab order
  }

  console.log('Manual accessibility checks completed');
}
```

## Screen Reader Testing

```bash
# === Install screen reader testing ===
# For macOS (VoiceOver)
npm install -D @testim/chrome-version

# NVDA (Windows - free)
# Download: https://www.nvaccess.org/download/

# JAWS (Windows - commercial)
# Download: https://www.freedomscientific.com/products/fs/jaws-screen-reader/
```

## CI/CD Integration

```yaml
# .github/workflows/a11y-test.yml
name: Accessibility Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright
      run: npx playwright install --with-deps

    - name: Build application
      run: npm run build

    - name: Start dev server
      run: npm run dev &
      env:
        PORT: 3000

    - name: Wait for server
      run: sleep 10

    - name: Run axe tests
      run: npx playwright test tests/a11y/

    - name: Upload a11y report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: a11y-report
        path: test-results/
```

## WCAG 2.1 AA Checklist

```markdown
## Level A (Must Have)
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Page has logical heading structure
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Skip links provided
- [ ] Color is not sole means of conveying info
- [ ] Text has minimum 3:1 contrast ratio

## Level AA (Should Have)
- [ ] Text has minimum 4.5:1 contrast ratio
- [ ] Large text has minimum 3:1 contrast ratio
- [ ] Focus indicators visible
- [ ] Page language declared
- [ ] Consistent navigation
- [ ] Error messages identify the field
- [ ] Error messages suggest correction
- [ ] Form inputs have clear purpose
- [ ] Target size minimum 44x44 pixels
- [ ] Reflow works at 320px viewport
- [ ] Content reflow at 400% zoom
```

## Related Commands

- `/test` — Unit & integration tests
- `/test:e2e` — End-to-end tests
- `/health-check` — System health monitoring
- `/review` — Code quality review
- `/seo-audit` — SEO audit

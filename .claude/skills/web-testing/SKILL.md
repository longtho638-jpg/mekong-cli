---
name: web-testing
description: Run web tests using Chrome Devtools, Playwright, Vitest, k6. Unit/integration/E2E/load/security testing. Use for test automation, coverage, a11y, visual regression, pentest.
license: Apache-2.0
version: 1.0.0
---

# Web Testing Skill

Comprehensive web testing with unit, integration, E2E, load, and security testing workflows.

## Quick Start

```bash
npx vitest run                    # Unit tests
npx playwright test               # E2E tests
k6 run load-test.js               # Load tests
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://example.com
```

## Testing Pyramid

| Layer | Ratio | Framework | Execution |
|-------|-------|-----------|-----------|
| Unit | 70% | Vitest/Jest | <5s, every commit |
| Integration | 20% | Vitest + fixtures | 30-60s, every commit |
| E2E | 10% | Playwright | 5-15min, pre-merge |

## Browser Automation

Use `chrome-devtools` skill for browser automation:
```bash
SKILL_DIR=".claude/skills/chrome-devtools/scripts"
node "$SKILL_DIR/screenshot.js" --url https://example.com --output ./screenshot.png
node "$SKILL_DIR/navigate.js" --url https://example.com
node "$SKILL_DIR/click.js" --selector "button.submit"
node "$SKILL_DIR/fill.js" --selector "#email" --value "test@example.com"
```

## When to Use

- **Unit tests**: Functions, components, utilities
- **Integration tests**: API endpoints, database ops
- **E2E tests**: Critical user flows, checkout, auth
- **Load tests**: Pre-release, performance validation
- **Security tests**: Pre-deploy, vulnerability scanning

## Reference Documentation

### Testing Guides
- `./references/unit-integration-testing.md` - Unit/integration patterns
- `./references/e2e-testing-playwright.md` - Playwright E2E workflows
- `./references/load-testing-k6.md` - k6 load test patterns
- `./references/api-testing.md` - API test checklist

### Security Testing
- `./references/security-testing-overview.md` - OWASP Top 10, tools
- `./references/security-checklists.md` - Auth, API, headers checklists
- `./references/vulnerability-payloads.md` - SQL/XSS/CSRF test payloads

### Accessibility & Visual
- `./references/accessibility-testing.md` - WCAG checklist, axe-core
- `./references/visual-regression.md` - Screenshot comparison

### Checklists
- `./references/functional-testing-checklist.md` - Feature testing
- `./references/cross-browser-checklist.md` - Browser/device matrix

## CI/CD Integration

```yaml
jobs:
  test:
    steps:
      - run: npm run test:unit    # Gate: fail fast
      - run: npm run test:e2e     # After unit pass
      - run: npm run test:a11y    # Accessibility
```

## Common Commands

```bash
npx vitest run src/utils.test.ts     # Specific file
npx playwright test --ui              # E2E with UI
npx vitest run --coverage             # Coverage report
npx playwright codegen https://example.com  # Generate tests
```

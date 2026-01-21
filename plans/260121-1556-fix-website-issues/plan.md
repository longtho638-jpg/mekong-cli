# Fix Website Issues Plan

## Context
A recent test of `agencyos.network` revealed two issues:
1. A deprecated meta tag `<meta name="apple-mobile-web-app-capable" content="yes" />` in `apps/docs/src/layouts/LandingLayout.astro`.
2. A 404 error for the Vercel Analytics script `/_vercel/insights/script.js`.

## Objectives
1. Remove the deprecated meta tag.
2. Investigate the Analytics configuration and update dependencies if necessary to resolve the 404 error.

## Implementation Steps

### Phase 1: Fix Deprecated Meta Tag
- [ ] Edit `apps/docs/src/layouts/LandingLayout.astro`
- [ ] Remove line 32: `<meta name="apple-mobile-web-app-capable" content="yes" />`

### Phase 2: Analytics Investigation
- [ ] Read `apps/docs/package.json` to check versions.
- [ ] Update `@astrojs/vercel` if outdated.
- [ ] Verify `astro.config.mjs` configuration.

## Verification
- Verify file changes.
- Ensure build passes (optional/local).

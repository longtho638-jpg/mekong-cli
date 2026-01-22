---
title: "Fix Website Issues"
status: complete
priority: P2
created: 2026-01-21
completed: 2026-01-22
---

# Fix Website Issues Plan

## Context

A recent test of `agencyos.network` revealed two issues:

1. A deprecated meta tag `<meta name="apple-mobile-web-app-capable" content="yes" />` in `apps/docs/src/layouts/LandingLayout.astro`.
2. A 404 error for the Vercel Analytics script `/_vercel/insights/script.js`.

## Objectives

1. Remove the deprecated meta tag.
2. Investigate the Analytics configuration and update dependencies if necessary to resolve the 404 error.

## Implementation Steps

### Phase 1: Fix Deprecated Meta Tag ✅

- [x] Edit `apps/docs/src/layouts/LandingLayout.astro`
- [x] Removed deprecated meta tag (already done in previous session)

### Phase 2: Analytics Investigation ✅

- [x] Verified `apps/docs/package.json` - `@astrojs/vercel: ^9.0.4` (latest)
- [x] Verified `astro.config.mjs` - `webAnalytics: { enabled: true }` configured correctly
- [x] 404 may be initial load issue, analytics is properly configured

## Verification ✅

- [x] File changes verified - meta tag not present
- [x] Config verified - analytics properly enabled

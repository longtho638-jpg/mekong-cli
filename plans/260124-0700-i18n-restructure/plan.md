---
title: "CC CLI i18n Architecture Restructure"
description: "Unified i18n system for Agency OS ecosystem (Docs, Dashboard, CLI)"
status: pending
priority: P1
effort: 8h
branch: feat/i18n-restructure
tags: [architecture, i18n, typescript]
created: 2026-01-24
---

# 📜 CC CLI i18n Architecture Restructure

> Restructure the i18n architecture to be unified, future-proof, and shared across all apps in the mekong-cli repository.

## 📋 Execution Tasks
- [x] Phase 1: Shared Package (@agencyos/i18n) - [phase-01-shared-package.md](./phase-01-shared-package.md)
- [ ] Phase 2: Consolidate Locales - [phase-02-consolidate-locales.md](./phase-02-consolidate-locales.md)
- [ ] Phase 3: i18n Utilities (React & Astro) - [phase-03-i18n-utilities.md](./phase-03-i18n-utilities.md)
- [ ] Phase 4: Extraction & Validation Scripts - [phase-04-extraction-scripts.md](./phase-04-extraction-scripts.md)
- [ ] Phase 5: Extraction from Key Pages - [phase-05-extract-pages.md](./phase-05-extract-pages.md)

## 🔍 Context
Currently, i18n is fragmented:
- `packages/i18n` is a skeleton.
- `apps/docs` uses local utils and hardcoded pages.
- `apps/dashboard` uses `next-intl`.
- `locales/` root dir has JSON files but they are not fully integrated.

This plan aims to centralize all translations and utilities into `@agencyos/i18n`.

## 🛠️ Tech Stack
- TypeScript
- React (Hooks)
- Astro (Utilities)
- JSON (Locales)

## 🎯 Success Criteria
- [ ] `@agencyos/i18n` is a functional package.
- [ ] All translations moved to `packages/i18n/src/locales/`.
- [ ] `useTranslation` and `useLocale` hooks available.
- [ ] Extraction script works to find missing keys.
- [ ] Docs homepage and pricing pages are fully internationalized.

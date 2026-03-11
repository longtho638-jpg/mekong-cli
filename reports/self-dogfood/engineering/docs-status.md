# Docs Directory Audit
Generated: 2026-03-11

## Summary

```
docs/ — 168 total entries (145 .md files + subdirs)
Most recent modification: 2026-03-10
```

---

## Current / Accurate Docs

| File | Last Modified | Status | Notes |
|------|--------------|--------|-------|
| `system-architecture.md` | 2026-03-10 | CURRENT | Updated with RaaS layer |
| `tier-rate-limiting.md` | 2026-03-10 | CURRENT | Matches implementation |
| `security-audit.md` | 2026-03-10 | CURRENT | Reflects P0 fixes |
| `security-runbook.md` | 2026-03-10 | CURRENT | |
| `raas-api.md` | present | CURRENT | |
| `raas-foundation.md` | present | CURRENT | |
| `deployment-guide.md` | present | MOSTLY CURRENT | Stripe refs need → Polar.sh |
| `code-standards.md` | present | CURRENT | |
| `codebase-summary.md` | present | STALE | Shows v3.0.0, 62 tests — need v5.0.0 |
| `project-roadmap.md` | present | STALE | Shows v3.0.0 current — need v5.0.0 |
| `project-changelog.md` | present | CURRENT | Well-maintained, Unreleased section active |

---

## Stale / Outdated Docs (Need Update)

| File | Issue | Action |
|------|-------|--------|
| `codebase-summary.md` | Shows v3.0.0, 62 tests, src structure outdated | Update to v5.0.0, 3637 tests, 408 py files |
| `project-roadmap.md` | v3.0.0 listed as current | Bump to v5.0.0 shipped |
| `PAYPAL_TESTING_GUIDE.md` | PayPal removed — rule violation | Delete or archive |
| `RELEASE_NOTES_v2.0.0.md` | Ancient, confusing versioning | Move to `docs/archive/` |
| `RELEASE_NOTES_v2.2.0.md` | Same issue | Move to `docs/archive/` |
| `GITHUB-RELEASE-v3.1.0.md` | Pre-v5 release notes | Move to `docs/archive/` |
| `onboarding-guide.md` | Antigravity/hardware focus, not developer setup | Rewrite as dev onboarding |
| `MIGRATION_LOG.md` | Historical, may be stale | Review or archive |

---

## Missing Docs (Should Exist)

| Doc | Why Needed |
|-----|-----------|
| `developer-onboarding.md` | Clone → setup → test → PR flow |
| `api-reference-v5.md` | /v1/tasks, /v1/agents, SSE spec |
| `plugin-system.md` | Plugin manifest + sandbox spec (v5.1 prep) |
| `recipe-format.md` | YAML recipe schema reference |
| `version-history.md` | Consolidated changelog across v2→v5 |
| `contributing.md` | (exists as CONTRIBUTING.md at root) — link from docs/ |

---

## Docs with Wrong Information

| File | Wrong Info | Correct Value |
|------|-----------|--------------|
| `codebase-summary.md` | "62+ tests" | 3637 tests collected |
| `codebase-summary.md` | "v3.0.0" | v5.0.0 |
| `project-roadmap.md` | "v3.0.0 current" | v5.0.0 shipped |
| `deployment-guide.md` | Stripe env vars | Should be Polar.sh |
| `PAYPAL_TESTING_GUIDE.md` | PayPal (removed from codebase) | Archive |

---

## Docs Health Score: 6/10

- Volume: excellent (145 .md files)
- Freshness: 2026-03-10 bulk update — good
- Accuracy: 3 key docs show wrong version numbers
- Coverage: missing dev onboarding, API spec, plugin/recipe format
- Organization: good structure but archive folder needed for old releases

# Engineering: Changelog Accuracy Audit — Mekong CLI v5.0

## Command: /docs
## Date: 2026-03-11

---

## Source: CHANGELOG.md (55 lines reviewed)

CHANGELOG.md follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
Only 4 versions documented despite active development since 2025-10.

---

## Version Coverage

| Version | Date | Status |
|---------|------|--------|
| 3.1.0 | 2026-03-10 | Latest documented |
| 3.0.0 | 2026-01-25 | Documented |
| 0.2.0 | 2025-11-01 | Documented |
| 0.1.0 | 2025-10-01 | Documented |

**Gap:** Versions 0.3.0 through 2.x.x are completely absent.
Current pyproject.toml declares version "5.0.0" but highest changelog entry is "3.1.0".
Version drift of 1.9 major versions is undocumented.

---

## Accuracy Check: v3.1.0 Claims vs Reality

### Claimed: "Plugin Ecosystem: registry, validator, marketplace (src/plugins/)"
- `src/core/plugin_loader.py` ✅ exists
- `src/core/plugin_registry.py` ✅ exists
- `src/core/plugin_validator.py` ✅ exists
- `src/core/plugin_marketplace.py` ✅ exists
- Claim is accurate.

### Claimed: "RaaS License Gate: RAAS_LICENSE_KEY for premium features"
- `src/core/raas_auth.py` ✅ exists
- `src/core/entitlement_enforcer.py` ✅ exists
- Claim is accurate.

### Claimed: "Persistent Memory Architecture: 5-module system"
- `src/core/memory.py`, `src/core/memory_client.py`, `src/core/vector_memory_store.py` ✅ exist
- `src/core/context_manager.py`, `src/core/cross_session_intelligence.py` ✅ exist
- 5-module count is approximately correct.

### Claimed: "CI hard gates: ruff format check, coverage enforcement"
- ci.yml line 47: `ruff format --check src/ tests/` with `continue-on-error: true`
- **Issue:** `continue-on-error: true` means the format check is NOT a hard gate
- Coverage enforcement: `--cov-fail-under=80` but also with `continue-on-error: true`
- **Inaccurate claim:** Both gates are soft, not hard.

---

## Accuracy Check: v3.0.0 Claims vs Reality

### Claimed: "6 modular agents"
- mekong/agents/ lists: binh-phap-strategist, brainstormer, code-reviewer, copywriter,
  database-admin, debugger, docs-manager, fullstack-developer, git-manager, journal-writer,
  mcp-manager, mekong-market-analyst, planner, project-manager, researcher,
  revenue-forecaster, scout-external, scout, tester + subagents/
- 19+ agents documented, not 6
- **Inaccurate:** 6 may refer to "core agents" at time of v3.0.0 but not current state

### Claimed: "Antigravity Proxy integration (port 9191)"
- `src/core/llm_client.py` references `ANTIGRAVITY_PROXY_URL` env var
- Port 9191 not verified in reviewed code
- Partially accurate but unverified.

---

## Missing from Changelog

Events that appear in git log but are not in CHANGELOG.md:
- v4.x.x → v5.0.0 transition (entire major version series)
- AGI OpenClaw SOPs addition (70ae7fa9d)
- AlgoTrader production deployment (3f65c5732)
- SaaS dashboard launch (771dd751f)
- Self-dogfood system (5f1f7df94)
- 289 commands expansion from earlier counts
- Telegram bot integration (src/core/telegram_*.py files exist)

---

## docs/project-changelog.md

File exists at docs/project-changelog.md. This is separate from CHANGELOG.md.
Having two changelog files creates inconsistency risk.
Recommendation: pick one; deprecate the other with a redirect note.

---

## Structural Issues

1. Version jump: 3.1.0 → 5.0.0 (pyproject.toml) with no documented path
2. Two changelog files: CHANGELOG.md and docs/project-changelog.md
3. v3.1.0 "CI hard gates" claim is inaccurate — gates are soft (continue-on-error)
4. "6 agents" in v3.0.0 is outdated — current count is 19+

---

## Recommendations

1. Add missing versions 3.2.0 through 5.0.0 to CHANGELOG.md
2. Fix "CI hard gates" claim — either make them hard or correct the documentation
3. Consolidate CHANGELOG.md and docs/project-changelog.md
4. Add automated changelog generation from conventional commits (use `git-cliff` or `standard-version`)
5. Sync pyproject.toml version with CHANGELOG.md latest version

---

## Summary
CHANGELOG.md is 4 entries for a v5.0.0 codebase — severely out of date.
3 of 4 documented entries are broadly accurate; "CI hard gates" claim is factually incorrect.
Major gap: entire v4.x development history is undocumented.

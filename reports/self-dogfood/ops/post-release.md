# Mekong CLI v5.0.0 — Post-Release Verification Report

**Date:** 2026-03-11
**Version:** 5.0.0 (pyproject.toml, VERSION file)
**Latest git tag:** v5.10.0 (ahead of semver label in pyproject.toml — see §1)
**Auditor:** OpenClaw self-dogfood ops pass

---

## Executive Summary

v5.0.0 is structurally solid but several release gate items are incomplete or
partially executed. The package has not been published to PyPI. GitHub release
exists as git tag `v5.10.0` but no formal GitHub Release object was created via
`gh release create`. Changelog tracks through v3.1.0 only — the v5.0.0 jump is
not documented. Migration guide is absent. Known issues are not formally catalogued.
Rollback procedure exists in docs but has not been tested against v5.

**Release readiness: 4 / 9 gates GREEN**

---

## Checklist

### 1. Version Consistency

| File | Value | Expected | Status |
|------|-------|----------|--------|
| `pyproject.toml` | 5.0.0 | 5.0.0 | ok |
| `VERSION` | 5.0.0 | 5.0.0 | ok |
| Latest git tag | v5.10.0 | v5.0.0 | MISMATCH |
| `CHANGELOG.md` latest entry | [3.1.0] 2026-03-10 | [5.0.0] | MISSING |
| `src/core/` module docstrings | "v5.0" references | patchy | partial |

**Finding:** Tag `v5.10.0` is ahead of the declared version. Either pyproject.toml
was not updated when v5.10 was tagged, or versioning discipline broke down after
the 3.1.0 → 5.0.0 jump. The `CHANGELOG.md` has no entries between v3.1.0 and the
current state — a 2-major-version gap with no record.

**Action:** Either retag current HEAD as `v5.0.0` or update pyproject.toml to 5.10.0
and add a proper CHANGELOG entry covering the 3.1→5.10 changes.

---

### 2. PyPI Package Published?

**Status: NOT PUBLISHED**

Verified via `curl https://pypi.org/pypi/mekong-cli/json` — package does not exist
on PyPI. `pip show mekong-cli` also returns nothing.

The release system (`docs/RELEASE_SYSTEM.md`, `scripts/cc_release.py`) documents
a `cc release publish --pypi-only` workflow, which uses `twine`. This has not been
executed for v5.0.0.

**Consequence:** Users cannot `pip install mekong-cli`. Installation requires
cloning the repo and running `poetry install`.

**Action to publish:**
```bash
# 1. Build
python3 scripts/cc_release.py build

# 2. Test on TestPyPI first
python3 scripts/cc_release.py publish --test-pypi

# 3. Verify install from test
pip install --index-url https://test.pypi.org/simple/ mekong-cli==5.0.0

# 4. Publish to production PyPI
python3 scripts/cc_release.py publish --pypi-only
```
Requires `~/.pypirc` with API token or `TWINE_USERNAME`/`TWINE_PASSWORD` env vars.

---

### 3. GitHub Release Created?

**Status: INCOMPLETE**

Git tag `v5.10.0` exists. However, no GitHub Release object was created — meaning
no release notes appear on the GitHub Releases page and no downloadable artifact
is attached.

Prior release documented: `docs/GITHUB-RELEASE-v3.1.0.md` shows the expected
pattern (changelog excerpt, feature list, install instructions).

**Action:**
```bash
gh release create v5.0.0 \
  --title "Mekong CLI v5.0.0 — OpenClaw Constitution" \
  --notes-file docs/GITHUB-RELEASE-v5.0.0.md \
  dist/mekong_cli-5.0.0-py3-none-any.whl \
  dist/mekong-cli-5.0.0.tar.gz
```

---

### 4. Documentation Updated?

**Status: PARTIAL**

| Doc | Updated for v5? | Notes |
|-----|----------------|-------|
| `README.md` | yes | references v5.0, 289 commands |
| `CLAUDE.md` | yes | v5.0.0 header present |
| `docs/system-architecture.md` | partial | header says v3.1.0 |
| `docs/code-standards.md` | yes | current |
| `docs/deployment-guide.md` | yes | current |
| `docs/CLI_REFERENCE.md` | unknown | large file, spot-check ok |
| `docs/codebase-summary.md` | partial | some v3 references remain |

`docs/system-architecture.md` first line reads "System Architecture: Mekong CLI v3.1.0
(OpenClaw v2026.3.8)" — needs version bump to v5.0.0.

**Action:** Grep and update version strings:
```bash
grep -rl "v3.1.0" docs/ | xargs sed -i '' 's/v3\.1\.0/v5.0.0/g'
```

---

### 5. Changelog Current?

**Status: MISSING v4–v5 HISTORY**

`CHANGELOG.md` last entry: `[3.1.0] - 2026-03-10`. There is no entry for 4.x, 5.0,
or 5.10. This is a significant gap given the scale of changes (new PEV engine
modules, MCU billing overhaul, DAG scheduler, autonomous loop, Tôm Hùm daemon,
289 commands, 542 skills).

`docs/v5.10.0-release-notes.md` exists but covers a different product scope
(AgencyOS frontend) and should not be substituted for the CLI changelog.

**Action:** Add entries to `CHANGELOG.md`:
```markdown
## [5.0.0] - 2026-03-11
### Added
- OpenClaw Constitution (CLAUDE.md v5)
- 289 commands across 5 layers (Founder/Business/Product/Engineer/Ops)
- 542 skill definitions in .claude/skills/
- 85 DAG recipe orchestrations
- MCU billing: simple=1, standard=3, complex=5 MCU
- Circuit-breaker LLM failover (9 providers, 15s cooldown)
- Health endpoint on port 9192
- Z-score anomaly detection (7-day rolling baseline)
- Telegram alert routing via AlertRouter
- Tôm Hùm autonomous dispatch daemon
### Changed
- Major version jump from 3.1.0 — see migration guide
```

---

### 6. Migration Guide Written?

**Status: NOT WRITTEN for v3→v5**

`docs/MIGRATION_LOG.md` exists but covers only a Stripe schema migration unrelated
to CLI version upgrade. `docs/billing-migration-guide.md` covers billing changes.

There is no document explaining how a user on v3.x upgrades to v5.0: breaking
changes, removed commands, new env vars required, changed config locations.

Notable breaking changes since v3.1.0 that need documenting:
- LLM config now uses `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` (3-var universal)
  instead of per-provider env vars as the primary interface
- `mekong/` namespace restructure (adapters, agents, skills, commands, infra, daemon)
- MCU billing is now mandatory — zero-balance returns HTTP 402
- Health endpoint moved to port 9192 (was 9191 in older docs)

**Action:** Create `docs/MIGRATION_v3_to_v5.md` with:
- Prerequisites
- Step-by-step upgrade
- Breaking changes table
- New required env vars
- Deprecated commands

---

### 7. Known Issues Documented?

**Status: NOT FORMALLY CATALOGUED**

No `KNOWN_ISSUES.md` or GitHub Issues labelled `v5.0.0` found. The following
issues were observed during self-dogfood audit (this session):

| # | Issue | Severity | File |
|---|-------|----------|------|
| 1 | agents.registry.json missing 5 agents | medium | `factory/contracts/agents.registry.json` |
| 2 | skills.registry.json covers only 241/542 skills | low | `factory/contracts/skills.registry.json` |
| 3 | `system-architecture.md` version header stuck at v3.1.0 | low | `docs/system-architecture.md` |
| 4 | pyproject.toml version (5.0.0) mismatches git tag (v5.10.0) | medium | `pyproject.toml` |
| 5 | CHANGELOG has no entries for v4.x or v5.x | high | `CHANGELOG.md` |
| 6 | Test coverage at 26% overall (core tests pass: 368/368) | medium | `tests/` |

**Action:** Create `KNOWN_ISSUES.md` at repo root listing the above. File GitHub
issues for #1, #4, #5 as they affect external users.

---

### 8. Rollback Procedure Tested?

**Status: DOCUMENTED, NOT TESTED FOR v5**

`docs/RELEASE_SYSTEM.md` documents `cc release rollback` which:
- Lists current and previous versions
- Asks for confirmation
- Reverts VERSION file and git tag

`docs/disaster-recovery.md` covers DB restore and region failover.

However, neither procedure has a recorded test run for the v3.1→v5.0 transition.
Previous tag `v3.1.0` exists, so rollback target is available. The rollback script
was validated for v3.1.0 (`docs/GITHUB-RELEASE-v3.1.0.md` references it).

**Untested scenario for v5:** Rolling back from v5.0.0 to v3.1.0 involves reverting
LLM client architecture changes (3-var universal → per-provider), MCU gate removal,
and skill/command namespace changes. These are not handled by the version script alone.

**Action:** Run a dry-run rollback in a worktree:
```bash
git worktree add ../mekong-rollback-test v3.1.0
cd ../mekong-rollback-test && python3 -m pytest tests/ -q
```
Document pass/fail and update `docs/disaster-recovery.md`.

---

### 9. Test Suite Health

**Status: CORE PASSING, COVERAGE LOW**

| Suite | Tests | Result | Time |
|-------|-------|--------|------|
| `tests/core/` | 368 | 368 passed, 7 warnings | 12.96s |
| Full suite (collected) | 3,637 | timed out — background | >2min |
| Coverage (full) | — | 26% overall | — |
| Coverage (core only) | — | 18-28% by module | — |

Core PEV engine tests pass cleanly. Coverage at 26% is below the 80% target in
`docs/code-standards.md`. This is a pre-existing gap (acknowledged in
`docs/v5.10.0-release-notes.md`: "558 backend tests, 93% passing, 37 pre-existing
failures documented").

**Action:** Prioritise tests for `mcu_billing.py`, `mcu_gate.py`, `llm_client.py`,
`orchestrator.py` — the billing-critical path. These are the modules most likely
to cause user-facing failures.

---

## Release Gate Summary

| Gate | Status | Blocker? |
|------|--------|----------|
| 1. Version consistency | PARTIAL | yes — changelog gap |
| 2. PyPI published | NOT DONE | yes for public launch |
| 3. GitHub Release | NOT DONE | yes for public launch |
| 4. Documentation updated | PARTIAL | no |
| 5. Changelog current | NOT DONE | yes |
| 6. Migration guide | NOT DONE | yes for upgraders |
| 7. Known issues documented | NOT DONE | no |
| 8. Rollback tested | NOT TESTED | no |
| 9. Tests passing | CORE PASS | no |

**Recommendation:** Do not announce public launch until gates 2, 3, 5, 6 are cleared.
Internal use and beta testing can proceed with current state.

---

*Report generated: 2026-03-11 | Mekong CLI v5.0.0 self-dogfood*

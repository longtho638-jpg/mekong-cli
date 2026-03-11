# Engineering: CI/CD Pipeline Review — Mekong CLI v5.0

## Command: /build
## Date: 2026-03-11

---

## Source: .github/workflows/

Workflows found (24 files total):
```
84tea-ci.yml
agencyos-landing-ci.yml
algo-trader-ci.yml
algo-trader-deploy.yml
cc-cli.yml
ci.yml                       — Main CI
daily-repo-status.lock.yml
daily-repo-status.md
deploy-cloudflare.yml
deploy-landing.yml
docsops.yml
e2e-tests.yml
factory-validate.yml
issue-triage.yml
jules-cleanup.yml
nightly-reconciliation.yml
pr-auto-review.yml
publish-packages.yml
publish-pypi.yml
security-hardening.yml
social-auth-kit-tests.yml
stale-cleanup.yml
test.yml
tom-hum-test.lock.yml
tom-hum-test.md
```

24 workflow files — significant automation infrastructure.

---

## ci.yml Analysis (149 lines)

### Jobs Defined

**Job 1: backend (Python)**
- `runs-on: ubuntu-latest`
- `timeout-minutes: 10`
- Python 3.12 with pip cache
- Steps:
  1. Install deps: `pip install -r requirements.txt` + ruff + pytest
  2. Verify CLI: `mekong --help` (continue-on-error: true)
  3. Lint: `ruff check src/ tests/`
  4. Format check: `ruff format --check` (continue-on-error: true)
  5. Test: `pytest tests/ --cov --cov-fail-under=80` (continue-on-error: true)

**Job 2: benchmarks (AGI)**
- `needs: backend` — runs after backend job
- Same setup as backend
- Runs benchmark suite

---

## Critical Issues

### Issue 1: continue-on-error Everywhere
```yaml
- name: Format Check (Ruff)
  run: ruff format --check src/ tests/
  continue-on-error: true

- name: Test (Pytest)
  run: pytest tests/ ...
  continue-on-error: true
```

`continue-on-error: true` means the CI job succeeds even if:
- Tests fail
- Format check fails
- Coverage drops below 80%

This effectively makes CI a **reporting tool, not a gate**.
Merges to main can proceed with failing tests.

**This contradicts CLAUDE.md Rule 5 (GREEN PRODUCTION RULE) which requires CI to be green.**

### Issue 2: test.yml has --cov-fail-under=15 (not 80)
```yaml
# test.yml
pytest tests/ ... --cov-fail-under=15
```
ci.yml says 80% threshold; test.yml says 15%.
Two test workflows with different coverage requirements.
Which one is authoritative?

### Issue 3: Lint (ruff check) is NOT continue-on-error
```yaml
- name: Lint (Ruff)
  run: ruff check src/ tests/
  # No continue-on-error — this IS a hard gate
```
Ruff linting is the only true hard gate in ci.yml.
Format, tests, coverage — all soft (continue-on-error).

---

## test.yml Analysis (Separate workflow)

- Triggers on push to main/master and PRs
- Python 3.11 (different from ci.yml which uses 3.12)
- `--cov-fail-under=15` — very low threshold
- This appears to be a lightweight/fast test workflow vs ci.yml's full suite

---

## Coverage Thresholds Inconsistency

| Workflow | Python Version | Coverage Threshold | Gate Type |
|----------|---------------|-------------------|-----------|
| ci.yml | 3.12 | 80% | Soft (continue-on-error) |
| test.yml | 3.11 | 15% | Hard |

Both soft/hard designations are inverted from what's desirable:
- The 80% threshold should be a hard gate
- The 15% threshold being hard means it's trivially met

---

## Additional Workflow Coverage

### deploy-cloudflare.yml
Deploys to Cloudflare Pages/Workers on push.
Separate from CI — deployment is not blocked by CI failures (further evidence of soft gates).

### security-hardening.yml
Dedicated security workflow — good to have.
Contents not reviewed but presence is positive signal.

### nightly-reconciliation.yml
Nightly automated task. For billing/data reconciliation likely.
Good operational automation.

### pr-auto-review.yml
Automated PR review workflow.
Likely uses gh CLI or AI review service.

### factory-validate.yml
Validates factory/contracts/ JSON files.
The 407 machine contracts need validation — appropriate automation.

### publish-pypi.yml
PyPI publishing workflow.
Mekong CLI published to PyPI as installable package.

---

## Missing: Branch Protection Rules

ci.yml does not enforce branch protection by itself — that requires GitHub settings.
Not verifiable from code review but should require:
- PR required before merge to main
- Status checks required (ci.yml backend job)
- At least 1 reviewer approval

---

## Missing: Security Scanning in CI

No `npm audit` equivalent for Python in ci.yml:
```yaml
# Not present:
- name: Security Scan
  run: pip install pip-audit && pip-audit
```

security-hardening.yml exists but not connected to main CI flow.
Vulnerabilities won't block merges.

---

## Missing: Build Artifact Storage

No step to store build artifacts or test results.
```yaml
# Not present:
- uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: htmlcov/
```

Coverage reports are printed to stdout but not saved for PR review.

---

## Positive Signals

- 24 workflow files indicates mature CI automation thinking
- `timeout-minutes: 10` prevents runaway jobs
- `cache: "pip"` for dependency caching (faster CI)
- Separate benchmark job after backend job
- nightly-reconciliation shows operational maturity
- factory-validate.yml validates machine contracts

---

## Recommendations

1. **Remove continue-on-error from tests:** Tests MUST be a hard gate
2. **Remove continue-on-error from format check:** Format consistency is non-negotiable
3. **Unify test.yml and ci.yml:** Consolidate to single Python version (3.12) and threshold (80%)
4. **Add pip-audit to CI:** Fail on high/critical CVEs
5. **Upload coverage reports as artifacts:** Enable coverage diff in PR comments
6. **Block deploy if CI fails:** Add `needs: [backend]` to deploy-cloudflare.yml
7. **Document branch protection settings** in DEPLOYMENT_CHECKLIST.md

---

## Summary
CI infrastructure is extensive (24 workflows) but the main ci.yml has soft gates
(continue-on-error) on both tests and format checks — effectively allowing broken
code to merge. Only ruff lint is a hard gate. Fixing continue-on-error on test/format
steps is the highest-priority CI improvement to enforce code quality gates.

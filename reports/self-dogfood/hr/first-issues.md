# Good First Issues for New Contributors
*Mekong CLI v5.0 | March 2026*

> These should be labeled `good-first-issue` on GitHub and kept updated at all times.
> Target: 10+ open at any moment. Refresh monthly.

---

## Issue Batch — March 2026

### Documentation Issues (Easiest — No Python Required)

---

**GFI-001: Sync VERSION file with pyproject.toml**
- Label: `good-first-issue`, `bug`, `docs`
- Effort: 5 minutes
- Description: `VERSION` file contains `3.0.0` but `pyproject.toml` says `5.0.0`. These must match.
- Files: `VERSION`
- Fix: Change contents of `VERSION` to `5.0.0`
- Test: No test required — just verify both files match after change
- Good for: Absolute beginners, first-ever open source contribution

---

**GFI-002: Add EAR export control notice to README**
- Label: `good-first-issue`, `docs`, `legal`
- Effort: 10 minutes
- Description: Add standard US export control notice for encryption software.
- Files: `README.md`
- Fix: Add section: "This software uses encryption (via the `cryptography` package) and may be subject to US export regulations."
- Test: No test required

---

**GFI-003: Add DCO sign-off requirement to CONTRIBUTING.md**
- Label: `good-first-issue`, `docs`, `legal`
- Effort: 15 minutes
- Description: CONTRIBUTING.md does not mention the DCO (Developer Certificate of Origin) sign-off requirement. Add the section described in `reports/self-dogfood/legal/contributor-agreement.md`.
- Files: `CONTRIBUTING.md`
- Test: No test required

---

**GFI-004: Fix broken links in QUICKSTART.md**
- Label: `good-first-issue`, `docs`
- Effort: 20 minutes
- Description: Audit all external links in QUICKSTART.md and README.md. Verify each one resolves (200 OK). Fix or remove any broken links.
- Files: `QUICKSTART.md`, `README.md`
- Test: Run `markdown-link-check QUICKSTART.md` (install via npm if needed)

---

### Testing Issues (Easy Python)

---

**GFI-005: Add unit tests for CreditStore.get_balance()**
- Label: `good-first-issue`, `tests`
- Effort: 30–45 minutes
- Description: `src/raas/credits.py` `CreditStore` class has `get_balance()` method with no test coverage. Write unit tests covering: zero balance, positive balance, tenant not found.
- Files: `tests/raas/test_credits.py` (create if missing)
- Test: `python3 -m pytest tests/raas/test_credits.py -v`
- Pattern to follow: Look at existing tests in `tests/raas/`

---

**GFI-006: Add test for CommandSanitizer blocking command substitution**
- Label: `good-first-issue`, `tests`, `security`
- Effort: 30 minutes
- Description: `src/security/command_sanitizer.py` has `CommandSanitizer` with `DANGEROUS_PATTERNS`. Add tests that verify `$(dangerous_cmd)` and backtick substitution are blocked.
- Files: `tests/` (find or create appropriate test file)
- Test: `python3 -m pytest tests/ -k "sanitizer" -v`

---

**GFI-007: Write smoke test for `mekong --help`**
- Label: `good-first-issue`, `tests`
- Effort: 20 minutes
- Description: No smoke test verifies the CLI entrypoint works. Add a test using `typer.testing.CliRunner` that runs `mekong --help` and asserts exit code 0.
- Files: `tests/cli/test_cli_smoke.py` (create)
- Example:
  ```python
  from typer.testing import CliRunner
  from src.main import app

  def test_help_exits_zero():
      runner = CliRunner()
      result = runner.invoke(app, ["--help"])
      assert result.exit_code == 0
  ```

---

### Code Issues (Medium — Python Required)

---

**GFI-008: Add Dockerfile HEALTHCHECK instruction**
- Label: `good-first-issue`, `devops`, `docker`
- Effort: 30 minutes
- Description: `Dockerfile` has no `HEALTHCHECK` instruction. Docker can't tell if the container is healthy. Add a health check that curls the `/health` endpoint.
- Files: `Dockerfile`
- Fix: Add after the final `CMD` line:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
  ```
- Prerequisite: Verify `/health` endpoint exists in `src/gateway.py`. If not, add it first (bonus points).

---

**GFI-009: Add Dependabot configuration for Python dependencies**
- Label: `good-first-issue`, `devops`, `security`
- Effort: 20 minutes
- Description: No Dependabot config in `.github/`. Create `.github/dependabot.yml` to auto-update Python and GitHub Actions dependencies weekly.
- Files: `.github/dependabot.yml` (create)
- Content:
  ```yaml
  version: 2
  updates:
    - package-ecosystem: pip
      directory: "/"
      schedule:
        interval: weekly
    - package-ecosystem: github-actions
      directory: "/"
      schedule:
        interval: weekly
  ```

---

**GFI-010: Add DCO check GitHub Action**
- Label: `good-first-issue`, `devops`, `legal`
- Effort: 20 minutes
- Description: Add a GitHub Actions workflow that checks all commits in a PR have DCO sign-off (`Signed-off-by:`).
- Files: `.github/workflows/dco-check.yml` (create)
- Content:
  ```yaml
  name: DCO Check
  on: [pull_request]
  jobs:
    dco:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0
        - uses: dcoapp/app@latest
  ```

---

## Issue Maintenance Instructions

For maintainers — keep this list healthy:

| Action | When |
|--------|------|
| Add 3 new issues | When count drops below 10 |
| Close and unlist | When issue is resolved |
| Update effort estimates | After contributor feedback |
| Add `good-first-issue` label | When creating new issues that fit |
| Monthly audit | First Monday of each month |

**Target state:** Always 10–15 `good-first-issue` items open, spanning: docs (3), tests (4), code (3), devops (2), design (1).

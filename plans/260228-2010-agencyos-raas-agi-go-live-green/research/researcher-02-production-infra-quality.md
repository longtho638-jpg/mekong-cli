# Research Report: Production Infrastructure & Quality Gates
**Plan:** 260228-2010-agencyos-raas-agi-go-live-green
**Focus:** Production Infra & Quality Gates cho mekong-cli Go-Live
**Date:** 2026-02-28

---

## 1. Python CLI Testing & CI/CD

### Pytest Stack (KHUYẾN NGHỊ)

```
pytest                    # core runner
pytest-cov                # coverage  (--cov-fail-under=80 blocks merge)
pytest-xdist              # parallel (-n auto, dùng --cov không phải coverage run)
pytest-typer / typer.testing.CliRunner  # invoke CLI commands in tests
pytest-mock               # mocking
```

**Pattern cho Typer CLI:**
```python
from typer.testing import CliRunner
from src.main import app

runner = CliRunner()

def test_cook_command():
    result = runner.invoke(app, ["cook", "hello world"])
    assert result.exit_code == 0
    assert "Plan" in result.output
```

**pyproject.toml config:**
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=src --cov-report=html --cov-fail-under=80 -n auto"

[tool.coverage.report]
exclude_lines = ["if __name__ == '__main__'", "pragma: no cover"]
```

### GitHub Actions CI Pipeline (MINIMAL, ĐÚNG)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ matrix.python-version }}" }
      - run: pip install uv && uv pip install -r requirements.txt -r requirements-dev.txt
      - run: pytest --cov=src --cov-fail-under=80
      - run: ruff check src tests
      - run: mypy src
      - run: bandit -r src -ll
```

**uv** (pip replacement, 10-100x faster) thay thế pip trong CI.

---

## 2. Production Quality Gates (MANDATORY TRƯỚC GO-LIVE)

Stack chuẩn 2025: **ruff + mypy + bandit + pre-commit**

### Gate Matrix

| Gate | Tool | Threshold | Blocks Deploy? |
|------|------|-----------|----------------|
| Linting | `ruff check` | 0 errors | YES |
| Formatting | `ruff format --check` | 0 diffs | YES |
| Type Safety | `mypy src --strict` | 0 errors | YES |
| Security | `bandit -r src -ll` | 0 HIGH/MEDIUM | YES |
| Test Coverage | `pytest --cov-fail-under=80` | 80% | YES |
| Dependency Vuln | `pip-audit` hoặc `safety check` | 0 HIGH | YES |
| Dead Code | `vulture src` | review | Warn only |

**Ruff thay thế toàn bộ:** flake8 + isort + pyupgrade + pydocstyle + bandit rules → 1 tool, viết bằng Rust, nhanh 200x. [Source](https://simone-carolini.medium.com/modern-python-code-quality-setup-uv-ruff-and-mypy-8038c6549dcc)

**pyproject.toml:**
```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "S", "UP", "B", "C4", "PT"]
# S = bandit security rules built-in

[tool.mypy]
strict = true
python_version = "3.11"
```

### Pre-commit (local gate, chạy trước commit)
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.3.0
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.9.0
    hooks:
      - id: mypy
        args: [--strict]
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: [-ll, -r, src]
```

[Python Boilerplate Reference](https://github.com/smarlhens/python-boilerplate) — uv + pre-commit + pytest + mypy + ruff + bandit.

---

## 3. Documentation Generation

### Stack KHUYẾN NGHỊ: MkDocs-Material + mkdocstrings

```
mkdocs-material          # theme (stars: 20k+)
mkdocstrings[python]     # auto-gen từ docstrings
mkdocs-gen-files         # auto-generate pages lúc build
mkdocs-literate-nav      # nav tự động từ filesystem
```

**Workflow:**
1. Viết Google-style docstrings vào mọi public function/class
2. `mkdocs build` → tự sinh API Reference từ source
3. Deploy lên GitHub Pages via `mkdocs gh-deploy`

**docs/gen_ref_pages.py** (auto-generate):
```python
import mkdocs_gen_files
import pathlib

for path in sorted(pathlib.Path("src").rglob("*.py")):
    module_path = path.relative_to("src").with_suffix("")
    doc_path = path.relative_to("src").with_suffix(".md")
    full_doc_path = pathlib.Path("reference", doc_path)
    parts = tuple(module_path.parts)
    with mkdocs_gen_files.open(full_doc_path, "w") as fd:
        fd.write(f"::: {'.'.join(parts)}\n")
```

**mkdocs.yml:**
```yaml
site_name: mekong-cli
theme:
  name: material
plugins:
  - search
  - mkdocstrings:
      handlers:
        python:
          options:
            show_source: true
            docstring_style: google
  - gen-files:
      scripts: [docs/gen_ref_pages.py]
  - literate-nav
hooks:
  - docs/hooks.py
```

Typer CLI commands tự sinh docs qua `typer-cli gen-markdown` (built-in).

[mkdocstrings docs](https://mkdocstrings.github.io/) | [Auto-gen guide](https://mitches-got-glitches.github.io/developer_blog/2024/02/27/auto-generating-package-api-with-mkdocstrings/)

---

## 4. Monitoring & Telemetry cho CLI Tools

### Pattern: Opt-In Telemetry (Privacy-First)

**Rule:** Phải hỏi consent lần đầu chạy. Phải có `MEKONG_NO_TELEMETRY=1` env var để disable hoàn toàn.

```python
# src/telemetry.py
import os
import pathlib

_CONFIG = pathlib.Path.home() / ".mekong" / "telemetry.json"

def is_enabled() -> bool:
    if os.getenv("MEKONG_NO_TELEMETRY"):
        return False
    if not _CONFIG.exists():
        return False  # Chưa opt-in
    import json
    return json.loads(_CONFIG.read_text()).get("enabled", False)

def track(event: str, props: dict | None = None) -> None:
    if not is_enabled():
        return
    # fire-and-forget, không block CLI
    import threading
    threading.Thread(target=_send, args=(event, props or {}), daemon=True).start()
```

**First-run consent prompt (Typer):**
```python
@app.callback(invoke_without_command=True)
def main():
    if not telemetry_config_exists():
        enable = typer.confirm(
            "Help improve mekong-cli by sharing anonymous usage data? "
            "(can be disabled with MEKONG_NO_TELEMETRY=1)"
        )
        save_telemetry_consent(enable)
```

### Tool Lựa Chọn

| Tool | Use Case | Cost |
|------|----------|------|
| **PostHog** (self-host) | Usage analytics, event tracking | Free (self-host) |
| **Sentry** | Crash/exception reporting | Free tier 5k errors/mo |
| **GlitchTip** | OSS Sentry alternative, privacy-first | Free (self-host) |
| **OpenTelemetry** | Traces/metrics, vendor-neutral | Free SDK |

**Recommended Stack cho mekong-cli:**
- PostHog → usage events (commands run, features used)
- Sentry SDK → unhandled exceptions (anonymous, strip paths)

```python
# src/core/crash_reporting.py
import sentry_sdk

def init_if_enabled():
    if not telemetry.is_enabled():
        return
    sentry_sdk.init(
        dsn="https://xxx@sentry.io/yyy",
        traces_sample_rate=0,      # chỉ errors, không traces
        send_default_pii=False,    # NEVER send PII
        before_send=_strip_paths,  # anonymize file paths
    )
```

[Disable telemetry patterns](https://makandracards.com/makandra/624560-disable-telemetry-various-open-source-tools-libraries) — reference cách các OSS tools implement opt-out.

---

## 5. Hiện Trạng mekong-cli

**Điểm mạnh:**
- Test suite đầy đủ (62 tests, `tests/` directory với e2e, integration, unit)
- Makefile với `make test` target
- Requirements.txt sạch, Pydantic v2, Typer + Rich

**Gaps cần fix trước go-live:**
- Chưa có `pyproject.toml` (cần để configure ruff, mypy, pytest)
- Chưa có `.github/workflows/ci.yml`
- Chưa có `pre-commit` config
- Chưa có docs pipeline (mkdocs)
- Chưa có telemetry/opt-in system
- `requirements-dev.txt` chưa có (ruff, mypy, bandit, pytest-cov)

---

## Summary: Go-Live Gate Checklist

```
CI/CD:
  [ ] .github/workflows/ci.yml với matrix Python 3.11/3.12
  [ ] pytest --cov-fail-under=80 passes
  [ ] ruff check src tests passes (0 errors)
  [ ] mypy src passes (strict)
  [ ] bandit -r src -ll passes (0 HIGH)
  [ ] pip-audit passes (0 HIGH vulns)

Docs:
  [ ] mkdocs-material site live on GitHub Pages
  [ ] API Reference auto-generated từ docstrings
  [ ] Typer CLI docs generated via typer-cli

Telemetry:
  [ ] Opt-in consent flow trên first run
  [ ] MEKONG_NO_TELEMETRY=1 env var respected
  [ ] Sentry DSN configured (anonymous)

Package:
  [ ] pyproject.toml với tool configs
  [ ] .pre-commit-config.yaml committed
  [ ] requirements-dev.txt (ruff, mypy, bandit, pytest-cov, mkdocs-material)
```

---

## Unresolved Questions

1. **mypy strict mode feasibility**: Codebase hiện tại dùng `any` types nhiều không? Strict mode có thể block quá nhiều — cần audit trước.
2. **Telemetry DSN**: PostHog instance tự host hay dùng cloud? DSN config ở đâu (hardcode vs env)?
3. **Test coverage hiện tại**: 62 tests cover bao nhiêu % src? Cần chạy `pytest --cov` để biết baseline.
4. **Docs deployment**: GitHub Pages hay Cloudflare Pages? Domain riêng hay `username.github.io/mekong-cli`?
5. **Multi-OS CI**: Cần test trên Windows/macOS/Linux hay Ubuntu only đủ?

---

*Sources: [pytest-cov GitHub Actions](https://pytest-with-eric.com/integrations/pytest-github-actions/) | [Modern Python CI 2025](https://danielnouri.org/notes/2025/11/03/modern-python-ci-with-coverage-in-2025/) | [Python Boilerplate (uv+ruff+mypy+bandit)](https://github.com/smarlhens/python-boilerplate) | [mkdocstrings](https://mkdocstrings.github.io/) | [GlitchTip OSS](https://glitchtip.com/) | [PostHog vs Sentry](https://posthog.com/blog/posthog-vs-sentry) | [Ruff Quality Setup 2025](https://simone-carolini.medium.com/modern-python-code-quality-setup-uv-ruff-and-mypy-8038c6549dcc)*

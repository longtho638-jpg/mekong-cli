# Open Source Readiness & Go-Live Checklist — mekong-cli
**Date:** 2026-02-28 | **Researcher:** researcher-01 | **Plan:** 260228-2010-agencyos-raas-agi-go-live-green

---

## TL;DR

mekong-cli có nền tảng tốt (pyproject.toml, MIT, CI, CHANGELOG). Thiếu 3 điểm chặn go-live:
1. `pyproject.toml` dùng format Poetry cũ — chưa compatible chuẩn PEP 621 cho PyPI publish
2. Không có GitHub Release với tag SemVer — PyPI workflow trigger bị block
3. `Development Status :: 4 - Beta` — cần upgrade lên `5 - Production/Stable` trước khi announce

---

## 1. Hiện Trạng mekong-cli

| Hạng Mục | Hiện Tại | Trạng Thái |
|----------|----------|-----------|
| LICENSE | MIT | PASS |
| README.md | Có, multi-lang (vi/en) | PASS |
| CONTRIBUTING.md | Có | PASS |
| SECURITY.md | Có | PASS |
| CODE_OF_CONDUCT.md | Có | PASS |
| CHANGELOG.md | Có, Conventional Commits | PASS |
| CI (GitHub Actions) | ci.yml — backend + test | PASS |
| PyPI publish workflow | publish-pypi.yml — trigger on release | PASS |
| Entry point | `mekong = "src.main:app"` | PASS |
| Version pinning | VERSION file = 2.0.0, pyproject = 2.2.0 | FAIL — mismatch |
| Classifiers | `4 - Beta` | WARN |
| pyproject format | Poetry-native (không PEP 621) | WARN |

---

## 2. PyPI Publishing Checklist (chuẩn PEP 621 / Poetry 2026)

Ref: [Python Packaging User Guide](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/) | [Real Python PyPI Guide](https://realpython.com/pypi-publish-python-package/)

**Bắt buộc trước khi publish:**

```
[x] pyproject.toml: name, version, description, authors, license
[x] readme = "README.md" trong pyproject
[x] Entry point: [tool.poetry.scripts] mekong = "src.main:app"
[ ] VERSION file SYNC với pyproject.toml version (hiện mismatch: 2.0.0 vs 2.2.0)
[ ] GitHub Release với tag vX.Y.Z — trigger publish-pypi.yml
[ ] Development Status classifier: nâng lên "5 - Production/Stable"
[ ] Token PYPI_TOKEN set trong GitHub Secrets
[ ] Test publish trên TestPyPI trước
```

**Lệnh publish thủ công (fallback):**
```bash
poetry build                          # tạo dist/ (sdist + wheel)
poetry publish --repository testpypi  # test trước
poetry publish                         # publish chính thức
```

---

## 3. Open Source Go-Live Best Practices 2025-2026

Ref: [spatie/checklist-going-live](https://github.com/spatie/checklist-going-live) | [GitHub open source checklist](https://gist.github.com/PurpleBooth/6f1ba788bf70fb501439)

**Community readiness (mekong-cli status):**
```
[x] LICENSE (MIT) — clear, permissive
[x] CONTRIBUTING.md — hướng dẫn đóng góp
[x] Issue/PR templates — .github/ISSUE_TEMPLATE, PULL_REQUEST_TEMPLATE.md
[x] SECURITY.md — vulnerability reporting
[ ] AGENTS.md — có file nhưng cần review nội dung (external contributors cần biết agent arch)
[ ] GitHub Discussions — bật chưa? (tăng community engagement)
[ ] Release Notes cho v2.2.0 — cần tạo GitHub Release tag
```

**CI/CD readiness:**
```
[x] ci.yml: lint + test trên push/PR
[x] publish-pypi.yml: trigger on GitHub Release
[ ] ci.yml thiếu: mypy type check job (đã cấu hình tool.mypy nhưng không chạy trong CI)
[ ] e2e-tests.yml: cần verify chạy đúng không (có file nhưng chưa audit)
[ ] Release automation: chưa có auto-changelog hoặc semantic-release
```

---

## 4. CLI Production Patterns (Khuyến Nghị)

**Error handling:**
- Dùng `typer.Exit(code=1)` cho lỗi user, `rich.console.print_exception()` cho debug
- Graceful degradation: khi proxy 9191 down → fallback message thay vì crash
- Config validation: `pydantic-settings` đã có — tốt

**Logging:**
- Cần `--verbose` / `--quiet` flags chuẩn (check xem `mekong --help` có không)
- Structured logging cho agent tasks (hiện dùng print/rich)

**Config management:**
- `.env` + `pydantic-settings` — chuẩn
- Cần `~/.mekong/config.yaml` cho user-level config (không dùng `.env` cho end users)

---

## 5. AGI/Agent Framework Landscape — Go-Live Standards

Ref: [LangGraph, CrewAI, AutoGen comparison 2025](https://langfuse.com/blog/2025-03-19-ai-agent-comparison) | [OpenAgents comparison 2026](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)

| Framework | Go-Live Pattern | Khác biệt so với mekong-cli |
|-----------|----------------|---------------------------|
| **LangGraph** | v1.0 late 2025, graph-first, state machine | Observable traces built-in |
| **CrewAI** | Role-based crews, pip install crewai | Simple `pip install` UX |
| **AutoGen** | Microsoft Research, structured dialogues | Heavy enterprise focus |
| **Claude Code** | Not pip-distributed — CLI binary | Direct Anthropic distribution |

**Mekong-cli differentiator:** Plan-Execute-Verify loop + Binh Pháp domain logic + Tôm Hùm autonomous daemon — unique vs peers. Cần nhấn mạnh trong README.

**Tiêu chuẩn chung của competing frameworks để go-live:**
- Semantic versioning với CHANGELOG công khai
- Observability: traces, logs có thể query được
- Python 3.9+ compatibility (mekong-cli: PASS — `python = "^3.9"`)
- Typed codebase + mypy (mekong-cli: configured nhưng CI chưa enforce)

---

## 6. Critical Blockers — Go-Live

| # | Blocker | Severity | Fix |
|---|---------|----------|-----|
| 1 | VERSION mismatch (2.0.0 vs 2.2.0) | HIGH | Sync VERSION file |
| 2 | Không có GitHub Release tag v2.2.0 | HIGH | `gh release create v2.2.0` |
| 3 | PYPI_TOKEN chưa verify set | HIGH | Check GitHub Secrets |
| 4 | mypy không chạy trong CI | MED | Thêm job vào ci.yml |
| 5 | `4-Beta` classifier | MED | Đổi thành `5-Production/Stable` |
| 6 | `~/.mekong/config.yaml` user config chưa có | LOW | Post-launch |

---

## Unresolved Questions

1. `PYPI_TOKEN` đã set trong GitHub Secrets chưa? (cần owner verify)
2. Package name `mekong-cli` trên PyPI còn available không? (cần check `pip search mekong-cli` hoặc truy cập pypi.org/project/mekong-cli)
3. `e2e-tests.yml` hiện có pass không — hay chỉ là placeholder?
4. Có plan publish npm package không? (apps/openclaw-worker là Node.js — có thể publish riêng)
5. Target audience: internal team chỉ dùng Git, hay public PyPI release cho external contributors?

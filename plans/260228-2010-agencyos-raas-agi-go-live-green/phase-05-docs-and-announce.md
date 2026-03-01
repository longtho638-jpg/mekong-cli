---
phase: 5
title: "Docs & Announce"
priority: P2
effort: 0.5h
status: pending
depends_on: [phase-02]
---

# Phase 5: Docs & Announce

## Context Links
- [Plan tổng](plan.md) | [Phase 2](phase-02-version-sync-release.md)
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`

## Overview
- **Ngày:** 2026-02-28
- **Mô tả:** Update README badges, CHANGELOG entry cho v2.2.0, verify community docs
- **Priority:** P2
- **Status:** pending (blocked by Phase 2 — cần version tag)

## Key Insights
1. README cần badges: CI status, PyPI version, Python version, Coverage
2. CHANGELOG cần entry cho v2.2.0 — Conventional Commits format
3. CONTRIBUTING.md và SECURITY.md đã có — chỉ verify nội dung current
4. Classifier đã update ở Phase 2 → PyPI page sẽ hiển thị "Production/Stable"

## Requirements
### Functional
- README có 4 badges: CI, PyPI, Python, License
- CHANGELOG có entry v2.2.0
- Tất cả community docs (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT) hiện tại

### Non-functional
- README render đúng trên GitHub và PyPI
- Badges hiện GREEN status

## Related Code Files
### Modify
- `README.md` — thêm badges ở đầu file
- `CHANGELOG.md` — thêm v2.2.0 entry

### Verify (không modify nếu OK)
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`

## Implementation Steps

### Step 1: Thêm badges vào README.md (10 phút)

Thêm ngay dưới title:

```markdown
[![CI](https://github.com/longtho638-jpg/mekong-cli/actions/workflows/test.yml/badge.svg)](https://github.com/longtho638-jpg/mekong-cli/actions/workflows/test.yml)
[![PyPI](https://img.shields.io/pypi/v/mekong-cli)](https://pypi.org/project/mekong-cli/)
[![Python](https://img.shields.io/pypi/pyversions/mekong-cli)](https://pypi.org/project/mekong-cli/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

**Lưu ý:** GitHub repo URL phải đúng (`longtho638-jpg/mekong-cli` theo package.json).

### Step 2: Thêm CHANGELOG entry (10 phút)

Thêm vào đầu `CHANGELOG.md`:

```markdown
## [2.2.0] - 2026-02-28

### Added
- AGI Layer: Mem0+Qdrant memory integration, Langfuse observability
- Tôm Hùm daemon v29: modular architecture, auto-CTO pilot
- 80+ ClaudeKit skills, 50+ slash commands
- Pre-commit config with ruff linting

### Fixed
- CI pipeline: resolved 29 test collection errors
- Version sync across pyproject.toml, package.json, VERSION

### Changed
- Development Status classifier: Beta → Production/Stable
- CI quality gates: added mypy type-check, coverage reporting
```

### Step 3: Verify community docs (5 phút)

```bash
# Quick check files exist and have content
for f in CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md; do
  echo "=== $f ===" && head -5 /Users/macbookprom1/mekong-cli/$f && echo ""
done
```

Kiểm tra:
- CONTRIBUTING.md mention `pnpm` và `poetry` (monorepo setup)
- SECURITY.md có vulnerability reporting email/process
- CODE_OF_CONDUCT.md không outdated

### Step 4: Commit (5 phút)

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add CI/PyPI badges, CHANGELOG v2.2.0 entry"
git push origin master
```

## Todo List
- [ ] Thêm 4 badges vào README.md
- [ ] Thêm CHANGELOG entry v2.2.0
- [ ] Verify CONTRIBUTING.md current
- [ ] Verify SECURITY.md current
- [ ] Commit & push

## Success Criteria
1. README render đúng trên GitHub — badges hiện GREEN
2. CHANGELOG có entry v2.2.0 ở đầu
3. PyPI page hiển thị README với badges

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Badge URL sai (repo name) | LOW | Verify repo URL trong package.json |
| PyPI badge chưa hiện (chưa publish) | LOW | Badge tự update sau PyPI publish |

## Security Considerations
- Không có thay đổi security-sensitive
- SECURITY.md phải có valid reporting contact

## Next Steps
- Cân nhắc MkDocs site cho API docs (post-launch)
- Enable GitHub Discussions cho community engagement
- Post announcement trên relevant channels

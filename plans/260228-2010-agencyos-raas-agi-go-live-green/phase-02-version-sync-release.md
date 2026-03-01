---
phase: 2
title: "Version Sync & GitHub Release"
priority: P0
effort: 1h
status: pending
depends_on: [phase-01]
---

# Phase 2: Version Sync & Release

## Context Links
- [Plan tổng](plan.md) | [Phase 1](phase-01-fix-ci-green.md)
- `pyproject.toml` — version 2.2.0
- `package.json` — version 2.1.33
- `VERSION` — 2.0.0
- `.github/workflows/publish-pypi.yml` — trigger on release

## Overview
- **Ngày:** 2026-02-28
- **Mô tả:** Sync tất cả version files về **2.2.0**, tạo GitHub Release tag, trigger PyPI publish
- **Priority:** P0
- **Status:** pending (blocked by Phase 1)

## Key Insights
1. 3 nơi chứa version → phải sync: `pyproject.toml` (2.2.0), `package.json` (2.1.33), `VERSION` (2.0.0)
2. `publish-pypi.yml` trigger `on: release: types: [published]` → cần tạo GitHub Release
3. `poetry publish` cần `PYPI_TOKEN` trong GitHub Secrets — chưa verify
4. pyproject.toml dùng Poetry-native format (không PEP 621) — vẫn build được với `poetry build`
5. Package name `mekong-cli` trên PyPI cần verify available

## Requirements
### Functional
- Tất cả version files = 2.2.0
- GitHub Release v2.2.0 được tạo với release notes
- PyPI publish workflow trigger thành công

### Non-functional
- `pip install mekong-cli` hoạt động sau publish
- Version tag follow SemVer

## Related Code Files
### Modify
- `VERSION` — 2.0.0 → 2.2.0
- `package.json` — version 2.1.33 → 2.2.0
- `pyproject.toml` — classifier Beta → Production/Stable

### Verify (không modify)
- `.github/workflows/publish-pypi.yml`

## Implementation Steps

### Step 1: Sync VERSION file (2 phút)

```bash
echo "2.2.0" > /Users/macbookprom1/mekong-cli/VERSION
```

### Step 2: Sync package.json version (2 phút)

Sửa `package.json` line 3: `"version": "2.1.33"` → `"version": "2.2.0"`

### Step 3: Update pyproject.toml classifier (2 phút)

Sửa `pyproject.toml`:
```toml
classifiers = [
    "Development Status :: 5 - Production/Stable",
    ...
]
```

### Step 4: Verify PYPI_TOKEN (5 phút)

```bash
# Check GitHub Secrets (chỉ verify exists, không xem value)
gh secret list | grep PYPI
```

Nếu KHÔNG có PYPI_TOKEN:
1. Owner cần tạo API token tại https://pypi.org/manage/account/token/
2. `gh secret set PYPI_TOKEN < token_file`

### Step 5: Check PyPI name availability (2 phút)

```bash
pip index versions mekong-cli 2>&1 || echo "Name available or not yet published"
# Hoặc: curl -s https://pypi.org/pypi/mekong-cli/json | python3 -c "import sys,json; print(json.load(sys.stdin)['info']['version'])" 2>/dev/null || echo "Not on PyPI yet"
```

### Step 6: Commit version sync (5 phút)

```bash
git add VERSION package.json pyproject.toml
git commit -m "chore: sync version to 2.2.0 across all files"
git push origin master
```

### Step 7: Tạo GitHub Release (5 phút)

```bash
gh release create v2.2.0 \
  --title "v2.2.0 — AGI CLI Platform Go-Live" \
  --notes "$(cat <<'EOF'
## mekong-cli v2.2.0

### Highlights
- Plan-Execute-Verify autonomous engine
- Tôm Hùm daemon: persistent CC CLI brain management
- Antigravity Proxy integration (port 9191)
- AGI Layer: Mem0+Qdrant memory, Langfuse observability
- 80+ ClaudeKit skills, 50+ commands

### Install
```bash
pip install mekong-cli
mekong --help
```

### Full Changelog
See [CHANGELOG.md](CHANGELOG.md)
EOF
)"
```

### Step 8: Verify PyPI publish (10 phút)

```bash
# Watch publish workflow
gh run list -w "Publish to PyPI" -L 1 --json status,conclusion

# Sau khi xong:
pip install mekong-cli==2.2.0
mekong --version
```

## Todo List
- [ ] Sync `VERSION` → 2.2.0
- [ ] Sync `package.json` version → 2.2.0
- [ ] Update classifier → Production/Stable
- [ ] Verify PYPI_TOKEN exists: `gh secret list`
- [ ] Check PyPI name availability
- [ ] Commit & push version sync
- [ ] Create GitHub Release v2.2.0
- [ ] Verify PyPI publish workflow GREEN
- [ ] Verify `pip install mekong-cli` works

## Success Criteria
1. `cat VERSION` = `cat pyproject.toml | grep version` = `2.2.0`
2. `gh release view v2.2.0` hiển thị release info
3. `gh run list -w "Publish to PyPI"` → conclusion: success
4. `pip install mekong-cli==2.2.0` thành công

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| PYPI_TOKEN chưa set | HIGH — publish fail | Owner phải set trước Step 7 |
| Package name bị chiếm trên PyPI | HIGH — cần đổi tên | Check Step 5, fallback: `agencyos-cli` |
| Poetry build fail | MED | Test local: `poetry build` trước tạo release |
| Release tag sai format | LOW | Follow SemVer: `v2.2.0` |

## Security Considerations
- PYPI_TOKEN là secret — KHÔNG log ra console
- Release notes KHÔNG chứa API keys hoặc internal URLs
- pyproject.toml KHÔNG chứa secrets

## Next Steps
- Phase 3: Quality gates enforcement
- Phase 5: Update README badges với PyPI version

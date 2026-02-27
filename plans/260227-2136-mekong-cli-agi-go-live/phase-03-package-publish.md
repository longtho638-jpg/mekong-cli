---
phase: 3
title: "Package & Publish"
status: completed
priority: P1
effort: 3h
depends_on: [phase-01]
---

# Phase 3: Package & Publish

## Context Links

- Research: [Infra Readiness](research/researcher-02-infra-deployment-readiness.md)
- File: `pyproject.toml` — current name `mekong-cli-lean`
- Workflow: `.github/workflows/publish-packages.yml`
- Packages: `packages/core/`, `packages/agents/`

## Overview

Chuẩn hóa package names, publish CLI lên PyPI + 2 SDK packages lên npm. Setup automated publish workflows.

## Key Insights

- `pyproject.toml` name = `mekong-cli-lean` → public users expect `pip install mekong-cli`
- `@agencyos/raas-core` v0.1.0 + `@agencyos/agents` v0.1.0 — sẵn sàng nhưng chưa publish
- `publish-packages.yml` đã có, trigger on release — cần verify NPM_TOKEN secret
- PyPI publish workflow **chưa có** — cần tạo mới

## Requirements

### Functional
- `pip install mekong-cli` hoạt động từ PyPI
- `npm install @agencyos/raas-core` hoạt động từ npm
- Automated publish khi tạo GitHub release

### Non-functional
- Semantic versioning
- Package metadata đầy đủ (description, homepage, license, keywords)

## Related Code Files

### Cần sửa
- `pyproject.toml` — đổi name, thêm metadata
- `.github/workflows/publish-packages.yml` — verify npm publish
- Tạo mới: `.github/workflows/publish-pypi.yml`

### Tham khảo
- `packages/core/package.json` — npm package config
- `packages/agents/package.json` — npm package config

## Architecture

### Publish Flow

```
GitHub Release (tag v2.2.0)
├── trigger: publish-pypi.yml
│   └── poetry build → twine upload → PyPI
└── trigger: publish-packages.yml
    ├── packages/core → @agencyos/raas-core@0.1.0 → npm
    └── packages/agents → @agencyos/agents@0.1.0 → npm
```

## Implementation Steps

### 1. Chuẩn hóa pyproject.toml (30min)

```toml
[tool.poetry]
name = "mekong-cli"                    # ĐỔI từ mekong-cli-lean
version = "2.2.0"                      # Bump cho go-live
description = "AGI CLI Platform — Plan-Execute-Verify autonomous engine"
homepage = "https://github.com/mekong-cli/mekong-cli"
repository = "https://github.com/mekong-cli/mekong-cli"
keywords = ["cli", "agi", "ai", "agents", "automation"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Programming Language :: Python :: 3.11",
    "Topic :: Software Development :: Libraries",
]
```

### 2. Tạo PyPI publish workflow (45min)

```yaml
# .github/workflows/publish-pypi.yml
name: Publish to PyPI
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install poetry
      - run: poetry build
      - run: poetry publish
        env:
          POETRY_PYPI_TOKEN_PYPI: ${{ secrets.PYPI_TOKEN }}
```

### 3. Verify npm packages (45min)

1. Check `packages/core/package.json` metadata đầy đủ
2. Check `packages/agents/package.json` metadata đầy đủ
3. Dry run: `cd packages/core && npm pack --dry-run`
4. Verify `publish-packages.yml` logic đúng

### 4. Verify GitHub Secrets (15min)

Cần confirm có:
- `PYPI_TOKEN` — cho PyPI publish
- `NPM_TOKEN` — cho npm publish

### 5. Test publish (dry run) (30min)

```bash
# PyPI dry run
cd /Users/macbookprom1/mekong-cli
poetry build
twine check dist/*

# npm dry run
cd packages/core && npm pack --dry-run
cd packages/agents && npm pack --dry-run
```

## Todo List

- [ ] Đổi `pyproject.toml` name → `mekong-cli`
- [ ] Thêm metadata (homepage, keywords, classifiers)
- [ ] Bump version → 2.2.0
- [ ] Tạo `.github/workflows/publish-pypi.yml`
- [ ] Verify `packages/core/package.json` metadata
- [ ] Verify `packages/agents/package.json` metadata
- [ ] Verify GitHub Secrets: `PYPI_TOKEN`, `NPM_TOKEN`
- [ ] Dry run build: `poetry build && twine check dist/*`
- [ ] Dry run npm: `npm pack --dry-run` cho cả 2 packages

## Success Criteria

- `poetry build` → OK, `twine check dist/*` → PASSED
- `npm pack --dry-run` → OK cho @agencyos/raas-core, @agencyos/agents
- Workflows cấu hình đúng, ready to trigger on release

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `mekong-cli` name taken on PyPI | Không publish được | Check `pip index versions mekong-cli` trước |
| Missing PYPI_TOKEN secret | Workflow fail | Verify trước, tạo token tại pypi.org |
| Package dependencies missing | Install fail | Test `pip install dist/*.whl` locally |

## Security Considerations

- PYPI_TOKEN + NPM_TOKEN chỉ trong GitHub Secrets, không commit
- `poetry publish` dùng token auth, không username/password

## Next Steps

→ Phase 5 (Docs) — document installation instructions

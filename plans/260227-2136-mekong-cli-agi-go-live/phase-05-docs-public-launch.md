---
phase: 5
title: "Documentation & Public Launch"
status: completed
priority: P1
effort: 2h
depends_on: [phase-03, phase-04]
---

# Phase 5: Documentation & Public Launch

## Context Links

- README: `/Users/macbookprom1/mekong-cli/README.md` (141 LOC, có basic structure)
- CLAUDE.md: Hiến Pháp đầy đủ (internal reference)
- License: MIT (đã ghi trong README)

## Overview

Hoàn thiện public-facing docs: README quickstart, CONTRIBUTING.md, launch checklist. Không viết lại README — chỉ bổ sung thiếu.

## Key Insights

- README đã có: Introduction, Features, Architecture badges → good foundation
- Thiếu: Installation instructions chi tiết, API docs, contributing guide
- `.env.example` sẽ được fix ở Phase 1 → Phase 5 reference nó
- CLAUDE.md quá chi tiết cho public → cần "Getting Started" riêng

## Requirements

### Functional
- Public user install + run mekong CLI trong < 5 phút
- Contributors biết cách setup dev environment
- API endpoints documented

### Non-functional
- README ≤ 300 LOC
- Không expose internal details (Tôm Hùm, Binh Pháp internals)

## Related Code Files

### Cần sửa
- `README.md` — bổ sung Installation, Quickstart, API
- Tạo mới: `CONTRIBUTING.md`
- Tạo mới: `docs/api-reference.md`

### Tham khảo
- `.env.example` (Phase 1 output)
- `pyproject.toml` (Phase 3 output — package name)
- `src/core/gateway.py` — API endpoints reference

## Implementation Steps

### 1. Bổ sung README.md (45min)

Thêm sections sau existing content:

```markdown
## Installation

### From PyPI (Recommended)
pip install mekong-cli

### From Source
git clone https://github.com/mekong-cli/mekong-cli
cd mekong-cli
poetry install
cp .env.example .env  # Edit with your API keys

## Quick Start

# Plan a task
mekong plan "Setup a FastAPI service with auth"

# Execute with full pipeline
mekong cook "Create CRUD API for users"

# Run existing recipe
mekong run recipes/setup-project.md

# List available recipes
mekong list

## Configuration

Copy `.env.example` and configure:
- `LLM_BASE_URL` — LLM API endpoint (OpenAI-compatible)
- `DATABASE_URL` — PostgreSQL connection string
- See `.env.example` for full list

## API Gateway

Start the API gateway:
uvicorn src.core.gateway:app --host 0.0.0.0 --port 8000

Endpoints:
- GET /health — Health check
- POST /api/cook — Execute PEV pipeline
- POST /api/plan — Plan only (preview)
- GET /api/recipes — List recipes
```

### 2. Tạo CONTRIBUTING.md (30min)

```markdown
# Contributing to Mekong CLI

## Development Setup
1. Fork + clone
2. `poetry install`
3. `cp .env.example .env`
4. `python3 -m pytest tests/` — verify setup

## Code Standards
- Python 3.11+, type hints required
- File size ≤ 200 LOC
- kebab-case filenames
- Run `ruff check` + `black --check` before commit

## Pull Request Process
1. Create feature branch from `main`
2. Write tests for new code
3. Ensure `python3 -m pytest` passes
4. Open PR with clear description
5. Wait for CI green + code review

## Commit Convention
feat: Add new feature
fix: Fix bug
refactor: Code improvement
docs: Documentation update
test: Test changes
```

### 3. Tạo docs/api-reference.md (30min)

Document gateway endpoints:
- Liệt kê từ `src/core/gateway.py` routes
- Request/Response schemas từ Pydantic models
- Auth requirements
- Example curl commands

### 4. Launch Checklist (15min)

```markdown
## Pre-Launch Checklist
- [ ] Phase 1: All tests pass
- [ ] Phase 2: No file > 200 LOC (or documented exceptions)
- [ ] Phase 3: PyPI publish dry-run OK
- [ ] Phase 3: npm publish dry-run OK
- [ ] Phase 4: CI/CD with smoke test
- [ ] Phase 5: README updated
- [ ] Phase 5: CONTRIBUTING.md created
- [ ] GitHub repo settings: branch protection on main
- [ ] GitHub repo: About section + topics
- [ ] First release tag: v2.2.0
```

## Todo List

- [ ] Bổ sung Installation + Quickstart vào README.md
- [ ] Bổ sung Configuration + API sections vào README.md
- [ ] Tạo `CONTRIBUTING.md`
- [ ] Tạo `docs/api-reference.md`
- [ ] Verify launch checklist — tất cả items checked
- [ ] Create GitHub release v2.2.0

## Success Criteria

- README có Installation, Quickstart, Configuration, API sections
- `CONTRIBUTING.md` tồn tại với dev setup instructions
- New user có thể `pip install mekong-cli && mekong --help` thành công
- GitHub release v2.2.0 published

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| README quá dài | Users không đọc | Giữ ≤300 LOC, link sang docs/ cho details |
| API docs outdated nhanh | Misleading | Auto-generate từ FastAPI /docs endpoint |
| Contributing guide quá strict | Ít contributors | Giữ simple, loosen dần |

## Security Considerations

- README không expose internal architecture details
- `.env.example` không chứa real values
- API docs ghi rõ auth requirements

## Next Steps

→ Create GitHub release v2.2.0 → trigger PyPI + npm publish
→ Announce trên relevant channels

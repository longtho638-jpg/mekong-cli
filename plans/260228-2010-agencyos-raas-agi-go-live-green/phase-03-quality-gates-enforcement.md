---
phase: 3
title: "Quality Gates Enforcement"
priority: P1
effort: 1.5h
status: pending
depends_on: [phase-01]
---

# Phase 3: Quality Gates Enforcement

## Context Links
- [Plan tổng](plan.md) | [Phase 1](phase-01-fix-ci-green.md)
- Research: [Production Infra Quality](research/researcher-02-production-infra-quality.md)
- `pyproject.toml` — đã có config cho ruff, mypy, coverage

## Overview
- **Ngày:** 2026-02-28
- **Mô tả:** Thêm ruff lint, mypy type-check, coverage threshold vào CI. Tạo `.pre-commit-config.yaml` cho local dev.
- **Priority:** P1
- **Status:** pending (blocked by Phase 1)

## Key Insights
1. `pyproject.toml` ĐÃ CÓ config cho ruff, mypy, coverage — chỉ cần CI chạy đúng
2. ruff đã chạy trong cả ci.yml và test.yml — OK
3. mypy configured (`disallow_untyped_defs = true`) nhưng KHÔNG chạy trong CI
4. Coverage `--cov-fail-under=70` chỉ có trong test.yml, ci.yml không có coverage
5. Pre-commit chưa có — dev push code chưa lint local

<!-- Updated: Validation Session 1 - Changed mypy from warn-only to strict (block CI on errors) -->

## Requirements
### Functional
- CI chạy: ruff check + mypy STRICT (block on errors) + pytest --cov-fail-under=70
- `.pre-commit-config.yaml` hoạt động local
- mypy PHẢI pass — không continue-on-error

### Non-functional
- CI thêm < 2 phút (mypy + ruff nhanh)
- Pre-commit < 30s trên commit nhỏ

## Related Code Files
### Modify
- `.github/workflows/test.yml` — thêm mypy step
- `.github/workflows/ci.yml` — thêm mypy step, thêm coverage
- `pyproject.toml` — adjust mypy config nếu cần

### Create
- `.pre-commit-config.yaml`

## Implementation Steps

### Step 1: Thêm mypy STRICT vào test.yml (10 phút)

Thêm step sau Lint, trước Test:

```yaml
      - name: Type Check (mypy)
        run: |
          pip install mypy
          mypy src/ --warn-return-any --warn-unused-configs --ignore-missing-imports
```

**VALIDATED DECISION:** mypy STRICT — KHÔNG có `|| true`, KHÔNG có `continue-on-error`. mypy errors = CI FAIL.
`--ignore-missing-imports` vẫn cần vì nhiều deps không có type stubs.

**Trước khi thêm step này**, PHẢI fix tất cả mypy errors trong src/ local trước. Chạy:
```bash
mypy src/ --warn-return-any --warn-unused-configs --ignore-missing-imports
```
Và fix tất cả errors.

### Step 2: Thêm mypy STRICT vào ci.yml backend job (10 phút)

```yaml
      - name: Type Check (mypy)
        run: |
          pip install mypy
          mypy src/ --warn-return-any --warn-unused-configs --ignore-missing-imports
```

**Không có `|| true`**, không có `continue-on-error`.

### Step 3: Thêm coverage vào ci.yml (5 phút)

Sửa ci.yml backend Test step:

```yaml
      - name: Test (Pytest)
        run: |
          pytest tests/ \
            --ignore=tests/backend --ignore=tests/e2e \
            --ignore=tests/integration --ignore=tests/unit \
            -v --tb=short \
            --cov=src --cov-config=pyproject.toml \
            --cov-report=term-missing
        env:
          PYTHONPATH: ${{ github.workspace }}
```

Không thêm `--cov-fail-under` cho ci.yml (test.yml đã có).

### Step 4: Tạo .pre-commit-config.yaml (10 phút)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.3.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=500']
```

**Không thêm mypy** vào pre-commit — quá chậm cho mỗi commit. Mypy chỉ chạy trong CI.

### Step 5: Fix ALL mypy errors + verify local (20 phút)

```bash
cd /Users/macbookprom1/mekong-cli

# Test ruff
ruff check src/ tests/ --fix

# Test mypy STRICT — PHẢI fix TẤT CẢ errors trước khi push
mypy src/ --warn-return-any --warn-unused-configs --ignore-missing-imports
# Nếu có errors → fix từng file cho đến khi 0 errors

# Test pre-commit
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

**QUAN TRỌNG:** Nếu mypy có quá nhiều errors, ưu tiên fix critical files trước (src/core/), dùng `# type: ignore` cho third-party integration code nếu cần.

### Step 6: Commit & push (5 phút)

```bash
git add .github/workflows/test.yml .github/workflows/ci.yml .pre-commit-config.yaml
git commit -m "feat(ci): add mypy type-check, coverage reporting, pre-commit config"
git push origin master
```

## Todo List
- [ ] Fix ALL mypy errors trong src/ local
- [ ] Thêm mypy STRICT step vào test.yml (NO continue-on-error)
- [ ] Thêm mypy STRICT step vào ci.yml
- [ ] Thêm coverage report vào ci.yml backend job
- [ ] Tạo `.pre-commit-config.yaml`
- [ ] Verify local: ruff + mypy PASS + pre-commit
- [ ] Commit & push
- [ ] Verify CI GREEN với new steps

## Success Criteria
1. mypy PASS trong CI — 0 errors, CI GREEN
2. CI logs hiển thị coverage report
3. `.pre-commit-config.yaml` committed và `pre-commit run --all-files` hoạt động
4. CI GREEN — mypy strict enforced

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| mypy quá nhiều errors cần fix | HIGH | Fix critical src/core/ trước, dùng `# type: ignore` cho edge cases |
| ruff --fix tạo diff lớn | MED | Review diff trước commit |
| pre-commit-config rev outdated | LOW | Dùng latest stable versions |
| Phase effort tăng vì fix mypy errors | MED | Ước tính 1-2h thêm cho mypy fixes |

## Security Considerations
- Ruff `S` rules (bandit) built-in → detect security issues
- mypy strict catch type confusion vulnerabilities — security benefit

## Next Steps
- Nâng `--cov-fail-under` lên 80 sau khi thêm tests
- Bỏ `--ignore-missing-imports` khi có đủ type stubs

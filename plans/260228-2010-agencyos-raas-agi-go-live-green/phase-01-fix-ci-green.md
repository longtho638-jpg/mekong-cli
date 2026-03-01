---
phase: 1
title: "Fix CI GREEN — Xóa 29 Collection Errors"
priority: P0-BLOCKER
effort: 2h
status: pending
---

# Phase 1: Fix CI GREEN

## Context Links
- [Plan tổng](plan.md)
- CI workflow: `.github/workflows/test.yml`
- CI workflow: `.github/workflows/ci.yml`
- Failed run logs: `gh run view --log-failed`

## Overview
- **Ngày:** 2026-02-28
- **Mô tả:** Fix 29 test collection errors trong "Test Suite" workflow (test.yml). Strategy: install FULL deps để chạy ALL tests (validated decision — không dùng --ignore).
- **Priority:** P0 — BLOCKER cho tất cả phases khác
- **Status:** pending

<!-- Updated: Validation Session 1 - Changed strategy from --ignore to install full deps -->

## Key Insights
1. **ci.yml** (Backend job) dùng `--ignore` flags — nhưng user muốn chạy ALL tests
2. **test.yml** (Test Suite) chạy `pytest tests/` KHÔNG ignore → 29 errors vì thiếu deps
3. Root cause errors:
   - 19 backend tests → `ModuleNotFoundError: No module named 'sqlalchemy'` (chain: backend.models → sqlalchemy)
   - 1 e2e test → `ModuleNotFoundError: No module named 'prometheus_client'`
   - 7 integration tests → cùng lỗi import backend modules
   - 1 test_ab_testing.py → backend import chain
   - 1 unit/test_cdn_caching.py → backend.middleware import chain
4. **VALIDATED DECISION:** Install full deps (sqlalchemy, prometheus_client, etc.) thay vì --ignore
5. test.yml install `pytest pytest-cov ruff` nhưng THIẾU `sqlalchemy`, `prometheus_client`, `pytest-asyncio`, `anyio`, `httpx`

## Requirements
### Functional
- CI workflow "Test Suite" PHẢI pass (exit 0)
- CI workflow "CI" PHẢI pass (exit 0)
- ALL tests PHẢI chạy — install full deps, KHÔNG dùng --ignore
- Không được xóa tests

### Non-functional
- CI run time < 10 phút (full deps install tốn thêm thời gian)
- Coverage report vẫn hoạt động

## Related Code Files
### Modify
- `.github/workflows/test.yml` — install full deps (sqlalchemy, prometheus_client, etc.)
- `.github/workflows/ci.yml` — install full deps, bỏ --ignore flags
- `requirements.txt` — verify chứa tất cả deps cần thiết

## Implementation Steps

### Step 1: Kiểm tra requirements.txt có đủ deps (10 phút)

```bash
cd /Users/macbookprom1/mekong-cli

# Check requirements.txt chứa tất cả deps cần thiết
grep -E "sqlalchemy|prometheus|anyio|httpx" requirements.txt

# Nếu thiếu, thêm vào requirements.txt hoặc install riêng trong CI
```

Đảm bảo `requirements.txt` chứa: sqlalchemy, prometheus_client, pytest-asyncio, anyio, httpx.
Nếu không, thêm vào CI install step.

### Step 2: Fix test.yml — Install FULL deps, chạy ALL tests (10 phút)

Sửa `.github/workflows/test.yml`:

**Install step** — thêm tất cả deps thiếu:
```yaml
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio anyio httpx ruff
          pip install sqlalchemy prometheus_client
          pip install -e .
```

**Test step** — chạy ALL tests (KHÔNG --ignore):
```yaml
      - name: Test with coverage
        env:
          PYTHONPATH: ${{ github.workspace }}
        run: |
          pytest tests/ \
            -v --tb=short \
            --cov=src --cov-config=pyproject.toml \
            --cov-report=term-missing \
            --cov-fail-under=70
```

### Step 3: Fix ci.yml — Install FULL deps, bỏ --ignore (10 phút)

Sửa ci.yml backend job:

**Install step:**
```yaml
      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install ruff pytest pytest-asyncio anyio httpx pytest-cov
          pip install sqlalchemy prometheus_client
          pip install -e .
```

**Test step** — bỏ --ignore flags:
```yaml
      - name: Test (Pytest)
        run: |
          pytest tests/ \
            -v --tb=short \
            --cov=src --cov-config=pyproject.toml \
            --cov-report=term-missing
        env:
          PYTHONPATH: ${{ github.workspace }}
```

### Step 4: Verify local — ALL tests pass (15 phút)

```bash
cd /Users/macbookprom1/mekong-cli

# Install deps locally if needed
pip install sqlalchemy prometheus_client

# Chạy ALL tests giống CI mới
pytest tests/ -v --tb=short 2>&1 | tail -30

# Kiểm tra 0 collection errors VÀ tất cả tests pass
```

**Nếu có test failures** (không chỉ collection errors):
- Fix test logic hoặc skip individual tests với `@pytest.mark.skip(reason="needs DB")`
- KHÔNG ignore toàn bộ directories

### Step 5: Push và verify CI (15 phút)

```bash
git add .github/workflows/test.yml .github/workflows/ci.yml
git commit -m "fix(ci): install full deps, run ALL tests — fix 29 collection errors"
git push origin master

# Poll CI status
MAX_ATTEMPTS=10; ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  STATUS=$(gh run list -L 1 -w "Test Suite" --json status,conclusion -q '.[0]')
  echo "Attempt $ATTEMPT: $STATUS"
  echo "$STATUS" | grep -q '"conclusion":"success"' && echo "GREEN!" && break
  echo "$STATUS" | grep -q '"conclusion":"failure"' && echo "STILL FAILING — investigate" && break
  sleep 30
done
```

### Step 6: Nếu backend tests cần DB — contingency (15 phút)

Nếu backend tests fail vì cần actual database connection:
1. Thêm PostgreSQL service container vào CI:
```yaml
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```
2. Set `DATABASE_URL` env var cho test step
3. Hoặc: mark DB-dependent tests với `@pytest.mark.skipif` khi no DB available

## Todo List
- [ ] Check requirements.txt — verify full deps available
- [ ] Sửa `.github/workflows/test.yml` — install full deps, bỏ --ignore
- [ ] Sửa `.github/workflows/ci.yml` — install full deps, bỏ --ignore
- [ ] Verify local: `pytest tests/` ALL tests pass
- [ ] Commit & push
- [ ] Verify CI GREEN: `gh run list -L 1 -w "Test Suite"`
- [ ] Verify CI GREEN: `gh run list -L 1 -w "CI"`
- [ ] Contingency: thêm PostgreSQL service nếu backend tests cần DB

## Success Criteria
1. `gh run list -L 2` → cả "Test Suite" và "CI" đều `conclusion: success`
2. 0 collection errors trong CI logs
3. Coverage report xuất hiện trong CI output

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend tests cần actual DB connection | HIGH | Thêm PostgreSQL service container hoặc mark skip |
| sqlalchemy/prometheus_client version conflict | MED | Pin versions trong install step |
| ruff lint fail block CI | MED | Chạy `ruff check --fix` local trước |
| CI run time tăng (full deps + all tests) | LOW | Chấp nhận — correctness > speed |

## Security Considerations
- Không có thay đổi security-sensitive
- Chỉ sửa CI workflow config

## Next Steps
- Sau khi CI GREEN → chuyển sang Phase 2 (Version Sync)

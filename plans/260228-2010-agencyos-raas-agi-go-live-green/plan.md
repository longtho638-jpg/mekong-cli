---
title: "AgencyOS RaaS AGI — GO LIVE GREEN"
description: "Fix CI, stabilize codebase, achieve production GREEN across all quality gates"
status: pending
priority: P0
effort: 6h
branch: master
tags: [go-live, ci-cd, quality-gates, production]
created: 2026-02-28
---

# AgencyOS RaaS AGI — GO LIVE GREEN

## Mục Tiêu
Đạt CI/CD GREEN trên tất cả workflows, sync version, publish PyPI, enforce quality gates.

## Hiện Trạng
- CI FAIL: 29 test collection errors (thiếu deps + test.yml không ignore backend/e2e/integration/unit)
- Version mismatch: pyproject.toml 2.2.0 vs package.json 2.1.33 vs VERSION 2.0.0
- Chưa có GitHub Release tag → PyPI publish bị block
- mypy/pre-commit chưa enforce trong CI

## Phases

| # | Phase | Priority | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | [Fix CI GREEN](phase-01-fix-ci-green.md) | P0 BLOCKER | 2h | pending |
| 2 | [Version Sync & Release](phase-02-version-sync-release.md) | P0 | 1h | pending |
| 3 | [Quality Gates Enforcement](phase-03-quality-gates-enforcement.md) | P1 | 1.5h | pending |
| 4 | [Production Hardening](phase-04-production-hardening.md) | P1 | 1h | pending |
| 5 | [Docs & Announce](phase-05-docs-and-announce.md) | P2 | 0.5h | pending |

## Dependencies
```
Phase 1 (CI GREEN) ← BLOCKER cho tất cả phases khác
Phase 2 (Version)  ← cần Phase 1 pass
Phase 3 (Quality)  ← cần Phase 1 pass, có thể song song Phase 2
Phase 4 (Harden)   ← cần Phase 1 pass
Phase 5 (Docs)     ← cần Phase 2 xong (version tag)
```

## Key Decisions
1. **CI Strategy**: Install FULL deps (sqlalchemy, prometheus_client, etc.) và chạy ALL tests — không dùng --ignore
2. `--cov-fail-under=70` — phù hợp giai đoạn go-live, nâng dần sau
3. **mypy STRICT** — block CI on errors (không continue-on-error)
4. Version canonical: **2.2.0** — sync tất cả files
5. **PyPI publish ngay** — tạo GitHub Release v2.2.0 ngay sau CI GREEN

## Risk
- PYPI_TOKEN chưa verify trong GitHub Secrets → cần owner check
- Package name `mekong-cli` trên PyPI có thể bị chiếm → cần check trước publish
- Backend tests phụ thuộc sqlalchemy, prometheus_client → cần CI install hoặc ignore

## Research Reports
- [Open Source Go-Live](research/researcher-01-open-source-go-live.md)
- [Production Infra Quality](research/researcher-02-production-infra-quality.md)

## Validation Log

### Session 1 — 2026-02-28
**Trigger:** Initial plan creation validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** CI hiện tại fail 29 tests vì thiếu deps (sqlalchemy, prometheus_client). Chọn strategy nào?
   - Options: --ignore only (Recommended) | Install full deps + run all | Hybrid
   - **Answer:** Install full deps + run all
   - **Rationale:** User muốn ALL tests chạy trong CI, đảm bảo không miss regression. Phase 1 cần sửa để install sqlalchemy, prometheus_client, và tất cả deps thay vì chỉ --ignore.

2. **[Scope]** PyPI publish strategy cho v2.2.0?
   - Options: Publish PyPI ngay (Recommended) | Chỉ GitHub Release | Skip cả hai
   - **Answer:** Publish PyPI ngay (Recommended)
   - **Rationale:** Confirmed — tạo GitHub Release + trigger PyPI publish ngay sau CI GREEN.

3. **[Risk]** Coverage threshold cho CI?
   - Options: 70% (Recommended) | 80% strict | 60% lenient
   - **Answer:** 70% (Recommended)
   - **Rationale:** 70% phù hợp go-live, nâng lên 80% sau khi thêm tests.

4. **[Architecture]** mypy type-check enforcement level?
   - Options: Warn only, continue-on-error (Recommended) | Strict — block CI on errors | Skip mypy
   - **Answer:** Strict — block CI on errors
   - **Rationale:** User muốn type safety nghiêm ngặt. Phase 3 cần bỏ `continue-on-error: true` và `|| true` từ mypy steps.

#### Confirmed Decisions
- CI: Install full deps, chạy ALL tests (không --ignore) — đảm bảo zero blind spots
- PyPI: Publish ngay v2.2.0 sau CI GREEN
- Coverage: 70% threshold
- mypy: Strict mode, block CI on errors

#### Action Items
- [x] Update Phase 1: Install full deps thay vì chỉ --ignore
- [x] Update Phase 3: mypy strict, bỏ continue-on-error
- [ ] Verify sqlalchemy + prometheus_client installable trong CI

#### Impact on Phases
- Phase 1: MAJOR REVISION — thay đổi strategy từ --ignore sang install full deps. Cần thêm sqlalchemy, prometheus_client, và tất cả backend deps vào CI install step.
- Phase 3: REVISION — bỏ `continue-on-error: true` và `|| true` từ mypy commands. mypy PHẢI pass để CI GREEN.

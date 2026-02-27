---
phase: 1
title: "Fix Critical Blockers (P0)"
status: completed
priority: P0
effort: 4h
---

# Phase 1: Fix Critical Blockers (P0)

## Context Links

- Research: [CLI Engine Readiness](research/researcher-01-cli-engine-readiness.md)
- Research: [Infra Readiness](research/researcher-02-infra-deployment-readiness.md)
- Rule: ĐIỀU 56 (port 9191), payment-provider.md (Polar only), ĐIỀU 49 (GREEN production)

## Overview

Sửa 4 blockers ngăn go-live: gateway tests, PayPal secrets, proxy port, .env.example.

## Key Insights

- `test_gateway.py` fail do `httpx.Client(app=...)` API deprecated → dùng `starlette.testclient.TestClient`
- PayPal secrets trong `deploy.yml` dòng 25, 29-31 — vi phạm Hiến Pháp payment-provider
- Port 20128 trong openclaw-worker là ENGINE mode riêng (Antigravity adapter), port 9191 là CC CLI proxy — 2 port khác mục đích, nhưng CLAUDE.md openclaw cần clarify
- `.env.example` thiếu `LLM_BASE_URL`, `ANTIGRAVITY_PROXY_URL` sai (ghi 4000, phải 9191)

## Requirements

### Functional
- Toàn bộ test suite PASS (0 failures)
- Không còn PayPal references trong CI/CD
- `.env.example` đủ biến cho public user bootstrap

### Non-functional
- Không break existing production deployments
- Backward compatible với current `.env` files

## Related Code Files

### Cần sửa
- `tests/test_gateway.py` — fix TestClient API compat
- `.github/workflows/deploy.yml` dòng 25, 29-31 — xóa PayPal secrets
- `.env.example` — cập nhật biến đúng
- `apps/openclaw-worker/CLAUDE.md` — clarify port 20128 vs 9191

### Tham khảo
- `src/core/gateway.py` — production gateway code (không sửa)
- `pyproject.toml` — dependency versions
- `apps/openclaw-worker/config.js` — proxy config

## Implementation Steps

### 1. Fix test_gateway.py (2h)

```bash
# 1a. Xác định TestClient pattern hiện tại
grep -n "httpx" tests/test_gateway.py | head -20

# 1b. Replace httpx.Client(app=...) → starlette TestClient
# Pattern cũ:
#   client = httpx.Client(app=app, base_url="http://test")
# Pattern mới:
#   from starlette.testclient import TestClient
#   client = TestClient(app)

# 1c. Chạy verify
python3 -m pytest tests/test_gateway.py -v
```

### 2. Xóa PayPal secrets từ deploy.yml (15min)

```yaml
# XÓA các dòng:
# PAYPAL_MODE=${{ secrets.PAYPAL_MODE }}
# PAYPAL_CLIENT_ID=PAYPAL_CLIENT_ID:latest
# PAYPAL_CLIENT_SECRET=PAYPAL_CLIENT_SECRET:latest
# PAYPAL_WEBHOOK_ID=PAYPAL_WEBHOOK_ID:latest

# THÊM nếu cần:
# POLAR_ACCESS_TOKEN=${{ secrets.POLAR_ACCESS_TOKEN }}
```

### 3. Cập nhật .env.example (30min)

```bash
# Thêm/sửa biến:
LLM_BASE_URL=http://localhost:9191  # Antigravity Proxy
ANTHROPIC_BASE_URL=http://localhost:9191
# Xóa:
# ANTIGRAVITY_PROXY_URL=http://localhost:4000/v1  (port sai)
# Xóa STRIPE_* nếu dùng Polar
```

### 4. Clarify proxy port trong openclaw-worker (30min)

- Cập nhật `apps/openclaw-worker/CLAUDE.md` ghi rõ: port 20128 = Antigravity Adapter (engine internal), port 9191 = CC CLI proxy (root level)
- Verify `apps/openclaw-worker/config.js` dùng đúng port cho từng context

### 5. Full test suite verification (30min)

```bash
cd /Users/macbookprom1/mekong-cli
python3 -m pytest tests/ -v --tb=short
# Target: 0 FAILED
```

## Todo List

- [ ] Fix `test_gateway.py` httpx → starlette TestClient
- [ ] Chạy `python3 -m pytest tests/test_gateway.py` — 0 failures
- [ ] Xóa PAYPAL_* secrets từ `.github/workflows/deploy.yml`
- [ ] Cập nhật `.env.example` với đúng port 9191
- [ ] Clarify port 20128 vs 9191 trong openclaw-worker CLAUDE.md
- [ ] Full test suite pass: `python3 -m pytest tests/ -v`

## Success Criteria

- `python3 -m pytest tests/` → **0 FAILED**
- `grep -r PAYPAL .github/` → **0 results**
- `.env.example` chứa `LLM_BASE_URL=http://localhost:9191`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| starlette TestClient API khác httpx | Tests vẫn fail | Check starlette docs, có thể cần `httpx[http2]` |
| Xóa PayPal break GCP deploy | Deploy fail | Verify GCP Secret Manager không reference PayPal |
| Port 20128 thực sự cần cho openclaw | Config break | Test openclaw-worker sau thay đổi |

## Security Considerations

- Không commit real secrets vào `.env.example`
- PayPal secrets xóa khỏi workflow nhưng cần xóa cả GitHub Secrets settings

## Next Steps

→ Phase 2 (Code Quality) hoặc Phase 3 (Publish) — chạy song song

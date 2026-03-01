# Plan: Fix Cyclic Dependency Build Failure

**Mission:** `fix_mekong_cli_fix_build_1772361585503`
**Priority:** HIGH
**Date:** 2026-03-01
**Status:** PLAN READY — Chờ duyệt

---

## Tóm Tắt Vấn Đề

Turbo build (`npm run build`) thất bại do 2 cyclic dependency:

| Cycle | Package A | Package B | Root Cause |
|-------|-----------|-----------|------------|
| 1 | `@agencyos/trading-core` | `@agencyos/vibe-arbitrage-engine` | `trading-core/arbitrage/index.ts` re-export 27 modules từ `vibe-arbitrage-engine` qua relative path → pnpm resolve link ngược |
| 2 | `@agencyos/vibe-subscription-webhooks` | `@agencyos/webhook-billing-sdk` | `webhook-billing-sdk/index.ts` (L81-93) import trực tiếp từ `@agencyos/vibe-subscription-webhooks` + peer dep → pnpm resolve link ngược |

### Bằng Chứng (pnpm ls)

```
# trading-core resolved deps có vibe-arbitrage-engine (NGƯỢC)
@agencyos/trading-core → @agencyos/vibe-arbitrage-engine link:../vibe-arbitrage-engine

# vibe-subscription-webhooks resolved deps có webhook-billing-sdk (NGƯỢC)
@agencyos/vibe-subscription-webhooks → @agencyos/webhook-billing-sdk link:../webhook-billing-sdk
```

---

## Giải Pháp

### Nguyên Tắc: Loại bỏ chiều ngược (reverse edge) trong dependency graph

Cả 2 cycle đều có pattern giống nhau: **Package A** là package cấp thấp, **Package B** là package cấp cao (facade/wrapper). Package B hợp lệ depend vào A. Nhưng A lại re-export/import ngược từ B → cycle.

**Fix:** Xóa reverse edge — Package A KHÔNG ĐƯỢC import/re-export từ Package B.

---

## Phase 1: Fix Cycle 1 — trading-core ↔ vibe-arbitrage-engine

### File cần sửa: `packages/trading-core/arbitrage/index.ts`

**Hành động:** Xóa toàn bộ file re-export wrapper. File này comment rõ "backward compatibility" và "new code should import from @agencyos/vibe-arbitrage-engine" — wrapper không còn cần thiết.

**Kiểm tra trước khi xóa:** Grep toàn codebase xem có ai import từ `@agencyos/trading-core/arbitrage` không. Nếu có → chuyển sang import từ `@agencyos/vibe-arbitrage-engine`.

**File sửa:**
1. **XÓA** `packages/trading-core/arbitrage/index.ts` (re-export wrapper)
2. **SỬA** `packages/trading-core/package.json` — xóa export entry `"./arbitrage"`

### Bước kiểm tra:
```bash
# Kiểm tra ai dùng import path cũ
grep -r "trading-core/arbitrage" packages/ apps/ --include="*.ts" --include="*.tsx"
# Nếu tìm thấy → chuyển sang @agencyos/vibe-arbitrage-engine
```

---

## Phase 2: Fix Cycle 2 — vibe-subscription-webhooks ↔ webhook-billing-sdk

### File cần sửa: `packages/webhook-billing-sdk/index.ts`

**Hành động:** Xóa re-export block (L81-93) import từ `@agencyos/vibe-subscription-webhooks`. Consumer cần subscription webhook → import trực tiếp từ `@agencyos/vibe-subscription-webhooks`.

**File sửa:**
1. **SỬA** `packages/webhook-billing-sdk/index.ts` — xóa L79-93 (re-export section)
2. **SỬA** `packages/webhook-billing-sdk/package.json` — xóa peer dep `@agencyos/vibe-subscription-webhooks`

### Bước kiểm tra:
```bash
# Kiểm tra ai import subscription webhooks qua webhook-billing-sdk
grep -r "webhook-billing-sdk.*SubscriptionWebhook\|webhook-billing-sdk.*createSubscriptionWebhookHandler\|webhook-billing-sdk.*createSubscriptionEventRouter" apps/ packages/ --include="*.ts"
# Nếu tìm thấy → chuyển sang import trực tiếp từ @agencyos/vibe-subscription-webhooks
```

---

## Phase 3: Verify Build

```bash
pnpm install          # Refresh lockfile
npm run build         # Phải pass (0 cyclic dependency)
```

---

## Tổng Kết Files Sửa (≤ 5 files)

| # | File | Action |
|---|------|--------|
| 1 | `packages/trading-core/arbitrage/index.ts` | **XÓA** file |
| 2 | `packages/trading-core/package.json` | **SỬA** — xóa `"./arbitrage"` export entry |
| 3 | `packages/webhook-billing-sdk/index.ts` | **SỬA** — xóa L79-93 re-export block |
| 4 | `packages/webhook-billing-sdk/package.json` | **SỬA** — xóa peer dep `vibe-subscription-webhooks` |

**Total: 4 files** (trong giới hạn < 5 file)

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Consumer dùng `trading-core/arbitrage` import path | LOW | Grep kiểm tra trước, chuyển import nếu cần |
| Consumer dùng subscription webhook qua webhook-billing-sdk | LOW | Grep kiểm tra trước, chuyển import nếu cần |
| pnpm lockfile thay đổi | NONE | Expected — `pnpm install` refresh |

---

## Unresolved Questions

Không có.

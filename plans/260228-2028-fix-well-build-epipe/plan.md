# Plan: Fix Well Build EPIPE Failure

**Mission:** fix_well_fix_build_1772285079522
**Priority:** HIGH
**Binh Pháp:** 第九篇 行軍 (Hành Quân — Execution)
**Status:** PLANNED
**Files to modify:** 1

---

## Phân Tích Nguyên Nhân

### Lỗi
```
[vite:esbuild-transpile] The service was stopped: write EPIPE
```

### Root Cause: Memory Exhaustion (OOM Kill esbuild)

| Metric | Giá trị |
|--------|---------|
| Source files | 502 TS/TSX |
| Modules transformed trước crash | 1447–3978 (biến thiên) |
| Node version | v25.2.1 |
| esbuild version | 0.27.3 |
| Vite version | 7.3.1 |
| Heap hiện tại | 4096 MB (4GB) |
| RAM hệ thống | 16 GB (M1) |

**Cơ chế:** Vite 7.3.1 spawn 8 esbuild workers (= CPU cores trên M1). Mỗi worker cạnh tranh heap 4GB → worker xử lý chunk nặng (react-pdf, recharts/d3) hết memory → crash → IPC pipe đứt → `write EPIPE`.

### Bằng chứng xác nhận

1. `tsc --noEmit` — PASS (0 errors)
2. esbuild trên từng file riêng lẻ — PASS (0 errors)
3. `vite build` với 4GB — FAIL (EPIPE)
4. **`vite build` với 6GB — PASS** ← Xác nhận 100% là memory issue

### Loại trừ

- ~~Lỗi cú pháp marketplace.ts~~ — File valid, esbuild parse ok
- ~~TypeScript errors~~ — tsc pass
- ~~Circular deps~~ — Đã handled trong vite.config (recharts/d3 excluded)

---

## Giải Pháp

### Phase 1: Tăng heap allocation (1 file)

**File:** `apps/well/package.json`

**Thay đổi:**
```diff
- "build": "NODE_OPTIONS=--max-old-space-size=4096 tsc && NODE_OPTIONS=--max-old-space-size=4096 vite build",
+ "build": "NODE_OPTIONS=--max-old-space-size=6144 tsc && NODE_OPTIONS=--max-old-space-size=6144 vite build",
```

**Lý do:**
- 4GB không đủ cho 502 source files + heavy deps (react-pdf ~50MB, recharts/d3)
- 6GB đã verify thành công (BUILD SUCCESS)
- M1 16GB RAM → 6GB heap là an toàn (~37.5% system RAM)
- Không cần thay đổi vite config hay tsconfig

---

## Verification

```bash
cd apps/well
npm run build   # Phải pass (exit code 0)
```

---

## Checklist

- [ ] Sửa `package.json` — tăng `--max-old-space-size` từ 4096 → 6144
- [ ] Chạy `npm run build` — verify pass
- [ ] Commit: `fix(well): increase build heap to 6GB — fixes esbuild EPIPE OOM crash`

---

## Rủi ro

| Rủi ro | Xác suất | Giảm thiểu |
|--------|----------|------------|
| CI/CD server ít RAM hơn | Thấp | Hầu hết CI có 7GB+ RAM |
| Tương lai module tăng, 6GB không đủ | Thấp | Monitor, tăng lên 8GB nếu cần |

## Câu hỏi chưa giải quyết

1. CI/CD environment (GitHub Actions?) có ít nhất 7GB RAM không? (Standard runner = 7GB → OK)

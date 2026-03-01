# Plan: Fix Build Failure — sophia-proposal + openclaw-worker warning

**Mission:** fix_mekong_cli_fix_build_1772305667184
**Priority:** HIGH
**Status:** PLANNED (chưa fix)
**Branch:** master
**Estimated changes:** 2 files

---

## Phân Tích Lỗi

### Lỗi chính: `sophia-proposal#build` — Exit code 1

```
Font file not found: Can't resolve './fonts/GeistVF.woff'
Font file not found: Can't resolve './fonts/GeistMonoVF.woff'
```

**Root cause:** `app/layout.tsx` dùng `next/font/local` trỏ tới 2 font files không tồn tại:
- `app/fonts/GeistVF.woff` — MISSING
- `app/fonts/GeistMonoVF.woff` — MISSING

Thư mục `app/fonts/` rỗng hoặc chưa tạo. Không có font file nào trong monorepo khớp tên này.

### Cascading failures: Exit code 130 (SIGINT)

`mekong-landing-builder`, `apex-os`, `anima119` — bị turbo tự kill khi primary task fail. **Không phải lỗi thực.** Khi sophia-proposal build pass, các app này sẽ build bình thường.

### Warning: `openclaw-worker#build` — no output files

turbo.json global `outputs: ["dist/**", ".next/**"]` nhưng openclaw-worker output không có dist/ hay .next/. Warning-only, không fail build.

### Xác nhận: `algo-trader` build OK ✅

```
> algo-trader@0.1.0 build
> tsc
(no errors)
```

---

## Giải Pháp

### Option A: Dùng `next/font/google` thay vì local (KHUYẾN NGHỊ)

Thay `localFont` bằng Google Fonts Inter + Space Grotesk — không cần file .woff.

**File:** `apps/sophia-proposal/app/layout.tsx`

```typescript
// BEFORE (broken):
import localFont from "next/font/local";
const inter = localFont({ src: "./fonts/GeistVF.woff", ... });
const spaceGrotesk = localFont({ src: "./fonts/GeistMonoVF.woff", ... });

// AFTER (fix):
import { Inter, Space_Grotesk } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
```

**Ưu điểm:** Không cần quản lý font files, Next.js auto-optimize
**Files changed:** 1

### Option B: Download font files vào thư mục đúng

```bash
mkdir -p apps/sophia-proposal/app/fonts/
# Download Geist fonts từ https://github.com/vercel/geist-font
```

**Nhược điểm:** Phải track binary files trong git

---

## Implementation Steps

- [ ] **Step 1:** Sửa `apps/sophia-proposal/app/layout.tsx` — chuyển sang Google Fonts (Option A)
- [ ] **Step 2:** Chạy `pnpm --filter sophia-proposal build` — verify pass
- [ ] **Step 3:** Chạy `pnpm run build` (toàn monorepo) — verify tất cả pass
- [ ] **Step 4:** Commit & push

---

## Success Criteria

- `sophia-proposal#build` exit code 0
- `pnpm run build` — 34/34 tasks successful
- Không có cascading failures (exit 130)
- Font hiển thị đúng trên production

---

## Risk Assessment

- **Low risk:** Chỉ thay đổi font import, không ảnh hưởng logic/layout
- **Rollback:** Revert 1 commit nếu font rendering khác biệt

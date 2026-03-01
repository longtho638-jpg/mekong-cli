# Plan: Fix Build — Dual Package Manager Conflict

**Mission:** fix_mekong_cli_fix_build_1772288457167
**Priority:** HIGH
**Branch:** master
**Status:** PLANNED

---

## Phân tích lỗi

```
turbo run build
x could not resolve workspaces:
We detected multiple package managers in your repository: pnpm, npm.
Please remove one of them.
```

**Nguyên nhân gốc:** Turbo v2 phát hiện CẢ HAI:
1. `pnpm-lock.yaml` + `pnpm-workspace.yaml` → pnpm
2. `package-lock.json` (21K dòng) → npm

Turbo v2 từ chối resolve workspaces khi có 2 PM cùng lúc.

**PM chính thức:** pnpm (theo `pnpm-workspace.yaml`, scripts dùng `pnpm`)

---

## Kế hoạch (3 file, 0 logic code)

### Phase 1: Xoá `package-lock.json` gốc

| # | Hành động | File |
|---|-----------|------|
| 1 | `rm package-lock.json` | `/package-lock.json` |

**Lý do:** Monorepo dùng pnpm. `package-lock.json` gốc (21K dòng) là artifact từ npm install cũ. pnpm dùng `pnpm-lock.yaml`.

### Phase 2: Thêm `package-lock.json` vào .gitignore

| # | Hành động | File |
|---|-----------|------|
| 2 | Thêm `package-lock.json` vào `.gitignore` | `/.gitignore` |

**Lý do:** Ngăn npm tạo lại lock file nếu ai đó chạy `npm install` nhầm.

### Phase 3: Cập nhật `engines` trong `package.json`

| # | Hành động | File |
|---|-----------|------|
| 3 | Thêm `"packageManager": "pnpm@9.15.0"` vào `package.json` | `/package.json` |
| 3b | Xoá `"npm"` khỏi `engines` (optional) | `/package.json` |

**Lý do:** `packageManager` field (corepack) giúp Turbo nhận đúng PM. Cũng ngăn CI/CD dùng npm.

### Phase 4: Verify build

```bash
pnpm install    # Đảm bảo pnpm-lock.yaml up-to-date
pnpm run build  # Turbo phải pass
```

---

## File thay đổi (tổng: 3 file)

| File | Hành động |
|------|-----------|
| `package-lock.json` | XOÁ |
| `.gitignore` | THÊM dòng `package-lock.json` |
| `package.json` | THÊM `packageManager` field |

---

## Rủi ro

| Rủi ro | Khả năng | Giảm thiểu |
|--------|----------|------------|
| Subproject dùng npm | Thấp | `docs-portal/`, `newsletter-saas/` có lock riêng nhưng ngoài workspace |
| pnpm-lock.yaml stale | Trung bình | Chạy `pnpm install` để sync |
| CI dùng npm | Thấp | `packageManager` field enforce pnpm |

---

## Tiêu chí thành công

- [ ] `pnpm run build` pass (exit 0)
- [ ] Không còn `package-lock.json` ở root
- [ ] `package.json` có `packageManager` field

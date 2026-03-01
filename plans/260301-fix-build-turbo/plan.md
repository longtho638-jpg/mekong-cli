# Plan: Fix Build Failure — turbo command not found

> MISSION_ID: fix_mekong_cli_fix_build_1772357386227
> PRIORITY: HIGH
> Date: 2026-03-01
> Status: 📋 PLAN ONLY — chưa thực thi

---

## 1. Phân tích nguyên nhân gốc

### Error Log
```
> mekong-cli@2.1.33 build
> turbo run build

sh: turbo: command not found
```

### Root Cause
`turbo` được khai báo trong `devDependencies` (`"turbo": "^2.1.3"`) nhưng **CHƯA ĐƯỢC INSTALL**.

**Bằng chứng:**
- `node_modules/.bin/turbo` → MISSING
- `node_modules/turbo/` → MISSING
- `which turbo` → not found (không install global)
- `pnpm-lock.yaml` tồn tại (45k lines) nhưng `node_modules` thiếu turbo binary

**Nguyên nhân sâu:** Project dùng `pnpm` (v9.15.0) làm package manager (khai báo trong `packageManager` field). Khi chạy `npm run build`, npm tìm `turbo` trong PATH hoặc `node_modules/.bin/` — cả hai đều không có vì dependencies chưa install bằng `pnpm install`.

---

## 2. Giải pháp — 1 file cần sửa, 1 lệnh cần chạy

### Option A: Install dependencies (KHUYẾN NGHỊ — 0 file sửa)

```bash
cd /Users/macbookprom1/mekong-cli
pnpm install
```

Sau đó verify:
```bash
npm run build
# HOẶC
pnpm run build
```

**Ưu điểm:** Không sửa file nào. Chỉ install missing deps.
**Nhược điểm:** `pnpm install` trên monorepo lớn (34 apps) có thể mất 2-5 phút.

### Option B: Dùng npx fallback trong scripts (1 file sửa)

Sửa `package.json` — thay `turbo` bằng `npx turbo`:

```json
"scripts": {
    "dev": "npx turbo run dev",
    "build": "npx turbo run build",
    "test": "npx turbo run test",
    "lint": "npx turbo run lint",
    "format": "npx turbo run format"
}
```

**Ưu điểm:** Hoạt động ngay cả khi chưa `pnpm install` đầy đủ.
**Nhược điểm:** `npx` tải turbo mỗi lần nếu chưa cached, chậm hơn. Không phải best practice.

### Option C: Install turbo global (0 file sửa)

```bash
npm install -g turbo
```

**Ưu điểm:** Nhanh.
**Nhược điểm:** Không reproducible trên CI/CD. Version mismatch risk.

---

## 3. Khuyến nghị: Option A

**Lý do:**
1. `turbo` đã khai báo đúng trong `devDependencies` → chỉ cần install
2. `pnpm-lock.yaml` tồn tại → install sẽ deterministic
3. Không cần sửa file nào → đúng best practice monorepo
4. CI/CD cũng cần `pnpm install` trước `npm run build`

### Các bước thực thi (khi được duyệt)

```bash
# Bước 1: Install dependencies
cd /Users/macbookprom1/mekong-cli
pnpm install

# Bước 2: Verify turbo có trong node_modules
ls node_modules/.bin/turbo

# Bước 3: Build
npm run build
# HOẶC (khuyến nghị vì project dùng pnpm)
pnpm run build

# Bước 4: Nếu build fail vì sub-app issues, chạy filter
pnpm run build --filter=./packages/*
```

### Files cần sửa: 0

Chỉ cần chạy `pnpm install`. Không sửa file.

### Rủi ro
- Nếu `pnpm install` fail do hoisted dependencies conflict → chạy `pnpm install --no-frozen-lockfile`
- Nếu turbo build fail trên sub-apps cụ thể → cần filter hoặc fix từng app
- M1 16GB: `pnpm install` full monorepo có thể dùng nhiều RAM → theo dõi

---

## 4. Checklist verification sau khi fix

- [ ] `node_modules/.bin/turbo` tồn tại
- [ ] `pnpm run build` exit code 0
- [ ] Không sửa quá 5 files (target: 0 files)

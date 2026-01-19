---
description: Workflow to validate code before commit - AGENT MUST FOLLOW
---

# ⚡ Pre-Commit Validation Workflow

> **QUAN TRỌNG**: Agent PHẢI chạy workflow này TRƯỚC khi git commit

## Khi nào dùng?

- Sau khi edit file TypeScript trong `apps/`
- Sau khi edit file Python trong `backend/`, `scripts/`
- TRƯỚC MỌI git commit

## Steps

### Step 1: TypeScript Check (if edited apps/)

// turbo

```bash
cd /Users/macbookprom1/mekong-cli/apps/dashboard && pnpm exec tsc --noEmit --skipLibCheck
```

### Step 2: Python Lint (if edited .py files)

// turbo

```bash
cd /Users/macbookprom1/mekong-cli && ruff check . --fix
```

### Step 3: Python Tests (if edited backend/)

// turbo

```bash
cd /Users/macbookprom1/mekong-cli && python3 -m pytest backend/tests -q --tb=no
```

### Step 4: Only commit if ALL passed

// turbo

```bash
git add . && git commit -m "message"
```

## ❌ KHÔNG LÀM

- KHÔNG commit mà không chạy validation
- KHÔNG push nếu chưa test
- KHÔNG ignore TypeScript/lint errors

## ✅ LUÔN LÀM

- Chạy tsc --noEmit sau khi edit TypeScript
- Chạy ruff check sau khi edit Python
- Chạy pytest nếu sửa backend/

---

_Binh Pháp: "Tri bỉ tri kỷ" - Biết code của mình trước khi push_

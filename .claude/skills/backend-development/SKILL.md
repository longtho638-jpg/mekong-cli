---
name: backend-development
description: Build scalable backend logic using Supabase Edge Functions (TypeScript) and AntigravityKit (Python).
---

# 🛡️ Backend Development Skill (Agency OS Standard)

> **"Phòng thủ chặt chẽ"** - Secure, Scalable, Serverless.

## 🛠️ Tech Stack (The Hybrid Model)

1.  **Supabase (Primary):**
    *   **Postgres:** Cơ sở dữ liệu chính.
    *   **RLS (Row Level Security):** Bảo mật dữ liệu tại nguồn.
    *   **Edge Functions (Deno/TS):** API logic nhanh, realtime.

2.  **AntigravityKit (Core):**
    *   **Python:** Xử lý logic phức tạp (AI, Data Analysis, Binh Pháp).
    *   **CLI:** Giao diện điều khiển.

## 🏗️ Architecture Pattern

### 1. Database Design (Postgres)
Luôn bắt đầu từ Schema. Sử dụng `migrations` để quản lý thay đổi.

```sql
-- policies.sql
create policy "Users can see their own data"
on public.todos
for select using (auth.uid() = user_id);
```

### 2. Edge Functions (TypeScript)
Dùng cho Webhooks (Stripe, Slack) và logic nhẹ.

```typescript
// supabase/functions/payment-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { event } = await req.json()
  // Handle event
  return new Response("OK")
})
```

### 3. Core Logic (Python)
Dùng cho các tác vụ nặng (AI, Report generation).

```python
# antigravity/core/revenue_engine.py
def calculate_mrr(self):
    """Tính toán doanh thu định kỳ phức tạp."""
    # Logic...
```

## 🚀 Best Practices (VIBE Rules)

1.  **RLS is King:** Không bao giờ tắt RLS trên production tables.
2.  **Type Safety:** Luôn generate types từ DB (`supabase gen types typescript`).
3.  **Atomic Transactions:** Dùng transaction cho các thao tác liên quan đến tiền bạc.
4.  **Secrets:** Không bao giờ hardcode. Dùng `Vault` hoặc `Env Vars`.
5.  **Logs:** Luôn log các sự kiện quan trọng (Audit Trail).

## 🛡️ Security Checklist

- [ ] RLS policies enabled
- [ ] Service Role Key được giấu kỹ
- [ ] Input Validation (Zod/Pydantic)
- [ ] Rate Limiting (trên Edge Functions)

> 🏯 **"Vững như bàn thạch"** - Backend phải ổn định để Frontend tỏa sáng.
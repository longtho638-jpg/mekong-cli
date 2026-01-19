---
name: frontend-development
description: Build high-performance frontend with Next.js 15, Tailwind CSS, and Supabase. Optimized for Vercel deployment.
---

# ⚡ Next.js 15 Frontend Skill (Agency OS Standard)

> **"Tốc độ là sức mạnh"** - Focus on Next.js App Router, Server Actions, and Tailwind CSS.

## 🛠️ Tech Stack (The Solo Stack)

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn/UI
- **State:** React Query (TanStack) + Zustand (Global)
- **Auth/DB:** Supabase Client (SSR)
- **Deploy:** Vercel Edge

## 🏗️ Project Structure

```
app/
  layout.tsx        # Root layout (Metadata, Fonts)
  page.tsx          # Home page
  api/              # Route Handlers (Edge Runtime)
  (auth)/           # Route Group (Login/Register)
  dashboard/        # Protected Routes
components/
  ui/               # Shadcn/UI Primitives
  blocks/           # Marketing Blocks (Hero, Pricing)
lib/
  supabase/         # Supabase Clients (Server/Client)
  utils.ts          # Helpers
```

## 🚀 Best Practices (VIBE Rules)

1.  **Server Components First:** Mặc định dùng Server Components. Chỉ thêm `'use client'` khi cần interactivity (useState, useEffect).
2.  **Fetch at the Top:** Fetch data trực tiếp trong Server Component (`await supabase...`) và truyền xuống dưới.
3.  **Server Actions:** Dùng Server Actions để mutate data (thay vì API Routes truyền thống).
4.  **Edge Runtime:** Ưu tiên `export const runtime = 'edge'` cho API routes để giảm latency.
5.  **Images:** Luôn dùng `next/image` với `priority` cho LCP element.

## 📦 Code Snippets

### 1. Data Fetching (Server Component)

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: todos } = await supabase.from('todos').select()

  return <TodoList initialTodos={todos} />
}
```

### 2. Server Action (Mutation)

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTodo(formData: FormData) {
  const supabase = createClient()
  await supabase.from('todos').insert({ title: formData.get('title') })
  revalidatePath('/dashboard')
}
```

## 🛡️ Performance Checklist

- [ ] LCP < 2.5s (Dùng `next/font`, `next/image`)
- [ ] CLS < 0.1 (Size attributes cho images)
- [ ] Bundle Size (Dùng `import { Button }` thay vì import cả library)
- [ ] Dynamic Imports (`next/dynamic` cho components nặng)

> 🏯 **"Quân quý ở tinh, không quý ở nhiều"** - Code ít, hiệu quả cao.

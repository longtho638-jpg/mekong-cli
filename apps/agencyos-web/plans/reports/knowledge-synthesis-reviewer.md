# Báo cáo Tổng hợp Kiến thức (Knowledge Synthesis) - AgencyOS Web

**Ngày báo cáo:** 14/02/2026
**Người thực hiện:** Code Reviewer Agent
**Phạm vi:** `apps/agencyos-web`

---

## 1. Tổng quan Kiến trúc

`agencyos-web` là một ứng dụng Next.js hiện đại sử dụng App Router, tích hợp chặt chẽ với Supabase cho backend/auth và Tailwind CSS cho styling.

- **Framework:** Next.js 16.1.6 (App Router)
- **Styling:** Tailwind CSS v4 (Alpha/Beta), `shadcn/ui` component architecture.
- **Backend/Auth:** Supabase (sử dụng gói `@supabase/ssr` mới nhất).
- **Language:** TypeScript 5.

## 2. Phân tích Pattern

### 2.1. Supabase Integration (Good Pattern)
Dự án áp dụng mô hình tách biệt Client/Server cho Supabase client, tuân thủ best practice của `@supabase/ssr`:

- **Client Component Client** (`lib/supabase/client.ts`): Sử dụng `createBrowserClient` cho các component chạy trên trình duyệt (như form login).
- **Server Component Client** (`lib/supabase/server.ts`): Sử dụng `createServerClient` với cookie handling, dùng cho Server Actions, API Routes, và Server Components.
- **Middleware** (`middleware.ts`): Quản lý session và bảo vệ route tập trung. Logic redirect được đặt tại đây thay vì phân tán trong từng page.

### 2.2. Component Architecture (Standard Pattern)
- Sử dụng **Headless UI + Tailwind** thông qua `radix-ui` và pattern của `shadcn/ui`.
- **`cva` (Class Variance Authority)**: Quản lý biến thể (variants) của component rất tốt (ví dụ trong `components/ui/button.tsx`).
- **`cn` utility**: Hàm merge class names sử dụng `clsx` và `tailwind-merge` là chuẩn mực để xử lý xung đột style.

### 2.3. Authentication Flow
- Flow đăng nhập hiện tại là Client-side authentication (`signInWithPassword` gọi từ client).
- Middleware đóng vai trò Guard: Chặn truy cập `/dashboard` nếu chưa login và chặn `/auth/login` nếu đã login.

## 3. Knowledge Items

### ✅ Tốt (Cần phát huy)
1.  **Phân tách Supabase Context**: Việc giữ `client.ts` và `server.ts` riêng biệt là rất quan trọng để tránh lỗi hydration và bảo mật.
2.  **Centralized Auth Guard**: Middleware xử lý auth redirect giúp giảm lặp code và tăng tính bảo mật.
3.  **Utility-first CSS Architecture**: Cấu trúc `components/ui` giúp dễ dàng tùy biến và tái sử dụng, tránh phụ thuộc vào một thư viện UI đóng kín.

### ⚠️ Cần tránh (Anti-patterns & Risks)
1.  **Hardcoded Validation**:
    - *Hiện trạng*: `app/auth/login/page.tsx` đang tự viết hàm `isValidEmail` và `isValidPassword`.
    - *Rủi ro*: Khó bảo trì, không đồng nhất nếu logic này cần dùng ở nơi khác (ví dụ: đăng ký).
    - *Giải pháp*: Sử dụng `zod` để định nghĩa schema validation và tái sử dụng.

2.  **Non-null Assertions với Env Vars**:
    - *Hiện trạng*: `process.env.NEXT_PUBLIC_SUPABASE_URL!` trong `lib/supabase/*.ts`.
    - *Rủi ro*: Nếu thiếu biến môi trường, ứng dụng sẽ crash ở runtime mà không có thông báo lỗi rõ ràng.
    - *Giải pháp*: Validate biến môi trường ngay lúc khởi động (build-time check) hoặc dùng helper function có throw error rõ ràng.

3.  **Inline SVG & Logic phức tạp trong Page**:
    - *Hiện trạng*: `app/page.tsx` chứa nhiều mã SVG inline và class dài.
    - *Rủi ro*: Làm file khó đọc, khó bảo trì.
    - *Giải pháp*: Tách các thành phần UI (Hero, FeatureCard, Footer) ra các component riêng biệt.

### 🔍 Điểm mù (Blind Spots)
1.  **Error Handling UX**:
    - Trang login hiển thị trực tiếp `error.message` từ Supabase. Message này thường là tiếng Anh kỹ thuật, không thân thiện với người dùng cuối. Cần có layer mapping lỗi.
2.  **Loading State Feedback**:
    - Hiện tại chỉ đổi text nút thành "Signing in...". Cần UX tốt hơn (disable input, spinner).
3.  **Tailwind v4 Stability**:
    - Dự án đang dùng Tailwind v4 (theo package.json). Cần lưu ý về độ ổn định và compatibility của các plugin cũ nếu có ý định mở rộng.

## 4. Đề xuất Hành động (Action Plan)

1.  **Refactor Validation**: Chuyển logic validate trong Login sang `zod`.
2.  **Environment Safety**: Thêm file `lib/env.ts` để validate biến môi trường.
3.  **Component Extraction**: Refactor `app/page.tsx`, tách nhỏ các section.
4.  **Error Mapping**: Tạo utility function để map lỗi Supabase sang thông báo thân thiện (hỗ trợ i18n sau này).

---
*Báo cáo được tổng hợp tự động bởi Code Reviewer Agent.*

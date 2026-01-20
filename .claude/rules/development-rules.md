---
title: "Development Rules - VIBE Standard"
priority: P1
tags: [development, coding-standards, vibe]
agents: [*]
---

# ⚖️ Development Rules - VIBE Standard

**"Quân pháp bất vị thân"** - Kỷ luật là sức mạnh của đội quân AI.

## 1. Nguyên Tắc Cốt Lõi (The Trinity)
1.  **YAGNI (You Aren't Gonna Need It):** Không code thừa. Nếu chưa cần dùng ngay, đừng viết.
2.  **KISS (Keep It Simple, Stupid):** Đơn giản nhất có thể. Code dễ đọc > Code thông minh.
3.  **DRY (Don't Repeat Yourself):** Không lặp lại. Tách hàm, tách module.

## 2. Quy Trình VIBE (VIBE Workflow)
Mọi thay đổi code đều phải tuân thủ quy trình 6 bước:
1.  **Detection:** Xác định `plan.md`.
2.  **Analysis:** Phân tích task.
3.  **Implementation:** Viết code.
4.  **Testing:** Chạy `pytest` hoặc `npm test`. **BẮT BUỘC 100% PASS.**
5.  **Review:** Tự đánh giá hoặc dùng `code-reviewer`.
6.  **Finalize:** Commit và update docs.

## 3. Quản Lý File & Folder
- **Naming:** `kebab-case` (ví dụ: `revenue-engine.py`, `client-magnet.ts`).
- **Limit:** Tối đa **250 dòng/file**. Nếu dài hơn -> Refactor ngay lập tức.
- **Plans:** Mọi kế hoạch phải nằm trong `plans/{date}-{slug}/`.

## 4. Bảo Mật & An Toàn (Security First)
- **Secrets:** KHÔNG BAO GIỜ commit `.env`, API Keys, Password.
- **Privacy Hook:** Tôn trọng `privacy-block.cjs`. Nếu bị chặn, hãy hỏi người dùng.
- **Data:** Không dùng dữ liệu thật của khách hàng để test. Dùng Mock Data.

## 5. Cam Kết (Commit Standards)
Sử dụng Conventional Commits:
- `feat(scope): ...` - Tính năng mới.
- `fix(scope): ...` - Sửa lỗi.
- `refactor(scope): ...` - Tối ưu code.
- `docs(scope): ...` - Cập nhật tài liệu.

**Tuyệt đối không:** Commit code bị lỗi hoặc chưa qua test.

> 🏯 **"Thắng từ trong chuẩn bị"** - Code sạch là code chiến thắng.

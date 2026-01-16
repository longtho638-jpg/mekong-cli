# 🏯 Plan: Synchronization & User Onboarding (Non-Tech Friendly)

> **Goal:** Đồng bộ hóa Mekong-Docs và Mekong-CLI, tạo quy trình "Vibe Coding" chuẩn mực cho người dùng Non-Tech (AgencyER). Đảm bảo "Pull về là dùng được ngay".

## 1. Hiện Trạng & Vấn Đề (Diagnosis)
*   **Core:** Đã có `Architect` (tạo blueprint) và `Kanban` (quản lý task).
*   **Gap:** User mới (Non-tech) chưa biết cách phối hợp 2 công cụ này. Họ cần một "SOP" (Quy trình chuẩn) để biến ý tưởng thành phần mềm mà không cần biết code.
*   **Disconnected:** Tài liệu (`README.md`) chưa phản ánh các tính năng mới vừa code (`/scaffold`, `/kanban`).

## 2. Chiến Lược Đồng Bộ (Synchronization Strategy)

### Phase 1: The "Vibe Coding" Manual (Giáo Trình)
Tạo tài liệu hướng dẫn "Cầm tay chỉ việc" (`docs/VIBE_CODING_MANUAL.md`):
*   **Bước 1: Tư Duy (Architect):** Dùng `agencyos scaffold` để lấy "Bản vẽ móng".
*   **Bước 2: Ra Lệnh (AI):** Paste bản vẽ vào Claude/Gemini.
*   **Bước 3: Quản Lý (Kanban):** Dùng `agencyos kanban` để theo dõi tiến độ.

### Phase 2: CLI "Concierge" (Lễ Tân)
Update `cli/main.py`:
*   Thêm lệnh `/guide`: Hiển thị hướng dẫn nhanh ngay trên terminal.
*   Update `/help`: Sắp xếp lại command theo luồng công việc (Workflow).

### Phase 3: .claude Integration (Bộ Não)
Update `.claude/rules/primary-workflow.md`:
*   Dạy AI biết rằng khi user hỏi "Làm sao để bắt đầu?", hãy chỉ họ dùng `/guide` hoặc `/scaffold`.

### Phase 4: Final Polish (Đánh Bóng)
*   Update `README.md` chính của repo.
*   Đảm bảo `scripts/setup_vibe_kanban.sh` được nhắc đến trong quy trình setup.

## 3. Workflow Chuẩn (The Happy Path)

1.  **User:** `agencyos scaffold "Tôi muốn làm app quản lý kho hàng"`
2.  **System:** Trả về Structure + Prompt.
3.  **User:** Paste Prompt vào AI Editor.
4.  **AI:** Generate code theo Clean Architecture.
5.  **User:** `agencyos kanban create "Code module Inventory"`
6.  **User:** `agencyos ship`

## 4. Execution Steps

1.  Create `docs/VIBE_CODING_MANUAL.md`.
2.  Update `cli/main.py` (Add `run_guide`, Refine `print_help`).
3.  Update `README.md`.
4.  Update `.claude/rules`.
5.  Final Test (`/test`).

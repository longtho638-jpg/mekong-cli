# 🏯 Plan: Democratize Architecture (Dev & AgencyER)

> **Goal:** Biến kiến trúc phần mềm phức tạp (DDD, Hexagonal) thành "nút bấm" đơn giản cho cả Dev và Non-tech User (AgencyER).
> **Philosophy:** "Ẩn sự phức tạp, lộ sự đơn giản" (Hide complexity, reveal simplicity).

## 1. Phân Tích Đối Tượng (Audience)

| Đối tượng | Nhu cầu | Giải pháp (The "Bridge") |
| :--- | :--- | :--- |
| **Developer** | Cần cấu trúc chuẩn, flexibility, không muốn setup tay. | CLI `scaffold` command tạo boilerplate chuẩn Clean Arch. |
| **AgencyER (Non-tech)** | Cần "App chạy ổn", "Scale được", không hiểu DDD là gì. | AI "Architect" tự động chọn kiến trúc dựa trên mô tả dự án. |

## 2. Chiến Lược Thực Thi (Execution)

Chúng ta sẽ xây dựng một **"Architect Agent"** (Logic đơn giản) nằm giữa User và Codebase.

### Phase 1: The "Architect" Brain (Logic)
- [ ] Tạo module `core/modules/architect/`:
    -   Phân tích yêu cầu user (e.g., "Làm app bán hàng" vs "Làm landing page").
    -   Tự động map sang `ArchitectureType` (Simple, Clean, Hexagonal).
    -   Chuẩn bị "Context Prompt" để nạp cho AI (Claude/Gemini).

### Phase 2: The CLI Bridge (Interface)
- [ ] Thêm command `/scaffold` (hoặc tích hợp vào `/cook`):
    -   Input: "Tôi muốn làm một hệ thống CRM quản lý bất động sản".
    -   Output:
        1.  Tự động chọn **Clean Architecture**.
        2.  Tạo cấu trúc thư mục rỗng chuẩn chỉ.
        3.  Sinh ra một đoạn **System Instruction** để user paste vào khung chat AI tiếp theo (để AI biết phải code tiếp thế nào).

### Phase 3: Templates for Non-Tech (Khuôn mẫu)
- [ ] Tạo các "Prompt Templates" sẵn cho các loại dự án phổ biến (SaaS, E-commerce, Internal Tool).

## 3. Implementation Steps

1.  **Code Module Architect:** `core/modules/architect/`
2.  **Define Architecture Types:** Enum cho `MVPs`, `SaaS`, `Enterprise`.
3.  **CLI Integration:** Update `main.py`.
4.  **Prompt Generator:** Hàm sinh prompt "ép" AI tuân thủ kiến trúc đã chọn.

## 4. Output Artifacts

*   `core/modules/architect/services.py`
*   `cli/main.py` (Updated)
*   `.agencyos/prompts/architecture_injection.md` (Context nạp cho AI)

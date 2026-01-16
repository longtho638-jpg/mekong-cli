# 🧘 Vibe Coding Manual: Từ Ý Tưởng Đến Phần Mềm (Dành cho Non-Tech)

Chào mừng bạn đến với **Antigravity IDE** - Nơi bạn không cần viết code, mà chỉ cần "điều khiển" AI viết code cho bạn.

Hãy tưởng tượng bạn là **Kiến Trúc Sư Trưởng (Chief Architect)**, và AI là đội thợ xây lành nghề. Để xây nhà đẹp, bạn cần bản vẽ chuẩn.

---

## 🚀 Quy Trình 3 Bước (The Vibe Flow)

### Bước 1: Lấy "Bản Vẽ Móng" (Architect)
Đừng bảo AI "Code cho anh cái app". Nó sẽ làm bừa. Hãy dùng công cụ **Architect Agent** để lấy bản thiết kế chuẩn.

1.  Mở Terminal.
2.  Gõ lệnh mô tả ý tưởng của bạn:
    ```bash
    agencyos scaffold "Tôi muốn làm một SaaS quản lý nhân sự (HRM) có tính lương"
    ```
3.  **Kết quả:** Hệ thống sẽ phân tích và đưa ra:
    *   Kiến trúc phù hợp (Ví dụ: Clean Architecture).
    *   Cấu trúc thư mục.
    *   **QUAN TRỌNG:** Một đoạn văn bản (Prompt) nằm giữa 2 dòng cắt (`✂️`).

### Bước 2: Ra Lệnh Cho Thợ Xây (AI Coding)
1.  Copy đoạn Prompt ở Bước 1.
2.  Mở AI Editor (Claude/Cursor/Windsurf).
3.  Paste đoạn Prompt vào và nhấn Enter.
4.  **Điều kỳ diệu:** AI sẽ tự động tạo file, folder theo đúng chuẩn kỹ thuật cao cấp nhất mà không cần bạn nhắc.

### Bước 3: Theo Dõi Tiến Độ (Kanban)
Để tránh bị lạc trong đống code, hãy dùng bảng Kanban.

1.  Tạo task mới:
    ```bash
    agencyos kanban create "Code module Tính Lương" --agent fullstack-dev
    ```
2.  Xem tiến độ:
    ```bash
    agencyos kanban board
    ```

---

## 🛠️ Bộ Lệnh Cần Nhớ (Cheat Sheet)

| Bạn muốn gì? | Gõ lệnh này |
| :--- | :--- |
| **Bắt đầu dự án mới** | `agencyos scaffold "Mô tả ý tưởng"` |
| **Xem danh sách việc** | `agencyos kanban board` |
| **Thêm việc mới** | `agencyos kanban create "Tên việc"` |
| **Xem chiến lược** | `agencyos binh-phap "Tên dự án"` |
| **Đẩy code lên mạng** | `agencyos ship` |

---

## 💡 Mẹo Cho "Vibe Coder"

*   **Tư duy làm chủ:** Bạn không sửa lỗi cú pháp (syntax error). Bạn ra lệnh sửa lỗi logic.
*   **Tin vào quy trình:** Nếu AI viết code sai, đừng sửa tay. Hãy dùng `scaffold` để tạo lại hướng dẫn chi tiết hơn.
*   **Luôn bắt đầu bằng Architecture:** Một ngôi nhà tốt bắt đầu từ móng. Một phần mềm tốt bắt đầu từ `agencyos scaffold`.

*Chúc bạn Vibe Coding vui vẻ!* 🏯

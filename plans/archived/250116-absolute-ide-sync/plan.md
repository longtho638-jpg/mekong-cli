# 🔒 Plan: Absolute Antigravity IDE Synchronization

> **Goal:** Thiết lập "Độc tôn" (Exclusivity) cho Antigravity IDE. Ngăn chặn sự phân mảnh logic do sử dụng IDE khác (VSCode thuần, Sublime, etc.).
> **Philosophy:** "Một Bầu Trời, Một Mặt Trời" (One Sky, One Sun).

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1.  **Single Source of Truth (SSOT):** Cấu hình IDE (Settings, Extensions, Keybindings) không nằm trong `.vscode` mà nằm trong `antigravity/ide_config.py`.
2.  **Enforced Environment:** Khi khởi động, CLI sẽ **tự động ghi đè** cấu hình `.vscode` và `.cursorrules` để đảm bảo đồng bộ tuyệt đối.
3.  **Identity Check:** CLI sẽ kiểm tra "Signature" của môi trường. Nếu phát hiện môi trường lạ, nó sẽ cảnh báo hoặc từ chối thực thi lệnh quan trọng.

## 2. Chiến Lược Thực Thi (Execution Strategy)

### Phase 1: The "Nucleus" (Bộ Gen)
Tạo module `core/modules/ide/` chứa cấu hình chuẩn:
*   **Extensions:** Python, ESLint, Tailwind, Docker.
*   **Settings:** Format on Save, Tab Size, Ruler, Excludes.
*   **Rules:** `.cursorrules` (cho AI Context).

### Phase 2: The "Enforcer" (Cảnh Vệ)
Tạo command `agencyos ide sync`:
*   Xóa/Ghi đè `.vscode/settings.json`.
*   Xóa/Ghi đè `.vscode/extensions.json`.
*   Xóa/Ghi đè `.cursorrules`.
*   Tạo `.editorconfig` chuẩn.

### Phase 3: The "Lock" (Khóa)
*   Thêm check vào `main.py`: Trước khi chạy bất kỳ lệnh nào (`scaffold`, `kanban`), kiểm tra xem cấu hình IDE có khớp với "Nucleus" không. Nếu không -> Bắt buộc chạy `ide sync`.

## 3. Implementation Steps

1.  **Create Module:** `core/modules/ide` (Entities & Services).
2.  **Define Configs:** Hardcode các setting tối ưu nhất cho AgencyOS.
3.  **CLI Command:** `agencyos ide sync` và `agencyos ide check`.
4.  **Auto-Hook:** Tự động chạy check khi khởi động CLI.

## 4. Output Artifacts

*   `core/modules/ide/constants.py` (Chứa cấu hình JSON chuẩn).
*   `core/modules/ide/services.py` (Logic ghi file).
*   `cli/main.py` (Tích hợp lệnh mới).

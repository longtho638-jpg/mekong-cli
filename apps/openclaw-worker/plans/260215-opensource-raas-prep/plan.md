# Kế hoạch: Open Source Readiness & RaaS Foundation

## 🎯 Mục tiêu
Chuẩn bị mekong-cli monorepo để public open-source và xây dựng nền tảng Revenue-as-a-Service (RaaS).

## 📋 Giai đoạn 1: Open Source Readiness Audit
1.  **README.md Overhaul**: Viết lại docs chuẩn developer thế giới.
2.  **Security Audit**: Quét hardcoded secrets, .env, config files.
3.  **Clean Internal Files**: Loại bỏ file nội bộ, logs.
4.  **Package Structure**: Chuẩn hóa package.json, workspace.

## 📋 Giai đoạn 2: RaaS Foundation
5.  **Monetization Hooks**: Tài liệu hóa Antigravity Proxy layer.
6.  **Developer Experience (DX)**: Đảm bảo install sạch, task ví dụ.

## 🛠 Phân công Agent Teams (Parallel)
- **Code Reviewer**: Audit bảo mật, tìm secrets, file nội bộ.
- **Fullstack Developer**: Draft README, CONTRIBUTING, RaaS docs.
- **Tester**: Kiểm tra quy trình install, build scripts.
- **Debugger**: Tìm hardcoded paths/logic nội bộ.

## ⚠️ Ràng buộc
- Chỉ sửa TỐI ĐA 5 file.
- Báo cáo danh sách các file còn lại cần xử lý.

# 🧙‍♂️ Antigravity Setup Wizard (Thủy Kế)

**Antigravity Wizard** là công cụ CLI tương tác giúp người dùng (kể cả Non-Tech) thiết lập môi trường phát triển Antigravity IDE một cách tự động và tối ưu nhất.

## 🚀 Tính Năng (Features)

1. **Auto-Detection (Tự động phát hiện):**
   - Kiểm tra phần cứng (CPU, RAM, Disk).
   - Kiểm tra tốc độ mạng (Speedtest).
   - Xác định Hệ điều hành & Kiến trúc.

2. **Gap Analysis (Phân tích khoảng cách):**
   - So sánh cấu hình hiện tại với yêu cầu tối thiểu.
   - Đưa ra khuyến nghị nâng cấp (RAM, Internet, v.v.).

3. **Guided Installation (Cài đặt hướng dẫn):**
   - Cài đặt/Cập nhật thư viện Python.
   - Kiểm tra & tạo file cấu hình `.env`.
   - Khởi tạo cấu trúc dự án chuẩn.

4. **Vietnamese First (Ưu tiên tiếng Việt):**
   - Giao diện thân thiện, ngôn ngữ tự nhiên.
   - Tích hợp tư duy "Binh Pháp" vào quy trình.

## 📦 Yêu Cầu (Requirements)

- Python 3.8+
- Các thư viện (tự động cài đặt nếu thiếu):
  - `rich`
  - `questionary`
  - `psutil`
  - `speedtest-cli`

## 🛠️ Hướng Dẫn Sử Dụng (Usage)

### 1. Chạy Wizard

Mở terminal tại thư mục gốc của dự án `mekong-cli` và chạy lệnh:

```bash
python3 scripts/antigravity-wizard.py
```

### 2. Quy Trình

1. **Chào mừng:** Giới thiệu Antigravity IDE.
2. **Kiểm tra:** Tool sẽ tự động quét hệ thống (mất khoảng 10-30s).
3. **Báo cáo:** Xem bảng báo cáo chi tiết về tình trạng máy.
4. **Hành động:** Chọn các bước cài đặt bạn muốn thực hiện.
5. **Hoàn tất:** Nhận thông báo thành công và hướng dẫn bước tiếp theo.

## 📝 Troubleshooting

- **Lỗi Permission:** Nếu gặp lỗi quyền truy cập, hãy thử chạy với `sudo` (Linux/macOS) hoặc Run as Administrator (Windows).
- **Lỗi Mạng:** Nếu Speedtest thất bại, wizard sẽ bỏ qua và tiếp tục các bước khác.

---
*Developed by Antigravity Team - Powered by Claude Code*

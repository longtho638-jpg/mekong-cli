---
description: Hướng dẫn cài đặt AntiBridge cho người không biết code (wizard tiếng Việt)
---

# 🌉 Bridge-Easy - AntiBridge cho Mọi Người

> Điều khiển AI từ điện thoại chỉ với vài bước đơn giản.

// turbo-all

## Bước 1: Chọn mục tiêu

```
🌉 ANTIBRIDGE WIZARD
═══════════════════════════════════════

Bạn muốn làm gì?

1. 📱 Cài đặt lần đầu
2. 🚀 Khởi động server
3. 📲 Kết nối từ điện thoại (LAN)
4. 🌐 Truy cập từ bên ngoài (Tailscale)
5. 🔧 Sửa lỗi thường gặp

Nhập số (1-5):
```

## Bước 2: Hướng dẫn theo lựa chọn

### Nếu chọn 1 (Cài đặt lần đầu):

```
📦 CÀI ĐẶT LẦN ĐẦU

Bước 1: Tải AntiBridge
   - Vào: github.com/linhbanbanhbao/AntiBridge
   - Nhấn nút xanh "Code" → Download ZIP
   - Giải nén ra folder

Bước 2: Cài Node.js (nếu chưa có)
   - Vào: nodejs.org
   - Tải bản LTS (nút xanh lớn)
   - Cài đặt xong restart máy

Bước 3: Chạy Setup
   - Mở folder AntiBridge
   - Double-click: SETUP.bat
   - Đợi cài xong (1-2 phút)

✅ Xong! Tiếp tục bước 2 để khởi động.
```

### Nếu chọn 2 (Khởi động server):

```
🚀 KHỞI ĐỘNG SERVER

Bước 1: Mở Antigravity với CDP
   - Double-click: OPEN_ANTIGRAVITY.vbs
   - Đợi Antigravity IDE mở lên

Bước 2: Chạy Server
   - Right-click: START.bat
   - Chọn "Run as administrator"
   - Cửa sổ đen hiện ra = Thành công!

Bước 3: Mở trình duyệt
   - Vào: http://localhost:8000
   - Thấy giao diện chat = OK!

✅ Server đang chạy! Giờ có thể kết nối từ điện thoại.
```

### Nếu chọn 3 (Kết nối từ điện thoại LAN):

```
📲 KẾT NỐI TỪ ĐIỆN THOẠI (CÙNG WIFI)

Bước 1: Tìm IP máy tính
   - Mở Command Prompt (gõ cmd trong Start)
   - Gõ: ipconfig
   - Tìm dòng "IPv4 Address": 192.168.x.x

Bước 2: Mở trên điện thoại
   - Kết nối cùng WiFi với máy tính
   - Mở trình duyệt điện thoại
   - Gõ: http://192.168.x.x:8000

✅ Xong! Chat với AI từ điện thoại nhé!
```

### Nếu chọn 4 (Truy cập từ bên ngoài):

```
🌐 TRUY CẬP TỪ BẤT KỲ ĐÂU (TAILSCALE)

Bước 1: Cài Tailscale trên MÁY TÍNH
   - Vào: tailscale.com/download/windows
   - Tải và cài đặt
   - Đăng nhập (dùng Google/Microsoft)

Bước 2: Cài Tailscale trên ĐIỆN THOẠI
   - App Store hoặc Play Store
   - Tìm "Tailscale"
   - Cài và đăng nhập cùng tài khoản

Bước 3: Lấy IP Tailscale
   - Mở Tailscale trên máy tính
   - Xem IP (dạng 100.x.x.x)

Bước 4: Kết nối
   - Trên điện thoại, mở trình duyệt
   - Gõ: http://100.x.x.x:8000

✅ Bạn có thể dùng AI từ bất kỳ đâu có internet!

💡 Lưu ý: Tailscale miễn phí với 100 thiết bị!
```

### Nếu chọn 5 (Sửa lỗi):

```
🔧 SỬA LỖI THƯỜNG GẶP

❌ Server không chạy?
   → Kiểm tra Node.js: gõ "node --version" trong cmd
   → Nếu báo lỗi: cài lại Node.js
   → Chạy lại SETUP.bat

❌ Không kết nối được từ trình duyệt?
   → Kiểm tra server đang chạy (có cửa sổ đen)
   → Thử http://localhost:8000 trước
   → Tắt tạm Windows Firewall để test

❌ AI không trả lời?
   → Dùng OPEN_ANTIGRAVITY.vbs để mở Antigravity
   → Kiểm tra cửa sổ server có lỗi gì không
   → Restart lại cả 2 (Antigravity + Server)

❌ Tailscale không kết nối?
   → Đảm bảo 2 thiết bị đăng nhập cùng tài khoản
   → Kiểm tra cả 2 đều hiện "Connected"
   → Thử tắt/bật lại Tailscale trên cả 2
```

## Các lệnh hữu ích

| Việc cần làm   | File/Lệnh                  |
| -------------- | -------------------------- |
| Cài đầu        | `SETUP.bat`                |
| Mở Antigravity | `OPEN_ANTIGRAVITY.vbs`     |
| Chạy server    | `START.bat` (Run as admin) |
| Xem IP máy     | `ipconfig` trong cmd       |
| Test local     | http://localhost:8000      |

# Phân tích Lỗi Kết nối (Network Connection Refused) - AgencyOS Web

**Ngày ghi nhận:** 14/02/2026
**Mã lỗi:** `net::ERR_CONNECTION_REFUSED`
**Đối tượng ảnh hưởng:** Quy trình xác minh tự động (Hunter Verification)

---

## 1. Hiện trạng (Observations)
Hệ thống ghi nhận 3 lần thất bại liên tiếp với cùng một thông báo lỗi từ Playwright/Hunter:
> `Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/`

## 2. Phân tích Nguyên nhân (Root Cause Analysis)
- **Thiếu máy chủ runtime:** Quy trình xác minh cố gắng truy cập `localhost:3000` nhưng không có lệnh khởi động máy chủ (`npm run dev` hoặc `npm run start`) được thực hiện trước đó trong ngữ cảnh của worker/CI.
- **Race Condition:** Nếu có lệnh khởi động, có thể quy trình kiểm tra chạy quá sớm trước khi máy chủ kịp "listen" trên cổng 3000.
- **Cấu hình Cổng (Port):** Có khả năng ứng dụng đang chạy trên một cổng khác (ví dụ: 3001) do xung đột, nhưng script kiểm tra vẫn mặc định là 3000.

## 3. Knowledge Items (Kiến thức rút ra)

### ⚠️ Cần tránh (Anti-patterns)
1. **Hardcoded Verification URL:** Chỉ định cứng `http://localhost:3000` trong các script kiểm tra mà không có cơ chế fallback hoặc kiểm tra trạng thái cổng.
2. **Thiếu cơ chế "Wait-on":** Chạy các lệnh E2E test hoặc verification mà không sử dụng các công cụ như `wait-on` để đảm bảo endpoint đã sẵn sàng.

### 🔍 Điểm mù (Blind Spots)
- Quy trình `hunter` hiện tại chưa tự động khởi động môi trường test cục bộ cho `agencyos-web` trước khi xác minh.
- Thiếu log chi tiết về trạng thái các tiến trình (processes) đang chạy trên worker tại thời điểm lỗi.

## 4. Đề xuất Hành động (Action Plan)
1. **Cấu hình Verification Script:** Cập nhật script xác minh để sử dụng `start-server-and-test` hoặc thêm bước check port.
2. **Environment Awareness:** Đảm bảo worker có đủ tài nguyên (RAM/M1 Cooling) để chạy máy chủ Next.js trong khi thực hiện xác minh.
3. **Debugger Investigation:** Giao cho `debugger` agent kiểm tra file cấu hình verification của project.

---
*Báo cáo được tổng hợp bởi Antigravity Agent dựa trên dữ liệu từ Hunter Alerts.*

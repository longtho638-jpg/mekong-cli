# KẾ HOẠCH TRIỂN KHAI: Overage Billing và Dunning Workflows cho Algo-Trader

## Mục tiêu
Triển khai hệ thống thanh toán vượt mức và quy trình thu hồi nợ tự động cho hệ thống Algo-Trader bằng cách mở rộng tích hợp Stripe/Polar hiện tại.

## Các thành phần cần phát triển

### 1. Cấu hình giá dựa trên mức sử dụng trong Polar
- Thiết lập các cấp độ giá cho phút tính toán và số lần gọi API
- Tích hợp với hệ thống Polar hiện tại
- Định nghĩa các loại mức sử dụng: compute_minutes, api_calls

### 2. Tác vụ cron hàng ngày trong RaaS Gateway worker
- Thu thập dữ liệu sử dụng từ nhật ký KV
- Tính toán mức sử dụng vượt quá cho từng người thuê
- Gửi dữ liệu vượt mức đến API thanh toán theo định lượng của Polar

### 3. Chuỗi thu hồi nợ qua email/SMS
- Tích hợp Resend cho email và Twilio cho SMS
- Tự động hóa chuỗi theo dõi thanh toán chưa thanh toán
- Tích hợp vào bảng điều khiển AgencyOS

### 4. Chỉ báo "Billing Health" trong bảng điều khiển Analytics
- Hiển thị thời gian thực tỷ lệ hạn mức sử dụng/nhập quỹ
- Hiển thị trạng thái thanh toán
- Cảnh báo mức sử dụng gần đạt hạn mức

## Thành phần cụ thể cần xây dựng

### A. Bộ đếm mức sử dụng định kỳ (Daily Cron Job)
```typescript
// File: apps/raas-gateway/workers/daily-usage-aggregator.ts
// - Đọc dữ liệu từ KV logs
// - Tổng hợp theo tenant
// - Gửi đến Polar API
```

### B. Trình xử lý webhook Stripe
```typescript
// File: src/billing/stripe-webhook-handler.ts
// - Xử lý sự kiện hóa đơn Stripe
// - Kích hoạt chuỗi thu hồi nợ
// - Cập nhật trạng thái thanh toán người dùng
```

### C. Trình tạo chuỗi thu hồi nợ
```typescript
// File: src/billing/dunning-sequencer.ts
// - Tạo và gửi email/SMS nhắc nhở
// - Quản lý trạng thái thu hồi nợ
// - Tích hợp Resend và Twilio
```

### D. Trình cung cấp chỉ báo sức khỏe thanh toán
```typescript
// File: src/analytics/billing-health-indicator.ts
// - Truy vấn trạng thái thanh toán theo thời gian thực
// - Tích hợp vào bảng điều khiển
```

## Kế hoạch thực hiện

### Giai đoạn 1: Thiết lập hệ thống mức sử dụng
- [ ] Cấu hình định nghĩa mức sử dụng trong Polar
- [ ] Cập nhật hệ thống ghi nhật ký mức sử dụng hiện tại

### Giai đoạn 2: Triển khai công việc tổng hợp hàng ngày
- [ ] Tạo tác vụ cron để tổng hợp dữ liệu mức sử dụng
- [ ] Triển khai trình xử lý gửi dữ liệu đến Polar

### Giai đoạn 3: Triển khai chuỗi thu hồi nợ
- [ ] Tích hợp Resend cho email
- [ ] Tích hợp Twilio cho SMS
- [ ] Triển khai máy trạng thái thu hồi nợ

### Giai đoạn 4: Tích hợp vào bảng điều khiển
- [ ] Thêm chỉ báo sức khỏe thanh toán
- [ ] Tích hợp trạng thái thanh toán thời gian thực

## Tệp liên quan cần sửa đổi
- `src/billing/usage-event-emitter.ts` - cập nhật để hỗ trợ mức sử dụng định lượng
- `src/billing/stripe-invoice-service.ts` - thêm xử lý webhook và thông báo
- `src/billing/overage-calculator.ts` - thêm logic tính toán vượt mức
- `src/billing/dunning-state-machine.ts` - hoàn thiện máy trạng thái thu hồi nợ
- `src/billing/usage-billing-adapter.ts` - cập nhật để tương thích với định lượng Polar

## Kết luận
Kế hoạch này sẽ thực hiện đầy đủ yêu cầu của bạn về việc thiết lập thanh toán vượt mức và quy trình thu hồi nợ cho hệ thống Algo-Trader.
# /nong-san - Phân tích giá nông sản ĐBSCL

Spawn agent: `mekong-market-analyst`

## Mục đích

Phân tích giá nông sản real-time cho vùng Đồng Bằng Sông Cửu Long.

## Cách sử dụng

```
/nong-san "gạo ST25"
/nong-san "xoài cát Hòa Lộc"
/nong-san "cá tra fillet"
```

## Workflow

1. **Xác định sản phẩm**
   - Parse input để xác định loại nông sản
   - Map đến category (lúa gạo, trái cây, thủy sản, gia súc)

2. **Thu thập dữ liệu**
   - Query từ sources đã cấu hình
   - Aggregate prices từ các chợ đầu mối

3. **Phân tích**
   - So sánh với tuần trước, tháng trước
   - Identify trends và anomalies
   - Dự đoán xu hướng ngắn hạn

4. **Báo cáo**
   ```markdown
   ## Báo cáo giá: [Sản phẩm]
   
   📅 Ngày: [date]
   📍 Khu vực: ĐBSCL
   
   ### Giá hiện tại
   | Chợ | Giá (VNĐ) | Thay đổi |
   |-----|-----------|----------|
   | Bình Điền | xxx | +5% |
   | Cần Thơ | xxx | +3% |
   
   ### Xu hướng
   [Chart/description]
   
   ### Khuyến nghị
   - [Action item 1]
   - [Action item 2]
   ```

## Ví dụ Output

```
🌾 Giá Gạo ST25 - 15/12/2025

📍 ĐBSCL Average: 28,000 VNĐ/kg

Chợ Bình Điền: 28,500 VNĐ (+2.1%)
Chợ Cần Thơ: 27,800 VNĐ (+1.5%)
Giá thu mua: 25,000 VNĐ

📈 Xu hướng: Tăng nhẹ do chuẩn bị Tết
⚠️ Cảnh báo: Giá có thể đạt đỉnh trong 2 tuần

💡 Khuyến nghị: Cân nhắc mua vào trước kỳ nghỉ lễ
```

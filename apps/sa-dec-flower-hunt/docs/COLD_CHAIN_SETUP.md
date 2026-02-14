# Cold Chain IoT Integration - Hướng Dẫn Cấu Hình

## 1. Thêm Resend API Key vào .env.local

```bash
# Thêm dòng này vào file .env.local
RESEND_API_KEY=re_eeRzkAdF_KtdySYX42rASqmcDHuXF4wbr
```

## 2. Thiết Bị IoT Tương Thích

### Đề xuất thiết bị Cold Chain:
| Thiết bị | Giá (USD) | Tính năng |
|----------|-----------|-----------|
| **Tive Solo 5G** | ~$15/tháng | GPS + Nhiệt độ + Độ ẩm |
| **Sensitech TempTale** | ~$50/lần | Nhiệt độ (dùng 1 lần) |
| **Emerson GO Real-Time** | ~$25/tháng | Realtime GPS + Temp |
| **ESP32 + DHT22 (DIY)** | ~$10 | Tự build, cần WiFi |

### Giải pháp DIY với ESP32:
```
ESP32 + DHT22 + GPS Module NEO-6M
├── Gửi data qua HTTP POST đến /api/cold-chain/ingest
├── Interval: mỗi 5 phút
└── Chi phí: ~200,000 VNĐ/bộ
```

## 3. Webhook Format (cho thiết bị gửi data)

```json
POST /api/cold-chain/ingest
{
  "device_id": "SENSOR_001",
  "shipment_id": "SHIP_12345",
  "readings": {
    "temperature": 4.2,
    "humidity": 85,
    "latitude": 10.2899,
    "longitude": 105.7231
  },
  "timestamp": "2025-12-09T09:15:00Z"
}
```

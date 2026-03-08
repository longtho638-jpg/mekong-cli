# Hướng Dẫn Triển Khai Report Ingestion Service

## Mô Tả
Dịch vụ Report Ingestion là một phần của hệ thống RaaS Analytics Dashboard, cho phép tải lên các báo cáo chiến lược định dạng markdown hoặc JSON. Dịch vụ xác thực mk_ API key và JWT, phân tích các chỉ số chính, lưu trữ trong RaaS KV và kích hoạt webhook cập nhật bảng điều khiển AgencyOS.

## Các Thành Phần Chính

### 1. Endpoint Cloudflare Worker
- Đường dẫn: `raas.agencyos.network/v1/reports/ingest`
- Phương thức: POST
- Chấp nhận định dạng: `application/json`, `text/markdown`, `text/plain`

### 2. Xác Thực
- API key định dạng `mk_`
- JWT token (tuỳ chọn)
- Idempotency keys để ngăn trùng lặp

### 3. Phân Tích Báo Cáo
- Trích xuất ROI, độ trễ, tỷ lệ lỗi từ báo cáo
- Hỗ trợ cả định dạng markdown và JSON

### 4. Lưu Trữ
- Sử dụng RaaS KV namespace để lưu metrics
- Sử dụng idempotency keys để ngăn xử lý trùng lặp

### 5. Webhook
- Kích hoạt cập nhật bảng điều khiển AgencyOS
- Gửi dữ liệu metrics đã phân tích

## Cài Đặt

1. Cập nhật `wrangler.toml` với thông tin namespace KV:
```toml
[[kv_namespaces]]
binding = "REPORTS_KV"
id = "your_actual_kv_namespace_id"
preview_id = "your_actual_preview_kv_namespace_id"
```

2. Đặt biến môi trường cho webhook:
```bash
wrangler secret put AGENCYOS_WEBHOOK_AUTH_TOKEN
```

3. Triển khai worker:
```bash
wrangler deploy
```

## Cách Dùng API

### Tải lên báo cáo JSON:
```bash
curl -X POST https://raas.agencyos.network/v1/reports/ingest \
  -H "Authorization: Bearer mk_your_api_key" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-identifier" \
  -H "Project-Namespace: your-project" \
  -d '{
    "roi": 1.25,
    "latency": 120,
    "errorRate": 0.02
  }'
```

### Tải lên báo cáo Markdown:
```bash
curl -X POST https://raas.agencyos.network/v1/reports/ingest \
  -H "Authorization: Bearer mk_your_api_key" \
  -H "Content-Type: text/markdown" \
  -H "Idempotency-Key: unique-request-identifier" \
  -H "Project-Namespace: your-project" \
  -d '# Performance Report
ROI: 1.25
Latency: 120ms
Error Rate: 2%'
```

## Bảo Mật
- Chỉ chấp nhận API keys có tiền tố `mk_`
- Hỗ trợ xác thực JWT tùy chọn
- Sử dụng idempotency keys để tránh xử lý trùng lặp
- Dữ liệu được lưu trữ trong KV có thời hạn
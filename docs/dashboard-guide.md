# Mekong Analytics Dashboard Guide

📊 Dashboard analytics thời gian thực cho RaaS Agency Operating System.

---

## Tổng quan

Mekong Analytics Dashboard cung cấp cái nhìn toàn diện về:

- **API Usage**: Số lượng API calls theo ngày/tuần/tháng
- **License Health**: Trạng thái license, tier distribution, renewal prompts
- **Revenue Tracking**: Ước tính MRR theo tier
- **Rate Limit Events**: Theo dõi vi phạm rate limit
- **Telemetry**: CLI usage statistics

---

## Quick Start

### Launch Dashboard

```bash
# Launch với default settings (port 8080, auto-open browser)
mekong dashboard launch

# Launch với custom port
mekong dashboard launch --port 9000

# Launch không mở browser
mekong dashboard launch --no-browser

# Launch với custom host
mekong dashboard launch --host 0.0.0.0 --port 8888
```

Dashboard sẽ mở tại: `http://localhost:<port>`

---

## CLI Commands

### `mekong dashboard launch`

Khởi chạy server dashboard với các tùy chọn:

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--port` | `-p` | 8080 | Server port |
| `--host` | `-h` | 127.0.0.1 | Bind host |
| `--no-browser` | `-n` | false | Không mở browser tự động |

**Examples:**

```bash
mekong dashboard launch -p 9000 -h 0.0.0.0
mekong dashboard launch --no-browser
```

---

### `mekong dashboard status`

Kiểm tra health của dashboard và database:

```bash
mekong dashboard status
```

**Output:**

```
📊 Dashboard Status

✓ Dashboard Healthy

┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Component       ┃ Status  ┃ Details                ┃
┡━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Database        │ ✅      │ Connected              │
│ Cache           │ ✅      │ 5 entries              │
│ API Usage Data  │ ✅      │ 30 data points         │
│ License Data    │ ✅      │ 847 active             │
│ Rate Limit      │ ✅      │ 156 events             │
│ License Health  │ ✅      │ 782 active, 19 expiring│
└─────────────────┴─────────┴────────────────────────┘
```

---

### `mekong dashboard export`

Export dữ liệu analytics ra CSV hoặc JSON.

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--format` | `-f` | csv | Export format (csv/json) |
| `--output` | `-o` | - | Output file path (required) |
| `--start` | `-s` | - | Start date (YYYY-MM-DD) |
| `--end` | `-e` | - | End date (YYYY-MM-DD) |
| `--key` | `-k` | - | Filter by license key |
| `--days` | `-d` | 30 | Number of days |

**Examples:**

```bash
# Export 30 ngày gần nhất ra CSV
mekong dashboard export -f csv -o usage.csv

# Export ra JSON
mekong dashboard export -f json -o analytics.json

# Export với date range custom
mekong dashboard export -f csv -o march.csv --start 2026-03-01 --end 2026-03-31

# Export dữ liệu của 1 license cụ thể
mekong dashboard export -f json -o pro-data.json --key sk-pro-xxx

# Export 7 ngày gần nhất
mekong dashboard export -f csv -o weekly.csv --days 7
```

---

### `mekong dashboard summary`

Hiển thị quick summary trong terminal:

```bash
mekong dashboard summary
```

**Output:**

```
📊 Analytics Summary

Key Metrics (Last 30 Days)
┏━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Metric                  ┃ Value        ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━┩
│ Total API Calls         │ 125,432      │
│ Active Licenses         │ 847          │
│ Est. Monthly Revenue    │ $24,567.00   │
│ Avg Calls/Day           │ 4,181        │
└─────────────────────────┘

Tier Distribution
┏━━━━━━━━━━┳━━━━━━━┳━━━━━━━━┓
┃ Tier     ┃ Count ┃ Active ┃
┡━━━━━━━━━━╇━━━━━━━╇━━━━━━━━┩
│ FREE     │ 450   │ 380    │
│ PRO      │ 280   │ 265    │
│ ENTERPRISE│ 195  │ 202    │
└──────────┴───────┴────────┘

License Health
┏━━━━━━━━━━━━━━┳━━━━━━━┓
┃ Status       ┃ Count ┃
┡━━━━━━━━━━━━━━╇━━━━━━━┩
│ Active       │ 782   │
│ Expiring Soon│ 19    │
│ Suspended    │ 34    │
│ Revoked      │ 12    │
└──────────────┴───────┘
```

---

## Dashboard UI Features

### Filters

Dashboard hỗ trợ filtering:

1. **License Filter**: Dropdown chọn license key cụ thể
2. **Date Range**: Custom start/end date pickers
3. **Time Range**: Quick select 7/30/90 ngày

### Metrics Cards

4 metric cards chính:

- **Total API Calls**: Tổng số API calls trong khoảng thời gian
- **Active Licenses**: Số license đang active
- **Est. Revenue**: Ước tính revenue theo tier pricing
- **Avg Calls/Day**: Trung bình calls mỗi ngày

### Charts

- **API Call Volume**: Line chart với daily/weekly/monthly granularity
- **Tier Distribution**: Pie chart hoặc bar chart
- **Top Endpoints**: Bảng xếp hạng API endpoints

### License Health Section

- Active/Suspended/Revoked/Expiring counts
- Renewal prompts table (licenses hết hạn trong 7 ngày)
- Rate limit events timeline (24h)

### Export Buttons

- **Export JSON**: Download full analytics payload
- **Export CSV**: Download usage data spreadsheet

---

## API Endpoints

Dashboard cung cấp REST API tại `http://localhost:<port>/api`

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard HTML UI |
| `/health` | GET | Health check |
| `/api/metrics/api-calls` | GET | API call volume |
| `/api/metrics/licenses` | GET | Active licenses |
| `/api/endpoints` | GET | Top endpoints |
| `/api/filters/licenses` | GET | License filter options |

### Authenticated Endpoints (requires permission)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/metrics` | GET | VIEW_DASHBOARD | Full metrics payload |
| `/api/export` | GET | EXPORT_DATA | Export CSV/JSON |
| `/api/license-health` | GET | VIEW_DASHBOARD | License health overview |
| `/api/renewal-prompts` | GET | VIEW_DASHBOARD | Expiring licenses |
| `/api/rate-limit-events` | GET | VIEW_DASHBOARD | Rate limit events |
| `/api/telemetry/events` | GET | - | Telemetry events |
| `/api/telemetry/cli-versions` | GET | - | CLI version distribution |
| `/api/telemetry/sessions` | GET | - | Session statistics |

### API Examples

```bash
# Get metrics last 30 days
curl "http://localhost:8080/api/metrics?range_days=30"

# Get telemetry events
curl "http://localhost:8080/api/telemetry/events?limit=100"

# Export to JSON
curl "http://localhost:8080/api/export?format=json&days=30" > analytics.json

# Get license filters
curl "http://localhost:8080/api/filters/licenses"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLI (mekong dashboard)                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ dashboard_commands.py                                 │   │
│  │ - launch: Start FastAPI server                        │   │
│  │ - status: Health check                                │   │
│  │ - export: CSV/JSON export                             │   │
│  │ - summary: Terminal summary                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI Server (src/api/dashboard/app.py)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes                                            │   │
│  │ - /api/metrics                                        │   │
│  │ - /api/export                                         │   │
│  │ - /api/filters/*                                      │   │
│  │ - /api/telemetry/*                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Service (src/analytics/dashboard_service.py)     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Business Logic                                        │   │
│  │ - Metrics aggregation                                 │   │
│  │ - Caching (5 min TTL)                                 │   │
│  │ - CSV/JSON export                                     │   │
│  │ - Filters support                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Query Layer                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ analytics_queries.py                                  │   │
│  │ - Daily/weekly/monthly usage                          │   │
│  │ - License health                                      │   │
│  │ - Revenue summary                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ telemetry_queries.py                                  │   │
│  │ - Telemetry events                                    │   │
│  │ - CLI version distribution                            │   │
│  │ - Session statistics                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL/SQLite)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables:                                               │   │
│  │ - licenses                                            │   │
│  │ - usage_records                                       │   │
│  │ - telemetry_events                                    │   │
│  │ - rate_limit_events                                   │   │
│  │ - api_logs                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Dashboard không khởi động được

**Triệu chứng:** Lỗi port binding

```bash
Error: [Errno 48] Address already in use
```

**Giải pháp:**

```bash
# Check port đang sử dụng
lsof -i :8080

# Kill process hoặc dùng port khác
mekong dashboard launch --port 9000
```

---

### Database connection error

**Triệu chứng:**

```
Error: could not connect to server
```

**Giải pháp:**

```bash
# Check database URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/mekong"

# Verify database exists
psql $DATABASE_URL -c "\dt"
```

---

### Export rỗng

**Triệu chứng:** File export không có dữ liệu

**Nguyên nhân:** Date range không có data

**Giải pháp:**

```bash
# Check date range mặc định (30 ngày)
mekong dashboard export -f csv -o usage.csv --days 90

# Hoặc chỉ định date range cụ thể
mekong dashboard export -f json -o data.json --start 2026-01-01
```

---

## Best Practices

### Performance

1. **Caching**: Dashboard tự động cache metrics trong 5 phút
2. **Limit data**: Giới hạn 100 licenses trong dropdown filter
3. **Date range**: Sử dụng date range hẹp hơn cho datasets lớn

### Security

1. **Authentication**: Dashboard yêu cầu authentication cho sensitive endpoints
2. **RBAC**: Permissions: VIEW_DASHBOARD, EXPORT_DATA
3. **Local only**: Default bind localhost, không expose ra public network

### Monitoring

1. **Health check**: Sử dụng `/health` endpoint để monitor
2. **Status command**: `mekong dashboard status` để quick check
3. **Auto-refresh**: UI tự động refresh mỗi 30 giây

---

## Related Documentation

- [ROIaaS Phase 5](./roi-phase5.md) - Dashboard implementation details
- [Telemetry System](./telemetry-guide.md) - CLI telemetry collection
- [Rate Limiting](./rate-limiting.md) - Rate limit configuration
- [License Management](./license-guide.md) - License system overview

---

_Last Updated: 2026-03-07_
_Version: 1.0.0_

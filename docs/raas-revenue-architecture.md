# Kiến Trúc Doanh Thu RaaS — Dual Model

> 第二篇 作戰: Binh quý thắng, bất quý cửu — Tốc chiến tốc thắng

## Tổng Quan

2 mô hình doanh thu song song, chia sẻ core engine:

```
┌─────────────────────────────────────────────────────────────┐
│                    MEKONG-CLI ENGINE                         │
│           Plan → Execute → Verify (Python Core)             │
│              src/core/ + src/raas/ + src/agents/             │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐       ┌─────────────────────┐
│  MÔ HÌNH MỞ     │       │   MÔ HÌNH ĐÓNG       │
│  (Open Source)   │       │   (AgencyOS RaaS)     │
│                  │       │                      │
│  Dev & Vibe      │       │  Non-tech clients    │
│  Coding dùng     │       │  trả tiền dùng       │
│  miễn phí,       │       │  dashboard + API     │
│  tự host         │       │  → cloud managed     │
│                  │       │                      │
│  GitHub public   │       │  Polar.sh sub tiers  │
│  Community       │       │  Free/Pro/Agency/    │
│  driven          │       │  Enterprise          │
└─────────────────┘       └─────────────────────┘
```

## Mô Hình Mở — mekong-cli (Open Source cho Dev & Vibe Coding)

### Giá Trị

- **Miễn phí** cho developer community
- CLI engine: Plan → Execute → Verify
- Tự host, tự deploy, full control
- Recipes + agents có sẵn
- Thu hút contributor → ecosystem growth → funnel vào AgencyOS

### Revenue Gián Tiếp

| Stream | Cách thu | Target |
|--------|----------|--------|
| Community → AgencyOS funnel | Dev giới thiệu non-tech clients | Agency owners |
| Premium recipes | Marketplace bán recipe (70/30 split) | Power users |
| Sponsorship | GitHub Sponsors + Polar.sh | Community |
| Enterprise support | Hỗ trợ deploy + SLA | Enterprise dev teams |

### Tech Stack Mở

| Component | Tech | File |
|-----------|------|------|
| Core engine | Python 3.11+ Typer/Rich | src/core/ |
| Agents | Python modular | src/agents/ |
| RaaS SDK | Python client | src/raas/sdk.py |
| Recipes | Markdown specs | recipes/ |
| CLI | `mekong cook/plan/run` | pyproject.toml |

## Mô Hình Đóng — AgencyOS (RaaS cho Non-Tech)

### Revenue Flow

```
1. Non-tech client đăng ký → Supabase auth → agencyos-web
2. Chọn tier → Polar.sh subscription
3. Webhook → billing.py → HMAC verify → credit provisioning
4. Client gọi API/dashboard → missions.py → trừ credits
5. raas-gateway (Cloudflare) → Tôm Hùm dispatch → CC CLI
6. Dashboard SSE → kết quả real-time
```

### Pricing Tiers

| Tier | Giá/tháng | Credits | Features | Target |
|------|-----------|---------|----------|--------|
| Free | $0 | 5 | Demo only | Trial |
| Starter | $29 | 50 | Simple tasks | Solo non-tech |
| Pro | $99 | 200 | Full access | Small agency |
| Agency | $199 | 500 | Team + white-label | Growth agency |
| Master | $399 | 1000 | Priority + SLA | Premium agency |

### Credit Costs

| Complexity | Credits | Auto-detect |
|------------|---------|-------------|
| simple | 1 | goal < 50 ký tự |
| standard | 3 | goal 50-149 ký tự |
| complex | 5 | goal >= 150 ký tự |

### Tech Stack Đóng

| Component | Tech | Location |
|-----------|------|----------|
| Dashboard | Next.js 16 + React 19 | apps/agencyos-web/ |
| Landing | Next.js 16 + Framer | apps/agencyos-landing/ |
| Auth | Supabase SSR | @supabase/ssr |
| Billing | Polar.sh webhooks | src/raas/billing.py |
| Credits | SQLite WAL | src/raas/credits.py |
| Missions | FastAPI + file IPC | src/raas/missions.py |
| Gateway | Cloudflare Workers | apps/raas-gateway/ |
| i18n | next-intl (vi/en) | middleware.ts |

### Revenue Streams Đóng

| Stream | Model | Margin |
|--------|-------|--------|
| Subscriptions | Monthly recurring (Polar.sh) | 100% |
| Recipe marketplace | 70% creator / 30% platform | 30% |
| Overage credits | Pay-per-use ($0.50/credit) | 100% |
| White-label | Agency tier add-on | 100% |
| Enterprise | Custom pricing + SLA | 100% |

## CTO Tự Vận Hành

### Auto-CTO Loop (v5)

```
┌──────────────────────────────────────────────────┐
│              AUTO-CTO INFINITE LOOP               │
│                                                   │
│  1. 始計 SCAN → build + lint + test               │
│  2. 謀攻 FIX → /cook targeted fixes              │
│  3. 軍形 VERIFY → re-scan                        │
│  4. 作戰 REVENUE → scan pipeline health      NEW │
│  5. 始計 STRATEGIC → proactive improvements       │
│  6. LOOP → 120s scan / 15s fix interval           │
│                                                   │
│  Revenue scanner: 60 phút cooldown               │
│  Checks: RaaS modules, gateway, dashboard         │
│  Auto-fix: tạo mission khi phát hiện vấn đề      │
└──────────────────────────────────────────────────┘
```

### Revenue Health Scanner

Module: `apps/openclaw-worker/lib/revenue-health-scanner.js`

Kiểm tra:
- src/raas/ modules (8 required)
- raas-gateway security patterns
- agencyos-web revenue dashboard routes
- SQLite DB existence

### Metrics

File: `apps/openclaw-worker/data/revenue-health.json`

```json
{
  "lastScan": 1740700000000,
  "metrics": {
    "raasModuleCount": 12,
    "gatewayStatus": "healthy",
    "dashboardStatus": "healthy",
    "dbExists": true,
    "totalIssues": 0,
    "criticalCount": 0
  }
}
```

## API Reference

Xem chi tiết: `docs/raas-api.md`

Key endpoints:
- `POST /raas/missions` — Tạo mission (trừ credits)
- `GET /raas/dashboard/summary` — Tổng hợp
- `GET /raas/dashboard/stream` — SSE real-time
- `POST /raas/billing/webhook` — Polar.sh webhook
- `GET /raas/registry/recipes` — Recipe marketplace

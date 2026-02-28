# AGI MASTER — Dual Revenue Pipeline + Self-Operating CTO

> Ngày: 2026-02-28 | Priority: CRITICAL | Status: IN PROGRESS

## Tổng Quan

2 mô hình doanh thu song song:
1. **mekong-cli (MỞ)** — Open source cho dev & vibe coding, community-driven
2. **AgencyOS (ĐÓNG)** — RaaS SaaS cho non-tech, dashboard + subscription tiers

CTO loop tự vận hành: Auto-CTO pilot scan → fix → verify → lặp liên tục.

## Phases

| Phase | Mô tả | Status |
|-------|--------|--------|
| 01 | Fix ALL tests (Python + npm) | ✅ DONE |
| 02 | Revenue pipeline architecture doc | 🔄 IN PROGRESS |
| 03 | CTO self-operating /cook loop enhancement | ⬜ PENDING |
| 04 | Testing & Review | ⬜ PENDING |

## Kiến Trúc Revenue Pipeline

### Mô Hình Mở (mekong-cli — Open Source)

```
Dev/Vibe Coder → GitHub clone → tự host → miễn phí
  → Community recipes + agents → contribute back
  → Funnel non-tech clients → AgencyOS (doanh thu)
```

Revenue gián tiếp: Sponsorship, premium recipes, enterprise support

### Mô Hình Đóng (AgencyOS — RaaS cho Non-Tech)

```
Non-tech client → Polar.sh checkout → webhook → billing.py
  → credits.py (cộng credit) → missions.py (trừ credit mỗi task)
  → raas-gateway → Tôm Hùm dispatch → CC CLI → dashboard SSE
```

Tiers:
- Free: 5 credits — demo
- Starter: 50 credits ($29) — solo non-tech
- Pro: 200 credits ($99) — small agency
- Agency: 500 credits ($199) — team + white-label
- Master: 1000 credits ($399) — priority + SLA

### CTO Self-Operating Loop

```
auto-cto-pilot.js (v5):
  1. SCAN → npm test + npm run build + lint
  2. FIX → /cook targeted fixes
  3. VERIFY → re-run tests
  4. REVENUE SCAN → check billing health, credit usage trends
  5. OPTIMIZE → auto-tune pricing tiers based on usage
  6. LOOP → 60s interval, infinite
```

## Dependencies

- src/raas/ (12 modules) — ĐÃ implement
- apps/raas-gateway/ — ĐÃ implement
- apps/openclaw-worker/lib/auto-cto-pilot.js — Cần enhance
- apps/agencyos-web/ — Dashboard existing

## Success Criteria

- [ ] All tests GREEN (Python 406/406, npm turbo all pass)
- [ ] Revenue architecture documented
- [ ] CTO loop chạy liên tục không crash
- [ ] Dual model pricing tiers defined

---
title: "AGI RaaS Cross-Exchange Crypto Arbitrage Core"
description: "Nang cap he thong arbitrage chuyen gia: WebSocket spread detection, atomic execution, RaaS API, CLI dashboard"
status: pending
priority: P1
effort: 12h
branch: master
tags: [arbitrage, raas, cross-exchange, agi, crypto]
created: 2026-03-02
---

# AGI RaaS Cross-Exchange Crypto Arbitrage — Implementation Plan

## Tong quan

Nang cap codebase algo-trader **da co** thanh he thong arbitrage chuyen gia. KHONG build from scratch — chi nang cap va ket noi cac module hien tai.

### Codebase hien tai (da co)

| Module | File | Trang thai |
|--------|------|-----------|
| AgiArbitrageEngine | `@agencyos/trading-core/arbitrage` | Co — regime, Kelly, self-tune |
| SpreadDetectorEngine | `@agencyos/trading-core/arbitrage` | Co — scoring, circuit breaker |
| Fastify API server | `src/api/fastify-raas-server.ts` | Co — health, tenant, marketplace |
| JWT + API Key auth | `src/auth/` | Co — token service, rate limiter |
| TenantStrategyManager | `src/core/tenant-strategy-manager.ts` | Co — multi-tenant, tiers, PnL |
| PaperTradingEngine | `src/core/paper-trading-engine.ts` | Co — virtual trades, slippage |
| ExchangeRouter + Pool | `src/execution/` | Co — fallback, rate limit, budget |
| WebSocket server | `src/core/websocket-server.ts` | Co — channels: tick, signal, health |
| BullMQ jobs | `src/jobs/` | Co — backtest, scan, webhook workers |
| Exchange factory | `src/cli/exchange-factory.ts` | Co — Binance, OKX, Bybit adapters |
| 342+ tests | `tests/` | Co — Jest |

### Diem can nang cap

1. **Real-time WebSocket spread scanner** — polling REST hien tai (2s interval), can chuyen sang WS feed
2. **Atomic cross-exchange execution** — buy/sell dong thoi 2 san, khong phai tuan tu
3. **Fee-aware spread calculator** — dynamic fee lookup, khong hardcode
4. **Arbitrage API routes** — chua co /arb/* endpoints rieng
5. **CLI dashboard real-time** — chua co rich dashboard, chi co logger
6. **Paper trading tich hop arb pipeline** — PaperTradingEngine chua ket noi voi arb engine

---

## Phases

| Phase | File | Priority | Effort | Song song? |
|-------|------|----------|--------|-----------|
| 1 | [phase-01-core-arbitrage-engine.md](./phase-01-core-arbitrage-engine.md) | P1 | 5h | Doc lap |
| 2 | [phase-02-raas-api-multi-tenant.md](./phase-02-raas-api-multi-tenant.md) | P1 | 4h | Song song voi Phase 1 |
| 3 | [phase-03-cli-dashboard-paper-trading.md](./phase-03-cli-dashboard-paper-trading.md) | P2 | 3h | Sau Phase 1 |

### Dependency Graph

```
Phase 1 (Engine) ──────────────────> Phase 3 (CLI + Paper)
                                        ^
Phase 2 (API) ─────────────────────────/
```

Phase 1 + 2 chay **song song**. Phase 3 can output tu ca 2.

---

## Key Decisions

- **CCXT giu nguyen** — 100-300ms OK cho arb (research validated). Custom WS chi cho price feed
- **Fastify 5 giu nguyen** — 70k req/sec, Zod native, da verified
- **Redis giu nguyen** — BullMQ + PubSub + rate limiter chia se
- **@agencyos/trading-core** la source of truth cho engines

## Success Criteria

- [ ] Spread detection < 500ms (WebSocket multi-exchange)
- [ ] Atomic execution buy/sell < 1s (parallel Promise.all)
- [ ] API /arb/* endpoints functional voi JWT auth
- [ ] Paper trading mode chay full arb pipeline
- [ ] CLI dashboard hien thi real-time P&L
- [ ] 95%+ test coverage tren code moi
- [ ] `tsc --noEmit` pass, 0 `any` types moi

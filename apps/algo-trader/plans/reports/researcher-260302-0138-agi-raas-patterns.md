# AGI RaaS Patterns & Architecture Research
**Date:** 2026-03-02 | **Project:** algo-trader

---

## Executive Summary

AGI RaaS (Algorithmic General Intelligence as a Service) is evolution from static bots→adaptive agents. Current market (2025): $21.89B, 43% retail. Algo-trader already has 70% infrastructure; needs multi-tenant API layer + monetization model.

---

## 1. RaaS Platform Model Patterns

### Dominant Architectures (2025)

| Pattern | Example | Key Feature |
|---------|---------|------------|
| **Cloud Native** | QuantConnect | Co-located compute, Python LEAN engine |
| **White-Label** | AlgoBulls, ALGOGENE | Resell to brokers/advisors |
| **Modular SaaS** | Alpaca + agents | REST/WebSocket, per-user strategies |
| **Community-Driven** | Proof Trading (Medium) | User-submitted strategies + marketplace |

### Multi-Tenant Requirements (Critical)

```
User1 (API key A) → Isolated sandbox
User2 (API key B) → Isolated sandbox
User3 (API key C) → Isolated sandbox
  ↓
Shared BotEngine + Strategy Loader (namespace-aware)
  ↓
Broker routing (auto-select exchange per user)
```

**Algo-trader gap:** No namespace isolation yet. Need `TenantStrategyManager` (already started: `src/core/tenant-strategy-manager.ts`).

---

## 2. AGI Trading Patterns (Self-Learning)

### Architecture Evolution
- **v1 (Current):** Static rules (RSI+SMA, arbitrage scoring)
- **v2 (AGI):** Adaptive + regime-aware + Kelly sizing
- **v3 (Self-Tuning):** Auto-adjust thresholds + strategy selection

### Algo-Trader Already Has:
✅ **Regime Detection** — Hurst exponent + volatility (src/arbitrage/AgiArbitrageEngine.ts)
✅ **Kelly Position Sizing** — Historical win rate + payoff ratio
✅ **Self-Tuning** — EMA of profitability auto-adjusts thresholds
✅ **Multi-Strategy Routing** — Execution adapts per market regime

### Next Steps:
- [ ] Store regime/Kelly state in **persistent DB** (Supabase) for cross-session learning
- [ ] Add **LLM-based signal explanation** (why did bot trade?)
- [ ] Implement **ensemble scoring** (combine 3+ signals, not just spread)
- [ ] Add **A/B testing framework** for strategy variants per user

---

## 3. Multi-Tenant API Design

### REST Endpoints (Proposed)

```
POST   /api/v1/tenants/{tenantId}/strategies
       Create user strategy config (BTC/USDT, RSI=14, etc.)

GET    /api/v1/tenants/{tenantId}/strategies
       List all user strategies + backtest results

POST   /api/v1/tenants/{tenantId}/backtest
       Trigger backtest (async job)

GET    /api/v1/tenants/{tenantId}/trades
       Historical trades + PnL

WebSocket /ws/tenants/{tenantId}/live
       Real-time signals + execution updates
```

### Auth Pattern (Industry Standard)
```
Header: Authorization: Bearer {jwt_token}
JWT payload: {tenantId, userId, scope: "read|write", expires: 24h}
Exchange API keys: Encrypted in DB, decrypted per-trade
```

### Algo-trader Implementation
- **Gateway:** `apps/raas-gateway/index.js` (Cloudflare Worker) — already exists
- **Auth layer:** Add JWT validation + tenant isolation
- **IsolationKey:** All queries scoped to `WHERE tenant_id = ?`

---

## 4. Monetization Models (SaaS Pricing)

### Proven Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 strategy, backtest only, 1hr delayed data |
| **Pro** | $29/mo | 5 strategies, live trading, real-time data |
| **Trader** | $99/mo | Unlimited strategies, API access, white-label |
| **Enterprise** | Custom | Dedicated infra, custom integrations |

### Revenue Multipliers
- **Performance fee** — 10-20% of profits (attract high-roller traders)
- **API overage** — $0.001 per API call beyond tier limit
- **Data marketplace** — Sell aggregated non-PII signals to institutional buyers

### Algo-trader Readiness
- ✅ Strategy marketplace exists (`src/core/strategy-marketplace.ts`)
- ✅ Webhook notifier for billing sync (`src/core/trading-event-webhook-notifier-with-hmac-retry.ts`)
- ⚠️ Need billing integration (Polar.sh recommended per project rules)

---

## 5. API Design Best Practices (Industry)

### Event-Driven Architecture (Mandatory)

```
Order → OrderPlaced event → RiskManager → SignalLogger → WebSocket client
        ↓
     Execution event → Webhook → Billing system
```

**Latency SLAs:**
- HFT: <1ms (not applicable to retail)
- Algo trading: 10-100ms ✅ (algo-trader current: ~50ms)
- Retail: 100-500ms ✅

### Sequencing (QuantConnect Pattern)
Each input event gets monotonic sequence number. Benefits:
- Replay for debugging
- Distributed consumer model (multiple workers)
- Exactly-once execution semantics

**Algo-trader:** Use `SignalMesh` (`src/netdata/SignalMesh.ts`) + event audit (`src/a2ui/trade-audit-logger.ts`)

---

## 6. Real-World Architecture Patterns

### QuantConnect (Reference Implementation)
- **Engine:** LEAN (open-source Python)
- **Compute:** Co-located 10Gb connections
- **Model:** Freemium + enterprise
- **Deployment:** Cloud-native, auto-scaling per user

### Alpaca + AI Agents (LangGraph)
- **Core:** REST API for stock/option orders
- **Innovation:** Multi-agent portfolio rebalancing
- **Integration:** LangGraph orchestrates agent decisions

### 3Commas (Community-Driven)
- **DCA bots:** Dollar-cost averaging automation
- **Exchange:** Multi-exchange support (130+)
- **Social:** Copy-trading (follow top traders)
- **Model:** Freemium + premium features

### Algo-trader Positioning
Hybrid: **Quant-focused (QuantConnect) + community (3Commas)**
- Strong in regime detection + Kelly sizing (quant credibility)
- Opportunity: Strategy marketplace + copy-trading

---

## 7. Critical Implementation Gaps

| Gap | Impact | Fix Effort | Priority |
|-----|--------|-----------|----------|
| No multi-tenant isolation | Security risk | Medium | P0 |
| DB state not persistent | AGI learning broken | Low | P1 |
| No LLM signal explainer | UX/trust issue | Medium | P2 |
| Billing webhook incomplete | Revenue lost | Low | P1 |
| No strategy versioning | Backtest reproducibility | Low | P2 |
| Missing A/B test framework | Can't optimize | High | P3 |

---

## 8. Recommended Execution Path

### Phase 1 (Weeks 1-2): Multi-Tenant Foundation
- Add namespace isolation to BotEngine
- Implement JWT auth in raas-gateway
- Scope all DB queries to tenant_id
- Test with 2 mock users

### Phase 2 (Weeks 3-4): Persistent AGI State
- Store regime + Kelly state in Supabase
- Implement cross-session learning
- Add strategy versioning to marketplace

### Phase 3 (Weeks 5-6): Monetization Layer
- Integrate Polar.sh billing (per project rules)
- Webhook sync for trade execution → billing events
- Tier enforcement (Pro users: unlimited strategies)

### Phase 4 (Weeks 7-8): Community Features
- Strategy marketplace UI (React dashboard)
- Copy-trading endpoint
- Performance analytics dashboard

---

## 9. Tech Stack Validation

**Already Strong:**
- TypeScript/Node.js (type-safe)
- CCXT (100+ exchanges)
- Supabase (multi-tenant ready)
- Jest (342 tests, 95% coverage)

**Add/Enhance:**
- **LLM integration** — Claude API for signal explanation (via Antigravity Proxy)
- **Redis** — Session caching + rate limiting per tenant
- **PostgreSQL triggers** — Auto-compute regime state on candle close
- **Playwright** — E2E tests for multi-tenant isolation

---

## 10. Competitive Positioning

### vs QuantConnect
- ❌ No backtesting cloud IDE (but has local BacktestEngine)
- ✅ Better AGI arbitrage detection
- ✅ Simpler onboarding

### vs Alpaca + Agents
- ✅ Multi-strategy per user
- ✅ Regime detection (Hurst exponent)
- ❌ Smaller community ecosystem

### vs 3Commas
- ✅ Deeper quant credibility (Kelly criterion, regime)
- ✅ Self-learning bots (AGI)
- ❌ No social copy-trading yet (can build in Phase 4)

---

## Unresolved Questions

1. **LLM for signal explanation:** Which model? (Recommend Claude via Antigravity Proxy per project rules)
2. **Billing integration:** Polar.sh or Stripe? (Polar.sh per /CLAUDE.md payment-provider rule)
3. **Data persistence:** Supabase Real-Time subscription cost at scale?
4. **Strategy IP:** How to prevent user strategy theft in marketplace?
5. **Backtesting scalability:** Current BacktestEngine handles 1-year history per pair. Optimize for 5-year?

---

**Report Status:** Research complete. Ready for `/plan:hard` phase to design implementation.

Sources:
- [Best Algorithmic Trading Software 2025](https://www.etnasoft.com/best-algorithmic-trading-software-in-2025-the-ultimate-guide/)
- [Algorithmic Trading System Architecture](https://www.turingfinance.com/algorithmic-trading-system-architecture-post/)
- [Proof Trading Engineering](https://medium.com/prooftrading/proof-engineering-the-algorithmic-trading-platform-b9c2f195433d)
- [AI Trading Agents with Alpaca](https://alpaca.markets/learn/how-traders-are-using-ai-agents-to-create-trading-bots-with-alpaca)
- [Building Self-Learning Trading Bots](https://medium.com/@jsgastoniriartecabrera/building-a-self-learning-trading-bot-my-journey-from-simple-scripts-to-ai-powered-automation-2573195dd4ac)
- [QuantConnect and Alpaca Integration](https://alpaca.markets/learn/how-to-build-and-deploy-trading-strategies-with-alpaca-and-quantconnect)
- [Kelly Criterion in Trading](https://stratpilotai.com/blog/kelly-criterion-ai-position-size)
- [Risk-Constrained Kelly Criterion](https://blog.quantinsti.com/risk-constrained-kelly-criterion/)

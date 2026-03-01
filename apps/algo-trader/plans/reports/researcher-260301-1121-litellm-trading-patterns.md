# LiteLLM Architecture → Algo-Trading System Mapping

**Date:** 2026-03-01 | **Report:** LiteLLM Unified API Patterns for Exchange Integration
**Duration:** Research on BerriAI/litellm proxy, virtual keys, load balancing, budget management

---

## UNIFIED API PROXY PATTERN

**LiteLLM Model:** Single REST endpoint accepts `{model, messages}` → routes to 100+ LLM providers
**Trading Equivalent:** Single Exchange API endpoint accepts `{symbol, order_type, amount}` → routes to Binance/OKX/Bybit

```
┌──────────────────────────────────────┐
│ Client: POST /v1/chat/completions   │
│ {model: "gpt-4", messages: [...]}   │
└──────────────────────────────────────┘
              ↓
       ┌──────────────┐
       │ Model Router │ (model → provider mapping)
       └──────────────┘
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
OpenAI           Azure OpenAI
```

**Trading Parallel:**
```
┌──────────────────────────────────────┐
│ Strategy: POST /trade/execute       │
│ {exchange: "BTC/USDT", order_type}  │
└──────────────────────────────────────┘
              ↓
       ┌──────────────┐
       │Exchange Router│ (symbol → exchange mapping)
       └──────────────┘
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
 Binance              OKX
```

**Key:** Abstraction layer decouples trading logic from exchange implementation.

---

## PROVIDER FALLBACK & LOAD BALANCING

**LiteLLM Pattern:**
- Config maps model aliases to provider list: `{"gpt-4": ["azure-gpt4", "openai-gpt4"]}`
- Request tries first provider; on 429/error → fallback to next
- Round-robin across healthy providers for load distribution
- Health checks via periodic test requests

**Trading Pattern:**
```
{"BTC/USDT":
  [
    {provider: "binance", weight: 50},
    {provider: "okx", weight: 30},
    {provider: "bybit", weight: 20}
  ]
}
```
- Primary: Binance (50%)
- Secondary: OKX (30%) — fallback if Binance 503/disconnects
- Tertiary: Bybit (20%) — final fallback

**Failure Scenarios:**
- Exchange down → skip to next healthy (measured by `/health` ping)
- Rate limit 429 → queue request, retry with backoff
- Network timeout → circuit breaker (skip for 30s), try next

---

## RATE LIMITING & BUDGET MANAGEMENT

**LiteLLM Hierarchy (5 Levels):**
```
Organization
├── Team (max_budget, budget_duration)
│   ├── User (rate_limit: tpm/rpm)
│   │   ├── API Key (spend_limit)
│   │   └── API Key (spend_limit)
│   └── User
└── Team
```

**Trading Equivalent (Budget as Risk Capital):**
```
Trading Account ($100k)
├── Strategy-1 ($30k)
│   ├── Aggressive Bot (20% daily drawdown)
│   │   ├── Exchange Key #1 (Binance API)
│   │   └── Exchange Key #2 (OKX API)
│   └── Conservative Bot (5% daily drawdown)
└── Strategy-2 ($70k)
```

**Rate Limit Mapping:**
- **TPM** (tokens/min) → **Notional Volume/min** (USDT traded per minute cap)
- **RPM** (requests/min) → **Orders/min** (max 100 orders/min per exchange)
- **Budget duration** → Daily reset; if loses $5k in Strategy-1, blocks new trades

---

## VIRTUAL KEYS & API KEY ROTATION

**LiteLLM:**
- Generate virtual keys (masked tokens) → map to actual provider keys in secure vault
- Each virtual key has independent budget + rate limits
- Rotate underlying provider keys without affecting virtual key interface
- Per-tenant/per-user key isolation

**Trading Application:**
```
Virtual Key (prefix: sk_trade_123)
  └→ Points to: Binance_Acct_1 (actual API key in vault)
  └→ Points to: Binance_Acct_2 (fallback)
  └→ Budget: $5k/day, 50 orders/min
  └→ Allowed symbols: [BTC/USDT, ETH/USDT]
  └→ Allowed operations: [POST order, GET balance]
```

**Benefits:**
- Revoke a key without stopping bot (just remap to backup account)
- Audit trail: all trades logged against virtual key ID
- Per-strategy key isolation (Arbitrage uses Key-A, Spot uses Key-B)

---

## DISTRIBUTED RATE TRACKING (REDIS + IN-MEMORY)

**LiteLLM:**
- Redis for distributed rate counters (multi-instance deployments)
- In-memory sliding-window fallback if Redis unavailable
- Counters reset per duration window (e.g., "30m" → next 30m window)

**Trading Pattern:**
```
Redis: rate:{exchange}:{symbol}:{interval}
  e.g., "rate:binance:BTC/USDT:1m" = [order1_ts, order2_ts, ...]

Check: len(orders in last 60s) < 50 → allow, else reject (rate limit)

In-Memory Fallback:
  if redis down → track in local dict with TTL
```

**Trading-Specific Metric:**
```
Exchange USDT Flow Rate (protect against liquidations):
  rate:okx:perp:notional:5m = [100_000, 95_000, 102_000, ...]
  if sum(last 5m) > max_leverage_flow → halt new orders
```

---

## COST TRACKING & BUDGET ENFORCEMENT

**LiteLLM Spend Model:**
- Each request: track cost = (input_tokens × input_price) + (output_tokens × output_price)
- Compare cumulative spend vs. key budget
- If exceeded → reject request + notify dashboard

**Trading Spend Model:**
```
cost = (notional_volume × maker_fee) + (realized_loss_per_position)

Binance BTC order: 0.1 BTC @ 68000 = $6800
  fee = $6800 × 0.0001 (maker) = $0.68
  cost_impact = $0.68 + (slippage if any)

Track: Virtual Key budget consumed = $X so far today
```

**Enforcement Rules:**
- If daily spend > 80% of budget → alert
- If daily spend > 100% of budget → reject new orders + liquidate positions
- Hourly reset available for high-frequency traders (e.g., "60m" budget window)

---

## KEY LEARNINGS FOR ALGO-TRADER ARCHITECTURE

| LiteLLM Feature | Trading Mapping | Implementation |
|---|---|---|
| Model Router | Exchange Router | `ExchangeRouter` class → routes symbol to exchange |
| Virtual Keys | Strategy API Keys | Masked token points to real exchange API key in vault |
| Hierarchical Budgets | Risk Hierarchy | Org → Account → Strategy → Bot (each has spend limit) |
| Rate Limit Tiers | Volume Tiers | Per-exchange RPM/TPM → orders/min, USDT/min caps |
| Fallback Chain | Exchange Fallback | Primary exchange down → queue request → retry next exchange |
| Redis Rate Tracking | Order Rate Tracking | Distributed counters for exchange-wide order throughput |
| Spend Dashboard | PnL Dashboard | Show real-time spend, budget remaining, alerts |
| Custom Auth | Strategy Auth | Each strategy validates its own virtual key before execution |

---

## RECOMMENDED ARCHITECTURE

```
Unified Exchange API Layer
├── ExchangeRouter (model-like dispatcher)
│   └── Maps symbol → [Binance, OKX, Bybit] (with weights)
├── VirtualKeyManager
│   └── Maps sk_trade_* → actual exchange API key (in vault)
├── RateLimiter (Redis + in-memory)
│   └── Tracks RPM/TPM per exchange per virtual key
├── BudgetManager (hierarchical)
│   └── Enforces daily/hourly spend limits per strategy
└── FallbackController
    └── Circuit breaker + exponential backoff on exchange 503/429
```

**Design Benefit:** Same abstraction logic applies to all exchanges; add new exchange = one config entry.

---

## UNRESOLVED QUESTIONS

1. How to handle partial fills across multiple exchanges (e.g., Binance fills 0.05 BTC, OKX fills 0.05 BTC)?
2. Should slippage tracking use best-bid-ask at execution time or post-execution actual price?
3. How to measure "exchange health" beyond HTTP 200? (Ping latency threshold?)
4. Should budget reset be calendar-based (midnight UTC) or rolling window?

Sources:
- [BerriAI/litellm GitHub](https://github.com/BerriAI/litellm)
- [LiteLLM Budgets & Rate Limits](https://docs.litellm.ai/docs/proxy/users)
- [LiteLLM Virtual Keys](https://docs.litellm.ai/docs/proxy/virtual_keys)
- [LiteLLM Medium Article - Feb 2026](https://medium.com/@mrutyunjaya.mohapatra/litellm-a-unified-llm-api-gateway-for-enterprise-ai-de23e29e9e68)

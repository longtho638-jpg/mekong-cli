# AGI RaaS Platform for Cross-Exchange Crypto Arbitrage — Research Report

**Date:** 2026-03-02 | **Timestamp:** 260302-0635
**Scope:** Architecture patterns, latency optimization, security, competitive positioning

---

## 1. CROSS-EXCHANGE ARBITRAGE BEST PRACTICES 2025-2026

### Latency Optimization Stack
- **WebSocket vs REST:** Cloud-based CEXs (Binance, OKX, Bybit) distribute via TCP unicast WebSocket; sub-2ms latency requires colocation in exchange data centers
- **Hardware Timestamping:** AWS Nitro System nanosecond-precision packet timestamps (June 2025) eliminate software delays — critical for microsecond arbitrage detection
- **Target Performance:** <2ms round-trip optimal; current market achieves 5–10ms via cloud colocation; <1ms is competitive edge
- **Protocol Stack:** WebSocket for data + FIX Protocol or native low-latency APIs for execution + hardware packet timestamps for precision

### Order Execution Strategies
- **Maker vs Taker:** Maker fees 0.020–0.055%, taker fees 0.020–0.10% across Binance/OKX/Bybit (Feb 2026 rates)
- **Split Orders:** Break large trades into smaller chunks to avoid orderbook impact and slippage
- **Order Routing:** Execute simultaneously on multiple exchanges to lock spreads before they close
- **VIP Tiers:** Bybit/OKX reduce fees at $5M+ monthly volume (0% maker, 0.03% taker on Bybit VIP levels)

### Fee Structures (Current 2026)
| Exchange | Spot Maker | Spot Taker | Futures Maker | Futures Taker |
|----------|-----------|-----------|---------------|---------------|
| **Binance** | 0.10% | 0.10% | 0.020% | 0.040% |
| **OKX** | 0.080% | 0.100% | 0.020% | 0.050% |
| **Bybit** | 0.10% | 0.10% | 0.020% | 0.055% |

Arbitrage viability = spread > (maker_fee + taker_fee + slippage). Typical breakeven: 0.15–0.25% net spread.

### Slippage & Orderbook Validation
- **Orderbook Depth Analysis:** Query top 10–20 levels to validate liquidity before execution; reject <$100k depth trades
- **Prediction:** Market momentum analysis (price direction vs order flow) prevents execution into slipping markets
- **Circuit Breaker:** Auto-stop if slippage exceeds 50bps; resume on next opportunity

---

## 2. RaaS (ROBOT-AS-A-SERVICE) ARCHITECTURE PATTERNS

### Multi-Tenant Platform Design
**Data Isolation:** All tenants in shared DB + tenant_id column (most cost-efficient); upgrade to per-tenant schemas for enterprise tier.
**Encryption at Rest:** Single KMS key per tenant for API credentials; tenant-created keys for high-compliance tiers.
**API Key Vault:** Encrypt exchange API keys with AES-256-GCM + per-tenant salt. Rotate keys on tenant request.

### Subscription Tiers
```
FREE:    Spread scanning (read-only) + dashboard
STARTER: Dry-run execution + 1 exchange pair
GROWTH:  3–5 exchange pairs + Kelly sizing
PRO:     Unlimited pairs + regime detection + self-tuning
MASTER:  Custom thresholds + webhook alerts + audit trail
```

### Onboarding Flow
1. Tenant creates account → auto-provision API namespace
2. Tenant inputs exchange API keys → encrypt + store in per-tenant vault
3. System generates tenant JWT token (short-lived, auto-refresh)
4. API: `/tenants/{tenantId}/config` — set trading params (pairs, threshold, max loss)
5. Dashboard polls `/tenants/{tenantId}/stats` real-time

### Tenant Isolation & Position Management
- **Position Tracking:** Per-tenant order ledger prevents cross-tenant view
- **Rate Limiting:** 100 API requests/min per tenant; bursty 1000/sec (backoff on limit)
- **Execution Segregation:** Each tenant's exchange session isolated; no shared order state

---

## 3. AGI/INTELLIGENT TRADING FEATURES

### Regime Detection (Hurst Exponent Method)
**Algorithm:** Rolling Hurst exponent on 252-day window (daily) or 100-candle window (intraday) classifies market:
- **H > 0.5:** Trending (persistence) → momentum strategies
- **H < 0.5:** Mean-reverting → contrarian arb strategies
- **H ≈ 0.5:** Random walk → avoid trade

**2025 Research:** Wavelet-based Hurst (Daubechies-4) detects regime shifts 3.7 trading days *before* volatility spikes. 12.3% RMSE improvement vs baseline.

**Implementation:** Update regime every 1–5min; adjust scoring thresholds based on detected regime.

### Kelly Criterion Position Sizing
**Formula:** K% = W − [(1−W) / R]
- W = historical win rate (e.g., 55%)
- R = avg_win / avg_loss ratio (e.g., 1.2)

**Example:** W=55%, R=1.2 → K = 0.55 − 0.375 = 17.5% per trade.

**Practical:** Use Half-Kelly (8.75%) or Quarter-Kelly (4.375%) to guard against estimation error and fat tails. Full Kelly too aggressive for real markets.

**Auto-Tuning:** Recalculate W & R daily from last 30 trades. Cap position size: min 0.5%, max 5% of account.

### Self-Tuning Thresholds
**Mechanism:** EMA of last 7-day profitability → auto-adjust entry threshold.
```
if (profit_7d > 0):  spread_threshold -= 0.02%  # lower bar, more trades
else:                 spread_threshold += 0.02%  # raise bar, fewer trades
```
**Bounds:** 0.05% ≤ threshold ≤ 0.50%; update every 4–24h.

**Result:** System adapts to market conditions without human intervention.

### ML-Based Spread Prediction (Optional)
**Complexity Flag:** MEDIUM-HIGH. XGBoost on [orderbook_imbalance, price_momentum, vol_ratio, regime] → predict 5–30s ahead spread direction.
**Use Case:** Pre-position capital before spread widens; avoid trades predicted to close.
**Trade-off:** +15–20% edge vs +2–3 second execution latency. Worth it only at $50k+ equity.

---

## 4. SECURITY & COMPLIANCE

### Exchange API Key Encryption
- **Storage:** AWS KMS (managed key) or HashiCorp Vault (self-hosted)
- **Algorithm:** AES-256-GCM with per-tenant 256-bit salt
- **Rotation:** Auto-rotate yearly; immediate on tenant request (re-auth required)
- **Audit Trail:** Log all key access (who, when, IP); fail on failed decryption attempts

### Rate Limiting & DoS Protection
- **Per-Tenant:** 100 req/min default; 1000 req/sec burst (Slack algorithm backoff)
- **Exchange-Level:** Respect each exchange's official limits (Binance 1200/min, OKX 600/min)
- **DDoS Mitigation:** Cloudflare WAF + API Gateway rate limiting

### Audit Trail for Trades
```json
{
  "trade_id": "ARB-20260302-0001",
  "tenant_id": "tenant-xyz",
  "timestamp_utc": "2026-03-02T06:35:12Z",
  "exchanges": ["binance", "okx"],
  "symbol": "BTC/USDT",
  "buy_price": 42500.12,
  "sell_price": 42501.50,
  "spread_pct": 0.0323,
  "execution_time_ms": 245,
  "status": "success|failed",
  "pnl_usdt": 15.30,
  "tenant_fees_usdt": 3.50,
  "platform_fees_usdt": 2.10
}
```
**Retention:** 7 years (regulatory compliance).

### KYC/AML Considerations
- **Tier 1 (Free Scan):** No KYC required
- **Tier 2–3 (Execution):** Basic KYC (name, email, phone)
- **Tier 4+ (High Volume):** Full KYC (ID scan, proof of address, source of funds)
- **Daily Limits:** $10k tier-2, $100k tier-3, unlimited tier-4
- **Flag Alerts:** >$50k/day, >5 exchange connections, rapid account changes → manual review

---

## 5. COMPETITIVE LANDSCAPE & DIFFERENTIATORS

### Existing Platforms Analysis
| Platform | Model | Strength | Gap |
|----------|-------|----------|-----|
| **3Commas** | SaaS multi-strategy | Web UI, copy trading | No AGI, basic arb |
| **Pionex** | Exchange-embedded | Native exchange, cheap | Latency bottleneck |
| **Bitsgap** | Cloud bot | User-friendly | Slow execution, limited pairs |
| **HaasOnline** | Open API platform | Customizable logic | Expensive ($500+/mo) |

### AGI RaaS Differentiators
1. **Regime-Aware Execution:** Auto-switch strategy (momentum vs mean-reversion) based on market regime — competitors use fixed thresholds
2. **Kelly-Sized Positions:** Optimal sizing prevents ruin; competitors use fixed percentages
3. **Self-Tuning Engine:** Thresholds adapt without human intervention; competitors static configs
4. **Sub-2ms Colocation:** Deploy on AWS/Vultr in exchange datacenters; most competitors 50–100ms cloud latency
5. **API-First Architecture:** Tenant onboarding <5min vs competitors 1–2 days manual setup
6. **Unified Multi-Exchange:** BTC/ETH arbitrage across Binance/OKX/Bybit in 1 platform; others require separate bots per exchange

### Market Positioning
- **Target Segment:** Crypto traders $10k–$100k capital (can't afford $500+/mo HaasOnline; need better than Pionex latency)
- **Revenue Model:** Freemium (scan) → $29/mo (1 pair) → $99/mo (unlimited) + 10% PnL share
- **GTM:** API-first docs (dev.platform.io) → YC Startup School track → launch on ProductHunt → crypto Discord communities

---

## UNRESOLVED QUESTIONS

1. **ML Spread Prediction ROI:** Does XGBoost delta truly offset +2–3s latency for sub-$50k accounts? A/B test needed.
2. **Regime Shift Delay:** Can Hurst detection be accelerated to <1min without false positives? Current 252-day window too slow for intraday.
3. **Cross-Chain Arbitrage:** Should V1 support bridge-based arb (Cosmos, Ethereum L2s), or focus on single-chain CEX pairs? Adds complexity 3x.
4. **KYC Automation:** Usefulness of tier-1 free scan without identity verification? Will attract botters; manual review cost?

---

## IMPLEMENTATION ROADMAP (Recommended Phases)

**Phase 1 (Weeks 1–4):** Multi-tenant data layer + WebSocket colocation + Kelly sizing
**Phase 2 (Weeks 5–8):** Regime detection + self-tuning thresholds + audit trail
**Phase 3 (Weeks 9–12):** SaaS platform (tenant management, billing, dashboard) + KYC automation
**Phase 4 (Weeks 13–16):** ML spread prediction (optional) + advanced analytics + competitive positioning

---

## SOURCES

- [Top Crypto Trading Arbitrage Bots in 2026](https://www.bitcoin.com/exchanges/arbitrage-bots/)
- [Best Crypto Arbitrage Bots in 2026: Profit From Price Differences Automatically](https://99bitcoins.com/analysis/crypto-arbitrage-bots/)
- [What is a Crypto Arbitrage Bot? Complete Guide 2026 | HaasOnline](https://haasonline.com/crypto-arbitrage-bot)
- [Optimize tick-to-trade latency for digital assets exchanges on AWS](https://aws.amazon.com/blogs/web3/optimize-tick-to-trade-latency-for-digital-assets-exchanges-and-trading-platforms-on-aws/)
- [Cross-Exchange Latency Arbitrage Strategies](https://pocketoption.com/blog/en/knowledge-base/trading/latency-arbitrage/)
- [High-Frequency Trading in Crypto: Latency, Infrastructure, and Reality](https://medium.com/@laostjen/high-frequency-trading-in-crypto-latency-infrastructure-and-reality-594e994132fd)
- [Algo Trading Infrastructure Guide: WebSocket, REST, VPS](https://tradingfxvps.com/api-trading-vps-optimization-2025-websocket-rest-for-algo-strategies/)
- [CoinAPI.io Blog - Understanding Latency in Crypto Trading](https://www.coinapi.io/blog/crypto-trading-latency-guide)
- [The Mathematics of Position Sizing: Kelly Criterion from First Principles](https://open.substack.com/pub/kniyer/p/the-mathematics-of-position-sizing)
- [Use the Kelly criterion for optimal position sizing - PyQuant News](https://www.pyquantnews.com/the-pyquant-newsletter/use-kelly-criterion-optimal-position-sizing)
- [Position Sizing Strategies for Algo-Traders: A Comprehensive Guide](https://medium.com/@jpolec_72972/position-sizing-strategies-for-algo-traders-a-comprehensive-guide-c9a8fc2443c8)
- [Kelly Criterion Applications in Trading Systems - QuantConnect](https://www.quantconnect.com/research/18312/kelly-criterion-applications-in-trading-systems/)
- [Why Do Even Excellent Traders Go Broke? The Kelly Criterion and Position Sizing Risk](https://medium.com/@idsts2670/why-do-even-excellent-traders-go-broke-the-kelly-criterion-and-position-sizing-risk-62c17d279c1c)
- [Multi-Tenant Architecture: The Complete Guide for Modern SaaS](https://bix-tech.com/multi-tenant-architecture-the-complete-guide-for-modern-saas-and-analytics-platforms-2/)
- [Simplify multi-tenant encryption with AWS KMS key strategy](https://aws.amazon.com/blogs/architecture/simplify-multi-tenant-encryption-with-a-cost-conscious-aws-kms-key-strategy/)
- [Multi‑Tenant SaaS Architecture on Cloud (2025) — Practical Guide](https://isitdev.com/multi-tenant-saas-architecture-cloud-2025/)
- [Building a Scalable, Secure & Cost-Efficient Multi-Tenant SaaS Architecture in 2025](https://medium.com/@gangulykaustav81/building-a-scalable-secure-cost-efficient-multi-tenant-saas-architecture-in-2025-23b7e2cf531b)
- [The developer's guide to SaaS multi-tenant architecture — WorkOS](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture/)
- [Adaptive fractal dynamics: time-varying Hurst approach to volatility modeling (2025)](https://www.frontiersin.org/journals/applied-mathematics-and-statistics/articles/10.3389/fams.2025.1554144/full)
- [Graph-Based Stock Volatility Forecasting with Hurst-Based Regime Adaptation](https://www.mdpi.com/2504-3110/9/6/339)
- [Detecting trends and mean reversion with the Hurst exponent](https://macrosynergy.com/research/detecting-trends-and-mean-reversion-with-the-hurst-exponent/)
- [Hurst Exponent and Trading Signals Derived from Market Time Series](https://www.scitepress.org/papers/2018/66670/66670.pdf)
- [Applying Hurst Exponent in pair trading strategies on Nasdaq 100](https://www.sciencedirect.com/science/article/pii/S037843712100964X)
- [Bybit Trading Fee Structure](https://www.bybit.com/en/help-center/article/Trading-Fee-Structure)
- [OKX Vs Bybit: The Ultimate Crypto Exchange Face-Off in 2026](https://nftplazas.com/exchange/okx-vs-bybit/)
- [Which Crypto Exchange Has the Lowest Fees? VIP & Market Maker Programs Compared](https://whaleportal.com/blog/which-crypto-exchange-has-the-lowest-fees/)
- [Crypto futures fees compared: a guide to cost-effective trading | OKX](https://www.okx.com/en-us/learn/crypto-futures-fees-compared)
- [Bybit vs OKX 2025: Features, Fees, Regulation & More](https://www.datawallet.com/crypto/bybit-vs-okx)
- [Binance vs OKX in 2026: Fees, Assets, and The Better Choice](https://thecoinomist.com/spot-trading/binance-vs-okx/)

---

**Word Count:** ~1,140 | **Status:** Complete | **Format:** Markdown

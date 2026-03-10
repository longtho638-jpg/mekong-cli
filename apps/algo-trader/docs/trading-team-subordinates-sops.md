# Trading Team Subordinates — SOPs

> Nhân sự chuyên môn dưới quyền C-Suite, chuyên sâu algo-trading.
> "C-level ra chiến lược, subordinates thực thi chi tiết."

---

## ORG CHART — Full Hierarchy

```
/trading:all (Supreme Commander)
    │
    ├── CEO (/trading:ceo)
    │   └── No direct subordinates (delegates to other C-levels)
    │
    ├── COO (/trading:coo)
    │   └── SRE Engineer (/trading:sre) ← uptime, monitoring, alerting
    │
    ├── CMO (/trading:cmo)
    │   └── Growth Hacker (/trading:growth) ← funnel optimization, viral loops
    │
    ├── CTO (/trading:cto)
    │   └── Backend Engineer (/trading:backend) ← core engine, architecture
    │
    ├── CFO (/trading:cfo)
    │   └── Financial Analyst (/trading:fin-analyst) ← deep P&L, modeling
    │
    ├── CDO (/trading:cdo)
    │   └── Data Engineer (/trading:data-eng) ← pipelines, ETL, storage
    │
    ├── CPO (/trading:cpo)
    │   └── Product Analyst (/trading:product-analyst) ← metrics, A/B, UX research
    │
    ├── CAIO (/trading:caio)
    │   ├── Quant Researcher (/trading:quant) ← strategy discovery, alpha
    │   └── ML Engineer (/trading:ml-eng) ← model training, optimization
    │
    ├── CSO (/trading:cso)
    │   └── Security Analyst (/trading:sec-analyst) ← vuln scan, pen-test
    │
    ├── Founder (/trading:founder)
    │   ├── Risk Analyst (/trading:risk-analyst) ← VaR, stress testing
    │   └── Market Analyst (/trading:market-analyst) ← regime, sentiment
    │
    └── Trader (/trading:auto)
        └── Execution Specialist (/trading:exec-spec) ← order routing, fills
```

**Tổng: 12 subordinates dưới 14 C-Suite roles**

---

## PART 1: QUANT RESEARCHER (Reports to CAIO)

> Tìm strategy mới, validate bằng backtest, nghiên cứu alpha signals.

### QR-01: Strategy Discovery Pipeline
```
1. LITERATURE SCAN — academic papers, crypto quant blogs
2. HYPOTHESIS — formulate signal/entry/exit rules
3. BACKTEST — run against 6mo+ historical data
4. VALIDATE — out-of-sample test, walk-forward analysis
5. COMPARE — benchmark vs existing 4 strategies
6. PROPOSE — submit to CAIO for weight assignment
```

### QR-02: Alpha Research
| Alpha Source | Module | Priority |
|-------------|--------|----------|
| New indicators | `src/core/SignalGenerator.ts` | High |
| ML-based signals | `src/core/signal-market-regime-detector.ts` | High |
| Cross-pair correlation | `src/core/portfolio-correlation-matrix-calculator.ts` | Medium |
| On-chain metrics | External APIs | Medium |
| Sentiment analysis | NLP pipeline | Low |

### QR-03: Backtest Validation Framework
| Check | Criterion | Reject If |
|-------|-----------|-----------|
| Sample size | >200 trades | <100 trades |
| Win rate | >52% | <48% |
| Profit factor | >1.3 | <1.0 |
| Max drawdown | <20% | >25% |
| Sharpe ratio | >1.0 | <0.5 |
| Overfitting test | Walk-forward passes | Fails OOS |

**Module refs:** `src/strategies/BaseStrategy.ts`, `src/core/StrategyEnsemble.ts`, `src/core/StrategyLoader.ts`

### QR-04: Strategy Proposal Template
```markdown
## Strategy: [Name]
- Signal: [indicator logic]
- Entry: [conditions]
- Exit: [conditions]
- Backtest: [period] | Trades: [N] | Win: [X%] | PF: [X.X]
- Recommended weight: [0.XX]
- Risks: [identified risks]
```

---

## PART 2: RISK ANALYST (Reports to Founder)

> VaR modeling, stress testing, Monte Carlo — quantify risk ko chỉ set limit.

### RA-01: VaR (Value at Risk) Modeling
| Method | Module | Timeframe |
|--------|--------|-----------|
| Historical VaR | `src/core/historical-var-calculator.ts` | 1d, 7d, 30d |
| Parametric VaR | Normal distribution | 1d, 7d |
| Monte Carlo VaR | Simulation (10K paths) | 1d, 7d, 30d |

### RA-02: Correlation Analysis
| Check | Module |
|-------|--------|
| Pair correlation matrix | `portfolio-correlation-matrix-calculator.ts` |
| Portfolio VaR | `portfolio-var-kelly-calculator.ts` |
| Kelly criterion sizing | `portfolio-var-kelly-calculator.ts` |
| Risk types | `portfolio-risk-types.ts` |
| Portfolio-level risk | `PortfolioRiskManager.ts` |

### RA-03: Stress Testing Scenarios
| Scenario | Parameters | Expected |
|----------|-----------|----------|
| Flash crash -20% | All pairs drop 20% in 1h | Max loss $X |
| Exchange outage | Primary exchange down 4h | Fallback active |
| Liquidation cascade | 3 positions liquidated | CB triggers |
| Black swan | -40% in 24h | All positions closed |
| Correlation spike | All pairs move together | Diversification fails |

### RA-04: Risk Report Template
```
Daily Risk Report — {date}
VaR (95%): ${X} | VaR (99%): ${X}
Portfolio beta: X.XX
Correlation: avg X.XX | max X.XX
Stress test: PASS/FAIL
Circuit breakers: X active, X triggered today
Recommendation: [hold/reduce/hedge]
```

**Module refs:** `src/core/RiskManager.ts`, `src/execution/adaptive-circuit-breaker-per-exchange.ts`

---

## PART 3: MARKET ANALYST (Reports to CAIO)

> Market regime detection, macro analysis, sentiment — feed intelligence vào signals.

### MA-01: Market Regime Detection
| Regime | Indicators | Trading Adjustment |
|--------|-----------|-------------------|
| Trending UP | ADX>25, price>SMA200 | Full exposure, trend-follow |
| Trending DOWN | ADX>25, price<SMA200 | Reduce size, short-bias |
| Ranging | ADX<20, BB squeeze | Mean-reversion strategies |
| High Volatility | ATR>2x avg, VIX spike | Reduce size, widen stops |
| Low Volatility | ATR<0.5x avg | Reduce frequency, save fees |

**Module:** `src/execution/market-regime-detector.ts`, `src/core/signal-market-regime-detector.ts`

### MA-02: Macro Indicator Tracking
| Indicator | Source | Impact | Update |
|-----------|--------|--------|--------|
| BTC Dominance | CoinMarketCap | Alt season signal | Daily |
| Fear & Greed Index | Alternative.me | Contrarian signal | Daily |
| DXY (Dollar Index) | TradingView | Inverse BTC correlation | Daily |
| Fed Rate | Fed Reserve | Macro liquidity | Monthly |
| Stablecoin flows | On-chain | Market inflow/outflow | Weekly |

### MA-03: Sentiment Scoring
| Source | Signal Type | Weight |
|--------|------------|--------|
| Crypto Twitter | Social momentum | 0.20 |
| Reddit (r/crypto) | Retail sentiment | 0.15 |
| Funding rates | Market positioning | 0.30 |
| Open interest | Leverage buildup | 0.25 |
| Exchange reserves | Supply pressure | 0.10 |

### MA-04: Intelligence Report Template
```
Market Intelligence — {date}
Regime: [TREND_UP/TREND_DOWN/RANGING/VOLATILE]
Sentiment: [score 0-100] [FEAR/NEUTRAL/GREED]
Macro: [BULLISH/NEUTRAL/BEARISH]
Key events next 7d: [list]
Recommendation: [increase/maintain/decrease exposure]
```

---

## PART 4: EXECUTION SPECIALIST (Reports to Trader)

> Order routing optimization, fill rate, slippage minimization.

### ES-01: Order Routing Optimization
| Factor | Module | Optimization |
|--------|--------|-------------|
| Exchange selection | `exchange-router-with-fallback.ts` | Lowest fee path |
| Order type | `stealth-execution-algorithms.ts` | Limit vs market |
| Timing | `phantom-stealth-math.ts` | Randomized delays |
| Size splitting | `anti-detection-order-randomizer-safety-layer.ts` | TWAP/VWAP |
| Cloaking | `phantom-order-cloaking-engine.ts` | Anti-detection |

### ES-02: Fill Rate Analysis
| Metric | Target | Alert |
|--------|--------|-------|
| Fill rate | >95% | <90% |
| Avg slippage | <5 bps | >10 bps |
| Execution latency | <500ms | >2s |
| Partial fills | <10% | >20% |
| Rejected orders | <2% | >5% |

### ES-03: Exchange Health Monitoring
| Check | Module | Frequency |
|-------|--------|-----------|
| Connection pool | `exchange-connection-pool.ts` | Continuous |
| Exchange health | `exchange-health-monitor.ts` | 30s |
| Registry status | `exchange-registry.ts` | On-change |
| Gateway pipeline | `portkey-inspired-exchange-gateway-middleware-pipeline.ts` | Per request |
| WebSocket feeds | `websocket-multi-exchange-price-feed-manager.ts` | Continuous |

### ES-04: Spread & Fee Analysis
| Check | Module |
|-------|--------|
| Cross-exchange spread | `fee-aware-cross-exchange-spread-calculator.ts` |
| Arb execution | `atomic-cross-exchange-order-executor.ts` |
| Paper vs live bridge | `paper-trading-arbitrage-bridge.ts` |
| Position management | `strategy-position-manager.ts` |

---

## PART 5: DATA ENGINEER (Reports to CDO)

> Pipeline maintenance, ETL, data storage, feed reliability.

### DE-01: Data Pipeline Architecture
```
Exchange WS/REST APIs
    ↓
websocket-multi-exchange-price-feed-manager.ts (ingestion)
    ↓
TickStore.ts (raw storage) → tick-to-candle-aggregator.ts (OHLCV)
    ↓
CollectorRegistry.ts (metrics) → AgiDbEngine.ts (persistent)
    ↓
SignalMesh.ts (cross-strategy correlation)
    ↓
HealthManager.ts (monitoring)
```

### DE-02: Pipeline Health Checklist
- [ ] WebSocket connections stable (reconnect <5s)
- [ ] Tick ingestion rate >10/s per pair
- [ ] Candle aggregation 0 gaps
- [ ] Metrics collection running
- [ ] AgiDb writes successful
- [ ] SignalMesh correlations updated
- [ ] HealthManager reporting accurately

### DE-03: Data Migration & Storage
| Data Type | Storage | Retention | Backup |
|-----------|---------|-----------|--------|
| Raw ticks | TickStore (memory) | 24h | None |
| Candles 1m | AgiDbEngine | 30 days | Weekly |
| Candles 1h+ | AgiDbEngine | 1 year | Monthly |
| Signals | SignalMesh | 7 days | Daily |
| Health metrics | HealthManager | 30 days | Weekly |

---

## PART 6: SRE ENGINEER (Reports to COO)

> Site reliability, uptime monitoring, incident response automation.

### SRE-01: Monitoring Stack
| Layer | What | Tool |
|-------|------|------|
| Process | Bot alive, memory, CPU | `http-health-check-server.ts` |
| Exchange | Connection status | `exchange-health-monitor.ts` |
| Circuit breakers | CB state per exchange | `adaptive-circuit-breaker-per-exchange.ts` |
| WebSocket | Feed health | `websocket-server.ts` |
| Alerts | Rule-based triggers | `alert-rules-engine.ts` |

### SRE-02: Uptime SLA
| Component | Target | Measurement |
|-----------|--------|-------------|
| Bot engine | 99.9% | Health endpoint |
| Price feeds | 99.5% | Tick freshness |
| Order execution | 99.0% | Fill success rate |
| Alerting | 99.9% | Alert delivery |

### SRE-03: Auto-Recovery Playbooks
| Failure | Detection | Recovery |
|---------|-----------|----------|
| Bot crash | Health check fails | Auto-restart via PM2/systemd |
| WS disconnect | HealthManager alert | Auto-reconnect (exponential backoff) |
| Exchange down | exchange-health-monitor | Failover to backup exchange |
| High memory | >80% RAM | Graceful restart |
| CB triggered | Alert rule fires | Log + notify Founder |

---

## PART 7: BACKEND ENGINEER (Reports to CTO)

> Core engine development, architecture, code quality.

### BE-01: Core Module Ownership
| Module | Files | Responsibility |
|--------|-------|---------------|
| Bot Engine | `BotEngine.ts`, plugins, config | Main trading loop |
| Signal Pipeline | `SignalGenerator.ts`, `SignalFilter.ts` | Signal generation |
| Strategy System | `StrategyEnsemble.ts`, `StrategyLoader.ts` | Strategy management |
| Order Management | `OrderManager.ts`, position manager | Trade execution |
| Risk Engine | `RiskManager.ts`, `PortfolioRiskManager.ts` | Risk enforcement |
| Autonomy | `autonomy-controller.ts` | Self-governance |
| Paper Trading | `paper-trading-engine.ts` | Simulation |
| Tenant System | `tenant-*.ts`, `raas-api-router.ts` | Multi-tenant |
| PnL Service | `pnl-realtime-snapshot-service.ts` | Real-time P&L |

### BE-02: Code Quality Standards
| Standard | Target | Check |
|----------|--------|-------|
| TypeScript strict | 0 errors | `tsc --noEmit` |
| No `any` types | 0 | `grep -r ": any" src` |
| No `@ts-ignore` | 0 | `grep -r "@ts-ignore" src` |
| File size | <200 LOC | `wc -l` |
| Test coverage | >80% | `pnpm test` |
| No console.log | 0 in prod | `grep -r "console\." src` |

### BE-03: Architecture Decision Records
Template for new features:
```markdown
## ADR-XXX: [Title]
- Status: Proposed/Accepted/Deprecated
- Context: [why needed]
- Decision: [what we chose]
- Consequences: [trade-offs]
- Modules affected: [list]
```

---

## PART 8: FINANCIAL ANALYST (Reports to CFO)

> Deep P&L analysis, per-strategy attribution, cost modeling.

### FA-01: P&L Attribution Analysis
| Dimension | Breakdown |
|-----------|-----------|
| By strategy | MacdBollingerRsi, RsiSma, Bollinger, MacdCrossover |
| By pair | BTC/USDT, ETH/USDT, etc. |
| By exchange | Binance, OKX, Bybit |
| By time period | Daily, weekly, monthly |
| By trade type | Long/short, spot/perp |

**Module:** `src/reporting/PerformanceAnalyzer.ts`, `src/core/pnl-realtime-snapshot-service.ts`

### FA-02: Cost Modeling
| Cost Category | Variables | Model |
|--------------|-----------|-------|
| Exchange fees | Volume, tier, order type | Fee tier lookup |
| Slippage | Pair liquidity, order size | Historical avg |
| Infra | Fixed monthly | Flat rate |
| API costs | Token usage, calls/day | Usage-based |
| Opportunity cost | Cash reserve yield | Risk-free rate |

### FA-03: Break-Even Dashboard
```
Revenue/day needed: $X
Current revenue/day: $X
Gap: ±$X
Days to break-even: X days
Confidence: XX%
```

---

## PART 9: SECURITY ANALYST (Reports to CSO)

> Vulnerability scanning, secrets detection, stealth integrity.

### SA-01: Security Scan Protocol
```bash
# Secrets scan
grep -r "API_KEY\|SECRET\|PASSWORD\|PRIVATE_KEY" src/ --include="*.ts" | wc -l

# Console cleanup
grep -r "console\." src/ --include="*.ts" | wc -l

# Dependency audit
pnpm audit --audit-level=high

# TypeScript safety
grep -r "@ts-ignore\|@ts-nocheck\|: any" src/ --include="*.ts" | wc -l
```

### SA-02: Stealth Module Integrity
| Module | Check | Status |
|--------|-------|--------|
| `phantom-stealth-math.ts` | OTR <15% | 🟢/🔴 |
| `stealth-execution-algorithms.ts` | Pattern randomization | 🟢/🔴 |
| `phantom-order-cloaking-engine.ts` | Rate limit safe <65% | 🟢/🔴 |
| `anti-detection-order-randomizer-safety-layer.ts` | Size jitter active | 🟢/🔴 |
| `stealth-cli-fingerprint-masking-middleware.ts` | Fingerprint masked | 🟢/🔴 |
| `binh-phap-stealth-trading-strategy.ts` | Strategy pattern varied | 🟢/🔴 |

### SA-03: API Key Security Audit
| Check | Expected | Fix |
|-------|----------|-----|
| Keys in env vars only | Yes | Move to .env |
| .env in .gitignore | Yes | Add if missing |
| Key rotation schedule | 90 days | Set reminder |
| Read-only where possible | Yes | Restrict permissions |
| IP whitelist | Yes | Configure exchange |
| 2FA on exchanges | Yes | Enable |

---

## PART 10: ML ENGINEER (Reports to CAIO)

> Model training, signal optimization, self-learning improvements.

### ML-01: Self-Learning Loop Maintenance
| Component | Module | Check |
|-----------|--------|-------|
| Weight adjustment | `autonomy-controller.ts` | Win+0.05, Loss-0.05 |
| Normalization | Same | Sum=1.0 |
| Escalation | Same | 3 losses → alert |
| Restoration | Same | 5 wins → restore |
| Strategy weights | `SignalGenerator.ts` | Within [0.05, 0.5] bounds |

### ML-02: Model Performance Tracking
| Metric | Current | Target |
|--------|---------|--------|
| Signal accuracy | XX% | >60% |
| False positive rate | XX% | <20% |
| Signal latency | Xms | <2000ms |
| Weight convergence | X cycles | <50 cycles |

### ML-03: Feature Engineering
| Feature Source | Module | Type |
|---------------|--------|------|
| Price momentum | `SignalGenerator.ts` | Indicator-based |
| Regime state | `signal-market-regime-detector.ts` | Classification |
| Cross-pair signal | `SignalMesh.ts` | Correlation |
| Signal filtering | `SignalFilter.ts`, `signal-filter-math-helpers.ts` | Math helpers |

---

## PART 11: GROWTH HACKER (Reports to CMO)

> Funnel optimization, viral loops, community growth.

### GH-01: AARRR Funnel Deep Dive
| Stage | Metric | Current | Target | Action |
|-------|--------|---------|--------|--------|
| Acquisition | GitHub visitors/week | X | 100 | SEO, content |
| Activation | Install→first backtest | XX% | >60% | Onboarding UX |
| Retention | Weekly active users | XX% | >40% | Feature engagement |
| Revenue | Free→PRO conversion | XX% | >5% | Paywall placement |
| Referral | Referral rate | XX% | >10% | Referral program |

### GH-02: Growth Experiments Template
```
Experiment: [name]
Hypothesis: [if X then Y because Z]
Metric: [primary KPI]
Audience: [segment]
Duration: [days]
Result: [uplift %]
Decision: [scale/kill/iterate]
```

### GH-03: Viral Loop Design
```
User uses bot → makes profit → shares on Twitter
    → follower clicks link → installs → profits → shares
    → Loop amplified by: leaderboard, badges, public portfolios
```

---

## PART 12: PRODUCT ANALYST (Reports to CPO)

> Product metrics, user behavior, feature impact analysis.

### PA-01: Product Analytics Framework
| Metric | Definition | Source |
|--------|-----------|--------|
| DAU | Daily active bot instances | Health server |
| Feature adoption | % users using feature | CLI telemetry |
| Error rate | Errors per session | Error logs |
| Task completion | Config→running success | CLI flow |
| NPS proxy | GitHub stars/issues ratio | GitHub API |

### PA-02: Feature Impact Analysis
```
Before: [baseline metric]
After: [post-feature metric]
Uplift: [±X%]
Statistical significance: [p-value]
Decision: [keep/iterate/remove]
```

### PA-03: User Segmentation
| Segment | Behavior | Needs |
|---------|----------|-------|
| Beginner | Paper trading only | Easy setup, docs |
| Active trader | 1-3 pairs, conservative | Reliability, alerts |
| Power user | 5+ pairs, multi-exchange | Performance, API |
| Quant | Custom strategies | Extensibility |

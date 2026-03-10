# CDO SOPs — Standard Operating Procedures

> Chief Data Officer — Data quality, price feed integrity, analytics pipeline, backtesting data.
> "Data = blood of algo trading. Bad data = bad decisions = lost money."

---

## Hierarchy

```
CEO SOPs              ← Tầm nhìn, portfolio, business model
    ↓
CDO SOPs (this file)  ← Data quality, feeds, analytics, backtesting
    ↓
CAIO SOPs             ← Signal quality, self-learning, AI models
    ↓
Trader SOPs           ← Execute, debug, troubleshoot
```

**CDO KHÔNG trade. CDO KHÔNG train model. CDO ĐẢM BẢO DATA SẠCH.**

---

## SOP-D00: CDO vs CAIO vs Trader

```
CDO                     CAIO                     Trader (Bot)
──────────────────────────────────────────────────────────────
Data quality            Signal quality           Execute signals
Price feed integrity    Strategy weights         Scan markets
Analytics pipeline      Self-learning loop       Generate trades
Backtesting data        Model performance        Report results
Historical storage      New strategy R&D         Auto-learn weights
Data governance         AI architecture          Circuit breakers
```

---

## SOP-D01: Price Feed Integrity

**Mục tiêu:** 0 gaps, <100ms latency, 99.9% uptime.

### Feed Health Checks
| Check | Module | Threshold | Alert |
|-------|--------|-----------|-------|
| Tick freshness | `TickStore.ts` | <5s stale | 🔴 |
| Price deviation | Cross-exchange compare | <0.5% delta | 🟡 |
| WebSocket health | `HealthManager.ts` | Connected | 🔴 |
| Candle gaps | `tick-to-candle-aggregator.ts` | 0 missing | 🟡 |
| Order book depth | `order-book-depth-analyzer.ts` | >$10K bids/asks | 🟡 |

### Gap Detection & Recovery
1. `TickStore.ts` tracks last tick timestamp per pair
2. Gap >5s → log warning + use last known price
3. Gap >30s → flag stale data + alert HealthManager
4. Gap >5min → circuit breaker halts pair trading
5. Recovery: backfill from REST API, verify continuity

### Module References
- `src/netdata/TickStore.ts` — tick storage, freshness tracking
- `src/netdata/HealthManager.ts` — connection health, reconnect
- `src/netdata/CollectorRegistry.ts` — metrics collection
- `src/execution/tick-to-candle-aggregator.ts` — candle building

---

## SOP-D02: Data Quality Audit

**Khi:** Weekly automated + monthly manual deep-dive.

### Audit Dimensions
| Dimension | Check | Tool |
|-----------|-------|------|
| Completeness | No missing candles in timeframe | TickStore query |
| Accuracy | Cross-validate 3+ exchanges | Price deviation |
| Timeliness | Tick age <5s | HealthManager |
| Consistency | OHLCV math: H≥O,C,L; L≤O,C,H | Validator script |
| Uniqueness | No duplicate ticks | Dedup check |

### Automated Checks
```
1. Query TickStore for last 24h per pair
2. Count ticks vs expected (1/s for WS, varies for REST)
3. Verify candle OHLCV consistency
4. Cross-check with exchange REST API spot price
5. Log anomalies to plans/reports/cdo-data-quality-{date}.md
```

### Common Data Issues
| Issue | Cause | Fix |
|-------|-------|-----|
| Missing ticks | WS disconnect | Auto-reconnect + REST backfill |
| Price spikes | Flash crash / API error | Outlier filter (>5σ = discard) |
| Stale data | Exchange maintenance | Detect + pause trading |
| Duplicate candles | Aggregator race | Dedup by timestamp |

---

## SOP-D03: Analytics Pipeline

### Data Flow
```
Exchange WS/REST → TickStore → Candle Aggregator → Indicators → SignalGenerator
                      ↓
                 HealthManager ← CollectorRegistry ← AgiDbEngine
                      ↓
              SignalMesh (cross-strategy correlation)
```

### Metrics Tracked
| Metric | Source | Granularity |
|--------|--------|-------------|
| Tick count/s | TickStore | Real-time |
| Candle completion | Aggregator | Per timeframe |
| Indicator calc time | Indicators.ts | Per signal |
| Signal latency | SignalGenerator | Per signal |
| Data pipeline E2E | HealthManager | Per cycle |

### Pipeline Health KPIs
| KPI | Target | Alert |
|-----|--------|-------|
| E2E latency | <2s | >5s |
| Tick throughput | >10/s per pair | <5/s |
| Candle gaps/day | 0 | >3 |
| Indicator errors | 0 | >0 |
| Signal freshness | <10s | >30s |

---

## SOP-D04: Backtesting Data Integrity

### Backtest Data Requirements
| Requirement | Standard |
|-------------|----------|
| Min history | 6 months per pair |
| Granularity | 1m candles minimum |
| Completeness | >99.5% candles present |
| Source | Exchange historical API |
| Storage | Local CSV/DB, versioned |

### Validation Protocol
1. Download historical data from exchange
2. Check completeness: count candles vs expected
3. Verify OHLCV consistency (H≥max(O,C), L≤min(O,C))
4. Compare with 3rd party data source
5. Flag any gaps >5 consecutive candles
6. Document data quality score per pair

### Backtest vs Live Discrepancy
| Factor | Backtest | Live | CDO Action |
|--------|----------|------|------------|
| Slippage | 0 (default) | Variable | Add slippage model |
| Fees | Fixed rate | Tiered | Use actual tier rates |
| Latency | 0 | 50-500ms | Add latency simulation |
| Fills | 100% assumed | Partial possible | Add fill probability |

---

## SOP-D05: Historical Data Management

### Storage Strategy
| Timeframe | Retention | Storage | Access Pattern |
|-----------|-----------|---------|----------------|
| Tick (1s) | 7 days | Memory/TickStore | Hot — streaming |
| 1m candles | 1 year | Local DB | Warm — backtests |
| 1h candles | 5 years | Archive | Cold — research |
| Daily | Forever | CSV/Git | Archive — analysis |

### Data Archival Protocol
- [ ] Weekly: archive 1m data older than 30 days
- [ ] Monthly: verify archive integrity (checksum)
- [ ] Quarterly: prune tick data >7 days
- [ ] Annually: backup all historical data off-site

---

## SOP-D06: CDO Checklist

### Daily
- [ ] Check price feed health (HealthManager dashboard)
- [ ] Verify tick freshness per pair (<5s)
- [ ] Monitor pipeline latency (<2s E2E)

### Weekly
- [ ] Run data quality audit (SOP-D02)
- [ ] Review candle gaps count
- [ ] Check cross-exchange price consistency

### Monthly
- [ ] Deep data quality analysis
- [ ] Backtesting data completeness check
- [ ] Pipeline performance trends
- [ ] Report to CEO: data reliability metrics

### Quarterly
- [ ] Full historical data integrity review
- [ ] Archive and prune old data
- [ ] Evaluate new data sources
- [ ] Update data quality thresholds

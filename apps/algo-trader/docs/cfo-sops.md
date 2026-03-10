# CFO SOPs — Standard Operating Procedures

> Chief Financial Officer — P&L tracking, fee analysis, tax optimization, financial modeling.
> "Mỗi đồng profit phải trừ chi phí mới là lợi nhuận thực."

---

## Hierarchy

```
CEO SOPs              ← Tầm nhìn, portfolio, business model
    ↓
CFO SOPs (this file)  ← P&L, costs, tax, financial planning
    ↓
Founder SOPs          ← Budget allocation, risk governance
    ↓
Trader SOPs           ← Execute, debug, troubleshoot
```

**CFO KHÔNG trade. CFO KHÔNG quyết strategy. CFO QUẢN LÝ TÀI CHÍNH.**

---

## SOP-F00: CFO vs CEO vs Founder

```
CFO                     CEO                      Founder
──────────────────────────────────────────────────────────────
Track P&L thực          Tầm nhìn kinh doanh      Set budget tiers
Phân tích chi phí       Chọn thị trường          Chọn pairs
Tax optimization        Business model           Scale capital
Financial modeling      Investor relations       Strategy lifecycle
Break-even analysis     Compliance/legal         Emergency protocols
Cost dashboard          Tech roadmap             Performance review
```

---

## SOP-F01: P&L Tracking (Profit & Loss Statement)

**Khi:** Daily automated + weekly manual review.

### Revenue Sources
| Source | Tracking | Module |
|--------|----------|--------|
| Trading profit | Realized P&L per trade | `PerformanceAnalyzer.ts` |
| Unrealized gains | Open positions MTM | `RiskManager.ts` |
| Funding/interest | Perpetual funding rates | Exchange API |
| Arbitrage | Cross-exchange spreads | `arbitrage-execution-engine.ts` |

### Cost Categories
| Category | Items | Est. Monthly |
|----------|-------|-------------|
| Exchange fees | Maker/taker, withdrawal | $X |
| Infrastructure | VPS, cloud, domain | $X |
| API costs | Data feeds, LLM tokens | $X |
| Development | Tools, services, subs | $X |
| **Total Costs** | | **$X** |

### Net P&L Formula
```
Net P&L = (Trading Profit + Arb Profit + Funding)
        - (Exchange Fees + Infra + API + Dev)
        - Tax Provision (est. 20-30%)
```

### Tracking Cadence
- [ ] Daily: auto-capture trade P&L from `PerformanceAnalyzer.ts`
- [ ] Weekly: aggregate costs, update dashboard
- [ ] Monthly: full P&L statement, trend analysis
- [ ] Quarterly: tax provision estimate, CEO report

---

## SOP-F02: Fee Analysis & Optimization

**Mục tiêu:** Minimize fees/revenue ratio. Target: <15% of gross profit.

### Exchange Fee Tiers
| Exchange | Maker | Taker | Volume Discount | VIP Level |
|----------|-------|-------|-----------------|-----------|
| Binance | 0.10% | 0.10% | Yes (30d vol) | Check |
| OKX | 0.08% | 0.10% | Yes | Check |
| Bybit | 0.10% | 0.10% | Yes | Check |

### Fee Optimization Actions
1. **Volume consolidation** — route volume to unlock lower tiers
2. **Maker preference** — tune algo to place more limit orders
3. **BNB/token discounts** — hold exchange tokens for fee rebates
4. **Withdrawal batching** — batch withdrawals to reduce frequency
5. **Spread capture** — arb spreads must exceed 2x round-trip fees

### Module References
- `src/execution/stealth-execution-algorithms.ts` — order type selection
- `src/execution/signal-order-pipeline-live-trading.ts` — fee-aware sizing
- `src/execution/live-exchange-manager.ts` — exchange fee configs

---

## SOP-F03: Tax Optimization Strategy

### Capital Gains Framework
| Holding Period | Tax Treatment | Strategy |
|---------------|---------------|----------|
| <1 year | Short-term (income rate) | Offset with losses |
| >1 year | Long-term (reduced rate) | HODLing positions |
| Day trading | Ordinary income | Maximize deductions |

### Tax-Loss Harvesting
1. Identify positions with unrealized losses
2. Sell to realize loss (offset gains)
3. Wait wash-sale period (if applicable)
4. Re-enter position if still bullish
5. Track net capital gains quarterly

### Deductible Expenses
- [ ] Exchange fees (100% deductible)
- [ ] Infrastructure costs (VPS, APIs)
- [ ] Software subscriptions
- [ ] Home office (if applicable)
- [ ] Professional development (courses, books)

### Record Keeping
- Export all trades CSV monthly
- Store in `plans/reports/cfo-tax-{quarter}.md`
- Reconcile exchange reports vs bot reports

---

## SOP-F04: Financial Modeling & Projections

### Break-Even Analysis
```
Monthly Break-Even = Fixed Costs / (1 - Variable Cost Ratio)

Fixed: VPS($X) + Domains($X) + Subs($X) = $X/mo
Variable: Exchange fees ~0.1% per trade
Break-Even Volume: $X in monthly trading profit
```

### ROI Projections (3 Scenarios)
| Scenario | Monthly Return | Annual ROI | Capital Needed |
|----------|---------------|------------|----------------|
| Conservative | 2-3% | 24-36% | $X |
| Moderate | 5-8% | 60-96% | $X |
| Aggressive | 10-15% | 120-180% | $X |

### Capital Efficiency Metrics
| Metric | Formula | Target |
|--------|---------|--------|
| Sharpe Ratio | (Return - RiskFree) / StdDev | >1.5 |
| Max Drawdown | Peak-to-Trough / Peak | <15% |
| Win Rate | Wins / Total Trades | >55% |
| Profit Factor | Gross Profit / Gross Loss | >1.5 |
| Fee Ratio | Total Fees / Gross Profit | <15% |

---

## SOP-F05: Cost Dashboard

### Dashboard Metrics
| Metric | Source | Update | Alert |
|--------|--------|--------|-------|
| Gross P&L | PerformanceAnalyzer | Real-time | <0 for 3 days |
| Net P&L | Gross - Costs | Daily | <0 for 1 week |
| Fee total | Exchange APIs | Per trade | >20% of gross |
| Infra cost | Manual entry | Monthly | >$100/mo |
| API tokens | LLM provider | Daily | >$5/day |
| Tax provision | Calculated | Quarterly | >30% rate |

### Report Generation
```bash
/trading:cfo review     # Full P&L + costs
/trading:cfo costs      # Cost breakdown only
/trading:cfo tax        # Tax optimization review
/trading:cfo model      # Financial projections
```

---

## SOP-F06: CFO Checklist

### Daily
- [ ] Check gross P&L (auto from PerformanceAnalyzer)
- [ ] Monitor fee/profit ratio
- [ ] Track API token spending

### Weekly
- [ ] Update cost dashboard
- [ ] Review fee optimization opportunities
- [ ] Aggregate weekly P&L statement

### Monthly
- [ ] Full P&L statement with all cost categories
- [ ] Export trade history for tax records
- [ ] Financial model vs actuals comparison
- [ ] Report to CEO: P&L trends, cost efficiency

### Quarterly
- [ ] Tax provision calculation
- [ ] ROI vs projections analysis
- [ ] Fee tier review (volume discounts)
- [ ] Break-even reassessment
- [ ] Capital efficiency report

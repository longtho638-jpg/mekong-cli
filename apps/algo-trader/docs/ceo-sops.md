# CEO SOPs — Standard Operating Procedures

> Hướng dẫn quản trị cấp CEO cho hệ thống algo-trader.
> Cấp cao nhất — tập trung tầm nhìn, đầu tư, và kiến trúc kinh doanh.

---

## Hierarchy — 3 Cấp SOPs

```
CEO SOPs (this file)    ← Tầm nhìn, portfolio, business model, team
    ↓
Founder SOPs            ← Budget, risk, strategy lifecycle, scaling
    ↓
Trader SOPs             ← Commands, execution, debug, troubleshoot
```

**CEO KHÔNG trade. CEO KHÔNG set strategy. CEO XÂY DỰNG HỆ THỐNG.**

---

## SOP-C00: CEO vs Founder vs Trader

```
CEO                     Founder                  Trader (Bot)
──────────────────────────────────────────────────────────────
Tầm nhìn 1-5 năm       Quyết định hàng tuần     Execute hàng giờ
Chọn thị trường         Chọn pairs/exchanges     Scan signals
Xây dựng team           Set budget/risk          Enforce limits
Business model          Scale capital            Optimize weights
Investor relations      Performance review       Generate reports
Compliance/legal        Emergency protocols      Circuit breakers
Tech architecture       Strategy lifecycle       Auto-learn
```

---

## SOP-C01: Quarterly Strategic Review

**Khi:** Đầu mỗi quý. 2-4 giờ.

```
1. MARKET THESIS (60 phút)
   ├── Crypto market cycle: bull/bear/accumulation?
   ├── Macro: Fed rates, regulation, ETF flows
   ├── Competitive landscape: other algo traders
   └── Output: Q{N} Market Thesis document

2. PORTFOLIO REVIEW (30 phút)
   ├── Total P&L quarter
   ├── Sharpe by strategy
   ├── Best/worst performing pairs
   ├── Exchange dependency risk
   └── Output: Portfolio scorecard

3. TECHNOLOGY AUDIT (30 phút)
   ├── System uptime %
   ├── Circuit breaker activation frequency
   ├── Strategy degradation (alpha decay)
   ├── Infrastructure costs vs returns
   └── Output: Tech health score

4. ROADMAP UPDATE (30 phút)
   ├── What to build next quarter
   ├── New strategies to research
   ├── New exchanges to add
   ├── Infrastructure improvements
   └── Output: Updated project-roadmap.md
```

**Report:** `plans/reports/ceo-quarterly-Q{N}-{year}.md`

---

## SOP-C02: Business Model Canvas

```
┌──────────────────────────────────────────────────────────┐
│                    ALGO-TRADER BIZ MODEL                  │
├────────────────┬─────────────────┬───────────────────────┤
│ Revenue        │ Cost            │ Moat                  │
│                │                 │                       │
│ • Trading P&L  │ • Exchange fees │ • 10-layer stealth    │
│ • Arb spread   │ • API costs     │ • Binh Phap strategy  │
│ • Funding rate │ • Infrastructure│ • Self-learning loop  │
│   differential │ • Claude Code   │ • 1216 tests          │
│                │   API tokens    │ • Autonomous dispatch │
├────────────────┴─────────────────┴───────────────────────┤
│ Key Metrics (CEO Dashboard)                               │
│                                                           │
│ • Monthly ROI %          • System uptime %                │
│ • Sharpe Ratio           • Alpha decay rate               │
│ • Max Drawdown           • Cost/Revenue ratio             │
│ • Win Rate               • Strategies in production       │
│ • Avg trade/day          • Exchange diversification       │
└──────────────────────────────────────────────────────────┘
```

---

## SOP-C03: Capital Allocation Strategy

**CEO quyết định allocation GIỮA các asset classes:**

```
Total Capital: $X
──────────────────────────────────────────
Asset Class 1: Algo Trading       30-50%
├── Spot trading (conservative)
├── Funding rate arb
└── Cross-exchange arb

Asset Class 2: HODLing            30-40%
├── BTC long-term
├── ETH long-term
└── Blue-chip altcoins

Asset Class 3: Stablecoin Yield   10-20%
├── Lending protocols
├── LP farming (low IL)
└── T-Bill backed stables

Asset Class 4: Cash Reserve       10-20%
├── USDT/USDC on exchanges
├── Fiat in bank
└── Emergency fund (6 tháng chi phí)
```

**Rebalancing:** Mỗi quý, hoặc khi 1 asset class lệch >10% target.

---

## SOP-C04: Risk Appetite Framework

**3 levels risk appetite — CEO set, hệ thống enforce:**

### Conservative (Mặc định cho 6 tháng đầu)
```
Max daily loss:      $100
Max weekly loss:     $500
Max monthly loss:    $1,500
Max drawdown:        10%
Max per-trade risk:  1%
Strategies:          Paper + backtest verified only
Exchanges:           2 (main + backup)
Pairs:               BTC/USDT, ETH/USDT only
```

### Moderate (Sau 6 tháng profitable)
```
Max daily loss:      $300
Max weekly loss:     $1,500
Max monthly loss:    $5,000
Max drawdown:        15%
Max per-trade risk:  2%
Strategies:          Paper verified + live small
Exchanges:           3
Pairs:               Top 5 by volume
```

### Aggressive (Sau 1 năm, proven track record)
```
Max daily loss:      $1,000
Max weekly loss:     $5,000
Max monthly loss:    $15,000
Max drawdown:        20%
Max per-trade risk:  3%
Strategies:          AGI + Stealth arb
Exchanges:           5+
Pairs:               Top 10 + funding arb
```

**Chuyển level:** CHỈ KHI đạt criteria → CEO phê duyệt → update config.

---

## SOP-C05: Technology Roadmap Governance

**CEO owns "WHAT to build". Dev team owns "HOW to build".**

```
Q1 2026: Foundation ✅
├── Core trading engine (1216 tests)
├── 4 strategies + signal consensus
├── Risk management + circuit breakers
├── 10-layer stealth stack
├── 20 CLI commands
└── Trader + Founder SOPs

Q2 2026: Scale
├── ML-based strategy discovery
├── On-chain data integration (DEX, whale)
├── Multi-timeframe analysis
├── Portfolio correlation engine
└── Telegram bot for CEO alerts

Q3 2026: Ecosystem
├── Strategy marketplace (share/sell strategies)
├── Multi-user support
├── Web dashboard (real-time)
├── Mobile alerts
└── Automated tax reporting

Q4 2026: Intelligence
├── GPT-powered market analysis
├── News sentiment integration
├── Social signal (Twitter/Reddit)
├── Predictive regime detection
└── Cross-chain arbitrage
```

**Gate:** Mỗi quarter, CEO review roadmap. NO feature creep.

---

## SOP-C06: Team & Delegation

**Hiện tại: Solo CEO + AI System**

```
CEO (Bạn)
├── Strategic decisions
├── Capital allocation
└── Risk appetite

AI System (Algo-Trader)
├── Claude Code CLI    → Execution engine
├── AutonomyController → Permission management
├── Circuit Breakers   → Safety (cannot override)
├── Tôm Hùm Daemon    → Autonomous task dispatch
└── 20 Trading Commands → Operational toolkit
```

**Khi scale team:**

| Role | Khi nào tuyển | Trách nhiệm |
|------|--------------|--------------|
| Quant Analyst | Revenue >$5K/tháng | Strategy research, backtesting |
| DevOps | 3+ exchanges live | Infrastructure, monitoring |
| Risk Manager | Portfolio >$50K | Compliance, risk modeling |
| Trader Ops | 24/7 trading | Monitoring, incident response |

---

## SOP-C07: Compliance & Legal Framework

```
1. EXCHANGE COMPLIANCE
   ├── KYC verified trên tất cả exchanges
   ├── Đọc và hiểu ToS mỗi exchange
   ├── Stealth mode: biết rủi ro ToS violation
   └── Backup plan nếu bị ban 1 exchange

2. TAX OBLIGATIONS
   ├── Ghi nhận P&L hàng tháng
   ├── Export transaction history mỗi quý
   ├── Consult tax advisor về crypto gains
   └── Giữ records tối thiểu 5 năm

3. REGULATORY AWARENESS
   ├── Theo dõi regulation crypto tại VN
   ├── MiCA (EU), SEC (US) nếu expand
   ├── AML/KYC requirements
   └── Quarterly legal review

4. OPERATIONAL SECURITY
   ├── API keys: read-only khi có thể
   ├── Withdrawal whitelist on
   ├── 2FA trên tất cả exchanges
   ├── Separate email cho mỗi exchange
   └── Hardware wallet cho long-term holdings
```

---

## SOP-C08: CEO Dashboard Metrics

**8 metrics CEO cần xem mỗi tuần:**

```
1. TOTAL ROI (%)           ← Portfolio growth
2. SHARPE RATIO            ← Risk-adjusted return
3. MAX DRAWDOWN (%)        ← Worst case scenario
4. SYSTEM UPTIME (%)       ← Infrastructure reliability
5. COST/REVENUE RATIO      ← Business efficiency
6. ALPHA DECAY RATE        ← Strategy degradation
7. EXCHANGE CONCENTRATION  ← Dependency risk
8. CASH RESERVE (%)        ← Runway/liquidity
```

**Thresholds:**
| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Monthly ROI | >5% | 0-5% | <0% |
| Sharpe | >1.5 | 0.5-1.5 | <0.5 |
| Max DD | <10% | 10-20% | >20% |
| Uptime | >99% | 95-99% | <95% |
| Cost/Rev | <20% | 20-50% | >50% |
| Cash Reserve | >20% | 10-20% | <10% |

---

## SOP-C09: Exit Strategy

**CEO phải có exit plan TRƯỚC KHI bắt đầu:**

### Scenario A: Success — Scale Up
```
Trigger: 12 tháng profitable, Sharpe >1.5
Action:  Tăng capital, thêm strategies, hire team
Goal:    Systematic trading fund
```

### Scenario B: Breakeven — Pivot
```
Trigger: 6 tháng, P&L ≈ 0 sau fees
Action:  Review strategies, reduce scope
Goal:    Focus 1-2 best strategies, cut costs
```

### Scenario C: Loss — Wind Down
```
Trigger: 3 tháng loss, DD >25%
Action:  Stop all live trading
         Move to paper-only research
         Preserve remaining capital
Goal:    Learn, iterate, or exit
```

### Scenario D: External Force — Adapt
```
Trigger: Regulation change, exchange ban, market crash
Action:  Emergency halt (SOP-F08)
         Withdraw funds to cold storage
         Wait for clarity
Goal:    Capital preservation
```

---

## SOP-C10: CEO Checklist

### Daily (2 phút)
```
□ Glance at P&L — any red flags?
□ System running? (check Telegram alerts)
```

### Weekly (30 phút)
```
□ Review Founder weekly report (SOP-F04)
□ Check CEO Dashboard metrics (SOP-C08)
□ Any regulatory news?
```

### Monthly (2 giờ)
```
□ Capital allocation review (SOP-C03)
□ Risk appetite check (SOP-C04)
□ Cost/revenue analysis
□ Tax records update (SOP-C07)
□ Technology roadmap check (SOP-C05)
```

### Quarterly (4 giờ)
```
□ Full strategic review (SOP-C01)
□ Business model validation (SOP-C02)
□ Exit strategy review (SOP-C09)
□ Team/scaling decision (SOP-C06)
□ Compliance audit (SOP-C07)
```

---

*SOPs v1.0 — 2026-03-03*
*Algo-Trader v0.9.0 — CEO Strategic Operations*
*Ref: Founder SOPs (docs/founder-sops.md) | Trader SOPs (docs/trader-sops.md)*

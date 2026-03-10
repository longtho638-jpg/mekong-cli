# Founder SOPs — Standard Operating Procedures

> Hướng dẫn chiến lược cho Founder/Owner vận hành hệ thống algo-trader.
> Cấp cao hơn Trader SOPs — tập trung quản trị, giám sát, và ra quyết định.

---

## SOP-F00: Founder vs Trader — Phân Chia Trách Nhiệm

```
Founder (Bạn)                          Trader (Bot/CLI)
─────────────────────────────────────────────────────────
Quyết định budget tổng                  Execute trades
Chọn pairs/exchanges chiến lược         Scan thị trường
Set risk limits (daily/weekly/monthly)   Enforce risk per trade
Review performance weekly               Report real-time
Approve live mode                        Run paper/backtest
Kill switch khi cần                      Auto-halt by circuit breaker
Scale up/down capital                    Optimize strategy weights
```

**Nguyên tắc:** Founder KHÔNG trade trực tiếp. Founder SET RULES → Bot EXECUTE.

---

## SOP-F01: Morning Strategic Review (5 phút)

**Khi:** Mỗi sáng, trước khi để bot chạy.

```bash
# Bước 1: Portfolio overview (1 phút)
# Đọc report cuối cùng trong plans/reports/
ls -t plans/reports/trading-*.md | head -3

# Bước 2: Quick scan thị trường (2 phút)
/trading:auto:fast BTC/USDT
/trading:auto:fast ETH/USDT

# Bước 3: Quyết định hôm nay (2 phút)
# Xem SOP-F02 Decision Matrix
```

**Output:** 1 trong 3 quyết định:
- **HOLD** — Không chạy bot, thị trường không rõ ràng
- **OBSERVE** — Chạy bot observe mode, chỉ thu thập data
- **TRADE** — Chạy bot paper/live theo budget ngày

---

## SOP-F02: Daily Decision Matrix

```
Tình huống                           → Quyết định Founder
──────────────────────────────────────────────────────────
BTC sideways, no signal               → HOLD. Không chạy.
Strong signal, chưa backtest          → Backtest trước: /trading:auto BTC/USDT backtest
Backtest tốt (Sharpe>1, WR>55%)      → Paper 2h: /trading:auto:agi BTC/USDT paper $100 2h
Paper profitable 3 ngày liên tiếp    → Live nhỏ: /trading:auto:agi BTC/USDT live $50 4h
Live profitable 1 tuần               → Scale: tăng budget $100→$200
3 ngày loss liên tiếp                 → HALT. Review strategy. Không trade 24h.
Spread >0.1% cross-exchange          → Stealth arb: /trading:auto:stealth ...
Drawdown >15% portfolio              → EMERGENCY STOP. Xem SOP-F08.
```

---

## SOP-F03: Budget Allocation Framework

**Nguyên tắc:** Không bao giờ all-in. Chia nhỏ, scale dần.

```
Tổng Portfolio: $X
─────────────────────────────────────
Tier 1: Cash Reserve      40%    ← Không trade, emergency fund
Tier 2: Paper Trading      20%    ← Test strategies (không mất tiền)
Tier 3: Live Conservative  25%    ← Bot auto, budget nhỏ
Tier 4: Live Aggressive    10%    ← AGI mode, đã verify strategy
Tier 5: Stealth Arb         5%    ← Advanced, high-risk/high-reward
```

**Scale Rules:**
| Điều kiện | Hành động |
|-----------|-----------|
| Paper profitable 3 ngày | Move 5% từ Tier 2 → Tier 3 |
| Live profitable 1 tuần | Move 5% từ Tier 1 → Tier 3 |
| Live profitable 1 tháng | Move 5% từ Tier 3 → Tier 4 |
| Loss >10% Tier 3 trong tuần | Move ALL Tier 3 → Tier 2 (paper) |
| Loss >20% portfolio | HALT ALL. Review. |

---

## SOP-F04: Weekly Performance Review

**Khi:** Mỗi Chủ Nhật, 30 phút.

```bash
# Bước 1: Thu thập reports
ls plans/reports/trading-*.md | tail -7

# Bước 2: Review metrics
# Mở từng report, check:
# - Total P&L (tuần)
# - Win Rate
# - Sharpe Ratio
# - Max Drawdown
# - Circuit breaker activations

# Bước 3: Strategy audit
/trading:review

# Bước 4: Ghi log quyết định
# File: plans/reports/founder-weekly-{date}.md
```

**Weekly Report Template:**
```markdown
## Founder Weekly Review — {date}

### Portfolio Status
| Tier | Allocation | P&L This Week | Status |
|------|-----------|---------------|--------|
| Cash Reserve | $XX | — | HOLD |
| Paper | $XX | +/-$XX | ACTIVE/PAUSED |
| Live Conservative | $XX | +/-$XX | ACTIVE/PAUSED |
| Live Aggressive | $XX | +/-$XX | ACTIVE/PAUSED |
| Stealth Arb | $XX | +/-$XX | ACTIVE/PAUSED |

### Key Metrics
| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| Total P&L | | | |
| Win Rate | | | |
| Sharpe | | | |
| Max DD | | | |
| Trades | | | |

### Decisions
- [ ] Adjust budget allocation?
- [ ] Change strategy weights?
- [ ] Add/remove pairs?
- [ ] Add/remove exchanges?
- [ ] Scale up/down?

### Action Items
1. ...
2. ...
```

---

## SOP-F05: Risk Governance

**3 tầng quản trị rủi ro Founder:**

```
Tầng 1: PER-TRADE (Bot tự quản)
├── Position size: 2% portfolio
├── Stop Loss: 2%
├── Take Profit: 5%
└── R:R minimum: 1:1.5

Tầng 2: DAILY (Circuit breaker)
├── Daily loss limit: $100 (adjustable)
├── Max drawdown: 10%
├── 3 consecutive losses → downgrade autonomy
└── Exchange down → auto-failover

Tầng 3: STRATEGIC (Founder quyết định)
├── Weekly loss limit: 5% portfolio
├── Monthly loss limit: 10% portfolio
├── Max allocation per strategy: 30%
├── Max allocation per exchange: 40%
└── Max allocation per pair: 25%
```

**Founder Override Commands:**
```bash
# Emergency halt tất cả
# → Tắt terminal running bot

# Xem health toàn hệ thống
/trading:health

# Review rủi ro hiện tại
/trading:risk

# Debug vấn đề cụ thể
/trading:debug "mô tả vấn đề"
```

---

## SOP-F06: Exchange Strategy

**Chọn exchange theo mục đích:**

| Exchange | Mạnh | Yếu | Dùng cho |
|----------|------|-----|----------|
| Binance | Liquidity cao, nhiều pair | Rate limit strict, KYC heavy | Main trading, volume |
| OKX | API friendly, funding rates | Ít pair hơn | Funding arb, paper |
| Bybit | Fee thấp, UI tốt | Spread rộng hơn | Cross-exchange arb leg |

**Multi-Exchange Rules:**
- Luôn có ≥2 exchange active (failover)
- Không >40% volume trên 1 exchange
- Stealth arb: ≥3 exchanges
- Check exchange health trước mỗi session

---

## SOP-F07: Strategy Lifecycle

**Mỗi strategy đi qua 5 giai đoạn:**

```
Phase 1: RESEARCH (1-2 ngày)
├── Đọc market regime
├── /trading:auto:fast scan
└── Output: Strategy hypothesis

Phase 2: BACKTEST (1 ngày)
├── /trading:auto BTC/USDT backtest
├── Check: Sharpe>1, WR>55%, DD<10%
└── Output: Backtest report

Phase 3: PAPER TRADE (3-7 ngày)
├── /trading:auto:agi BTC/USDT paper $100 4h
├── Chạy ≥20 trades
├── Check: consistent P&L
└── Output: Paper trading report

Phase 4: LIVE SMALL (2-4 tuần)
├── /trading:auto:agi BTC/USDT live $50 4h
├── Budget: 5% portfolio max
├── Daily review
└── Output: Live performance data

Phase 5: LIVE SCALE (ongoing)
├── Tăng budget dần: $50→$100→$200
├── Weekly review
├── Strategy weight optimization
└── Output: Steady returns
```

**Kill Criteria (dừng strategy ngay):**
- Sharpe < 0.5 trong 1 tuần live
- Win Rate < 40% (20+ trades)
- Max DD > 15%
- 5 losses liên tiếp

---

## SOP-F08: Emergency Protocols

### Red Alert — Drawdown >15%

```
1. HALT tất cả trading ngay lập tức
2. Không trade 24-48h
3. Review:
   - Strategy nào gây loss?
   - Market regime đổi?
   - Exchange issue?
4. Downgrade tất cả về paper mode
5. Re-enter live CHỈ KHI paper profitable 3 ngày
```

### Orange Alert — 3 Ngày Loss Liên Tiếp

```
1. Giảm budget 50%
2. Chuyển strategies mạnh nhất sang paper verify
3. Check market regime (trending → ranging?)
4. Adjust strategy weights
5. Resume sau 1 ngày paper profitable
```

### Yellow Alert — Exchange Issue

```
1. /trading:health → check exchange status
2. Nếu 1 exchange down → bot auto-failover (ExchangeRouter)
3. Nếu 2+ exchanges down → HALT, chờ recovery
4. /trading:debug "exchange connection timeout on {exchange}"
```

---

## SOP-F09: Scaling Playbook

**Khi nào scale up:**

| Milestone | Action |
|-----------|--------|
| Paper profitable 1 tuần | Start live $50/day |
| Live profitable 2 tuần | Increase to $100/day |
| Live profitable 1 tháng | Increase to $200/day |
| Sharpe >1.5 sustained | Add AGI mode |
| Cross-exchange spread >0.1% | Add stealth arb |

**Khi nào scale down:**

| Signal | Action |
|--------|--------|
| Weekly loss >5% | Cut budget 50% |
| Sharpe <0.5 | Back to paper |
| Circuit breaker hit 3x/week | Review + reduce |
| New exchange regulation | Pause affected exchange |

---

## SOP-F10: Compliance & Record Keeping

**Founder chịu trách nhiệm:**

```
1. RECORDS (bắt buộc)
   ├── Tất cả trades logged: plans/reports/trading-*.md
   ├── Weekly reviews: plans/reports/founder-weekly-*.md
   ├── Strategy changes documented
   └── Budget allocation history

2. TAX (tùy quốc gia)
   ├── P&L summary monthly
   ├── Capital gains tracking
   └── Exchange transaction exports

3. RISK DISCLOSURE
   ├── Algo trading có rủi ro mất vốn
   ├── Past performance ≠ future results
   ├── Circuit breakers giảm nhưng KHÔNG loại bỏ rủi ro
   └── Stealth mode: hiểu ToS của từng exchange
```

---

## SOP-F11: Founder Command Cheat Sheet

```
Chiến lược                             Command
──────────────────────────────────────────────────────
Xem nhanh thị trường                   /trading:auto:fast BTC/USDT
Review performance                     /trading:review
Health check hệ thống                  /trading:health
Xem risk hiện tại                      /trading:risk
Debug vấn đề                           /trading:debug "mô tả"
Scan toàn bộ                           /trading:scan BTC/USDT ETH/USDT
Dashboard tổng quan                    /trading:dashboard
Generate báo cáo                       /trading:report
```

**Founder KHÔNG cần dùng trực tiếp:**
- `/trading:auto:agi` — delegate cho Trader SOPs
- `/trading:auto:stealth` — delegate cho Trader SOPs
- `/trading:execute` — bot tự execute

---

## SOP-F12: Founder Checklist (Weekly)

```
□ Review tuần (SOP-F04) — 30 phút Chủ Nhật
□ Check budget allocation (SOP-F03) — đúng tier?
□ Risk governance (SOP-F05) — limits còn hợp lý?
□ Strategy lifecycle (SOP-F07) — strategy nào cần phase change?
□ Exchange health (SOP-F06) — exchanges ổn định?
□ Emergency protocols (SOP-F08) — cần trigger alert nào?
□ Scaling decision (SOP-F09) — scale up/down?
□ Records updated (SOP-F10) — reports đầy đủ?
```

---

*SOPs v1.0 — 2026-03-03*
*Algo-Trader v0.9.0 — Founder Strategic Operations*
*Ref: Trader SOPs (docs/trader-sops.md) cho operational details*

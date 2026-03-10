# Trader SOPs — Standard Operating Procedures

> Hướng dẫn vận hành hệ thống algo-trader qua Claude Code CLI.
> Mỗi SOP = 1 tình huống → 1 command → 1 kết quả.

---

## SOP-00: Command Decision Matrix

```
Tôi muốn...                          → Dùng command nào?
─────────────────────────────────────────────────────────
Xem nhanh thị trường                  → /trading:auto:fast BTC/USDT
Trade 1 pair, tôi duyệt từng lệnh   → /trading:auto BTC/USDT backtest
Trade nhiều pair cùng lúc             → /trading:auto:parallel BTC/USDT ETH/USDT
Để bot tự chạy (có circuit breaker)  → /trading:auto:agi BTC/USDT paper $100 4h
Arb chênh lệch giá ẩn danh          → /trading:auto:stealth BTC/USDT binance,okx $100 4h
```

## SOP-01: Phiên Giao Dịch Buổi Sáng

**Khi:** Mở máy, bắt đầu ngày trading.

```bash
# Bước 1: Quick scan thị trường (30s)
/trading:auto:fast BTC/USDT
/trading:auto:fast ETH/USDT

# Bước 2: Đọc report → quyết định
# Nếu Signal = BUY/SELL + confidence >70%:
/trading:auto BTC/USDT backtest    # backtest trước

# Nếu backtest tốt (Sharpe>1, WR>55%):
/trading:auto BTC/USDT paper       # paper trade thử
```

**Không làm:** Nhảy thẳng vào live mode. Luôn backtest → paper → live.

---

## SOP-02: Arbitrage Chênh Lệch Giá

**Khi:** Muốn arb cross-exchange mà không bị sàn phát hiện.

```bash
# Bước 1: Scan spread
/trading:auto:fast BTC/USDT

# Bước 2: Nếu spread > 0.1% → chạy stealth
/trading:auto:stealth BTC/USDT binance,okx,bybit $100 4h

# Bước 3: Monitor (command tự monitor, Telegram alert)
# Phantom sessions: 20-90min active, 5-20min break
# Bot tự quản lý OTR, rate, timing
```

**Safety:** Stealth mode default = dry-run (paper). Phải gõ `live` explicit.

---

## SOP-03: Chạy Bot Tự Động (AGI Mode)

**Khi:** Đã test strategy, muốn bot tự chạy vài giờ.

```bash
# Bước 1: Verify strategy bằng backtest
/trading:auto BTC/USDT ETH/USDT backtest

# Bước 2: Paper trade 2h
/trading:auto:agi BTC/USDT ETH/USDT paper $200 2h

# Bước 3: Đọc report → nếu profitable → live
/trading:auto:agi BTC/USDT ETH/USDT live $100 4h
# → Gõ "I understand the risks" để confirm
```

**Safety:**
- Circuit breaker: daily loss $100 → auto halt
- 3 losses liên tiếp → downgrade về ACT_CONFIRM (phải approve)
- 5 wins liên tiếp → auto-restore autonomy

---

## SOP-04: Debug Khi Bot Gặp Lỗi

**Khi:** Bot halt, exchange disconnect, performance kém.

```bash
# Bước 1: Health check
/trading:health

# Bước 2: Debug
/trading:debug "exchange connection timeout on binance"

# Bước 3: Review recent trades
/trading:review

# Bước 4: Adjust and restart
/trading:auto BTC/USDT paper      # paper mode trước khi live lại
```

---

## SOP-05: Escalation Ladder

**Nguyên tắc:** Luôn leo từ dưới lên, KHÔNG nhảy cấp.

```
Level 1: /trading:auto:fast       ← BẮT ĐẦU ĐÂY
    ↓ Nếu signal tốt
Level 2: /trading:auto [backtest]  ← Verify với data lịch sử
    ↓ Nếu Sharpe>1, WR>55%
Level 3: /trading:auto [paper]     ← Paper trade 2-4h
    ↓ Nếu profitable
Level 4: /trading:auto:agi [paper] ← AGI paper 4-8h
    ↓ Nếu consistent profit
Level 5: /trading:auto:agi [live]  ← LIVE (budget nhỏ $50-100)
    ↓ Nếu stable 1 tuần
Level 6: /trading:auto:stealth     ← Stealth arb (advanced)
```

**KHÔNG BAO GIỜ:**
- ❌ Nhảy thẳng Level 1 → Level 5
- ❌ Chạy live mà chưa backtest
- ❌ Budget >$100/day khi mới bắt đầu
- ❌ Disable circuit breakers

---

## SOP-06: Autonomy Levels

| Level | Khi nào dùng | Command args |
|-------|-------------|--------------|
| `observe` | Chỉ xem, học hỏi | `... observe` |
| `plan` | Xem bot suggest gì | `... plan` |
| `confirm` | Duyệt từng trade | (default) |
| `auto` | Đã tin strategy | `... auto` |

```bash
# Ví dụ: chạy AGI nhưng vẫn approve mỗi trade
/trading:auto:agi BTC/USDT paper $100 4h confirm

# Ví dụ: full auto (chỉ circuit breaker bảo vệ)
/trading:auto:agi BTC/USDT paper $100 4h auto
```

---

## SOP-07: Mode Reference

| Mode | Tiền thật? | API keys? | Khi nào dùng |
|------|-----------|-----------|-------------|
| `backtest` | Không | Không cần | Verify strategy mới |
| `paper` | Không | Optional | Test real-time không rủi ro |
| `arb` | TÙY | Cần | Arbitrage cross-exchange |
| `live` | **CÓ** | Cần | Production (cẩn thận!) |

---

## SOP-08: Safety Checklist (Trước Mỗi Phiên Live)

```
□ Đã backtest strategy? (Sharpe>1, WR>55%, DD<10%)
□ Đã paper trade ≥ 2h?
□ Budget < 5% tổng portfolio?
□ Daily loss limit set? ($100 default)
□ SL/TP configured? (SL 2%, TP 5%)
□ Exchange API keys valid?
□ Circuit breakers active? (always yes, cannot disable)
□ Telegram alerts configured? (optional but recommended)
```

---

## SOP-09: Module Quick Reference

### Core Trading
| Module | Đường dẫn | Chức năng |
|--------|-----------|-----------|
| SignalGenerator | `src/core/SignalGenerator.ts` | Consensus đa strategy |
| RiskManager | `src/core/RiskManager.ts` | SL/TP, position sizing |
| BotEngine | `src/core/BotEngine.ts` | Core bot + plugins |
| AutonomyController | `src/core/autonomy-controller.ts` | 4-tier permission dial |

### Stealth (Anti-Detection)
| Module | Đường dẫn | Chức năng |
|--------|-----------|-----------|
| PhantomCloaking | `src/execution/phantom-order-cloaking-engine.ts` | Session/OTR/rate |
| StealthMiddleware | `src/execution/stealth-cli-fingerprint-masking-middleware.ts` | Browser fingerprint |
| StealthAlgorithms | `src/execution/stealth-execution-algorithms.ts` | TWAP/VWAP/Iceberg |
| BinhPhapStealth | `src/execution/binh-phap-stealth-trading-strategy.ts` | 13-chapter strategy |
| PhantomMath | `src/execution/phantom-stealth-math.ts` | Poisson/log-normal |

### Arbitrage
| Module | Đường dẫn | Chức năng |
|--------|-----------|-----------|
| ArbEngine | `src/execution/arbitrage-execution-engine.ts` | Master arb orchestrator |
| RealtimeScanner | `src/execution/realtime-arbitrage-scanner.ts` | Spot spread scanner |
| FundingArb | `src/execution/funding-rate-arbitrage-scanner.ts` | Funding rate arb |
| TriangularArb | `src/execution/triangular-arbitrage-live-scanner.ts` | Triangular paths |
| AtomicExecutor | `src/execution/atomic-cross-exchange-order-executor.ts` | Cross-exchange atomic |

### Infrastructure
| Module | Đường dẫn | Chức năng |
|--------|-----------|-----------|
| LiveExchangeManager | `src/execution/live-exchange-manager.ts` | Exchange orchestrator |
| ExchangeRouter | `src/execution/exchange-router-with-fallback.ts` | Routing + failover |
| HealthManager | `src/netdata/HealthManager.ts` | Exchange health |
| SignalMesh | `src/netdata/SignalMesh.ts` | Signal routing |

---

## SOP-10: Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Bot halt đột ngột | Daily loss limit hit | Check report, adjust strategy |
| Exchange 429 | Rate limit | Phantom auto-adjusts (40-65%) |
| No signals | Low volatility / all HOLD | Wait, hoặc switch timeframe |
| Backtest fail | Strategy không phù hợp regime | Try different pair/timeframe |
| "I understand risks" prompt | Live mode safety | Type exactly "I understand the risks" |
| Autonomy downgraded | 3 consecutive losses | Normal — bot tự bảo vệ. Review strategy |
| Session break (stealth) | Phantom session cycle | Normal — 5-20min rest, auto-resume |

---

*SOPs v1.0 — 2026-03-03*
*Algo-Trader v0.9.0 — 1216 tests, 20 trading commands*

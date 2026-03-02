# OpenClaw DNA Integration — AGI Crypto Trading Automation
**Date:** 2026-03-02 | **Scope:** openclaw-worker → algo-trader integration patterns

---

## 1. Autonomous Trading Decision Loop

**Current IPC:** File write to `tasks/` dir → task-queue.js fs.watch → mission-dispatcher.js → runMission() via `claude -p`.

**Recommendation: Keep file IPC, add a trading-specific subdirectory.**

```
tasks/
├── HIGH_mission_algo-trader_*.txt   # existing
└── trading/                         # NEW: real-time trading signals
    ├── SIGNAL_BUY_BTC_1709123456.txt
    ├── SIGNAL_REBALANCE_1709123460.txt
    └── RISK_ALERT_drawdown_1709123470.txt
```

**Why not Redis/WebSocket?** OpenClaw already has `signal-bus.js` + `perception-engine.js` in lib/. Adding Redis is YAGNI — file IPC at 100ms poll is fast enough for crypto arb (not HFT). WebSocket adds infra complexity with no gain.

**Decision loop pattern:**
```js
// algo-trader writes signal → openclaw picks up → CC CLI executes analysis
// Signal format (algo-trader side):
fs.writeFileSync(
  `${MEKONG_DIR}/tasks/CRITICAL_mission_algo-trader_signal_${Date.now()}.txt`,
  `/cook "Analyze BTC/USDT spread: ${spreadPct}% between Binance/OKX. Current P&L: $${pnl}. Recommend: execute, skip, or adjust size. Max risk $${maxRisk}." --auto`
);
```

---

## 2. Self-CTO for Trading — Extending auto-cto-pilot.js

Add trading-specific tasks to `BINH_PHAP_TASKS` in `config.js` — **no new file needed** (KISS/DRY):

```js
// Append to BINH_PHAP_TASKS array in config.js:
{ id: 'trading_risk_review',  complexity: 'complex', cmd: 'Review algo-trader risk params: max drawdown, position sizing, stop-loss levels. Adjust based on last 7d P&L.' },
{ id: 'trading_strategy_tune', complexity: 'complex', cmd: 'Analyze algo-trader backtest results vs live performance. Identify parameter drift. Update strategy configs.' },
{ id: 'trading_arb_scan',     complexity: 'medium',  cmd: 'Scan Binance/OKX/Bybit spreads for algo-trader. Report top 3 arb opportunities with spread pct and estimated profit.' },
{ id: 'trading_portfolio_rebalance', complexity: 'medium', cmd: 'Review algo-trader portfolio allocation. Rebalance if any asset exceeds 30% concentration risk.' },
```

The existing scan→fix→verify 3-phase cycle maps cleanly:
- **SCAN** → `npm test` catches strategy regression, `npm run build` catches TS errors
- **FIX** → mission dispatched to CC CLI with specific file + line
- **VERIFY** → re-run tests to confirm fix

**Trading-specific scan extension** (add to `scanProject()` in auto-cto-pilot.js):
```js
// After existing test check:
if (projectName === 'algo-trader') {
  const riskFile = path.join(projectDir, 'data/risk-state.json');
  if (fs.existsSync(riskFile)) {
    const risk = JSON.parse(fs.readFileSync(riskFile, 'utf-8'));
    if (risk.currentDrawdown > risk.maxDrawdown * 0.8) {
      errors.push({ type: 'trading', severity: 'critical',
        message: `Drawdown ${risk.currentDrawdown}% approaching limit ${risk.maxDrawdown}%`, project: projectName });
    }
  }
}
```

---

## 3. Mission-to-Trade Pipeline with Safety Guards

**Pattern: AGI analyzes → human-readable recommendation file → algo-trader reads + gates**

```
OpenClaw dispatches analysis mission
  → CC CLI runs: analyze spread, risk, market regime
  → CC CLI writes: algo-trader/data/agi-recommendation.json
  → algo-trader BotEngine reads file every tick
  → SafetyGate validates: max_trade_size, daily_loss_limit, kill_switch
  → If PASS → execute trade
  → Write result to: algo-trader/data/trade-outcomes.json (feeds memory)
```

```typescript
// algo-trader/src/core/agi-recommendation-reader.ts
interface AgiRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE';
  pair: string;
  size_usd: number;
  confidence: number;    // 0-1
  reasoning: string;
  expires_at: number;    // unix ms — stale = ignore
  generated_by: string;  // 'openclaw-v23'
}

function readAgiRecommendation(): AgiRecommendation | null {
  const file = path.join(DATA_DIR, 'agi-recommendation.json');
  if (!fs.existsSync(file)) return null;
  const rec = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (Date.now() > rec.expires_at) return null;   // stale guard
  if (rec.confidence < 0.7) return null;           // low confidence guard
  return rec;
}
```

**Safety guards (non-negotiable):**
- Stale recommendation → ignore (>5 min old)
- Confidence < 0.7 → ignore
- Trade size > daily budget cap → reject
- Current drawdown > 80% of max → kill switch activates, no new positions
- Kill switch file: `algo-trader/data/TRADING_HALTED` (presence = halt)

---

## 4. Cross-Session Memory — Trading Insight Feedback Loop

OpenClaw's `cross-session-memory.json` tracks `missionsDispatched/missionsSucceeded`. For trading, extend the **learning-engine.js** `recordOutcome()` pattern:

```js
// openclaw-worker/lib/trading-memory-bridge.js (NEW — ~40 lines)
const TRADING_MEMORY_FILE = path.join(DATA_DIR, 'trading-insights.json');

function recordTradeOutcome({ pair, action, pnl, strategy, marketRegime }) {
  const memory = loadTradingMemory();
  memory.outcomes.push({ ts: Date.now(), pair, action, pnl, strategy, marketRegime });
  if (memory.outcomes.length > 500) memory.outcomes = memory.outcomes.slice(-500);

  // Aggregate winning patterns
  const wins = memory.outcomes.filter(o => o.pnl > 0);
  memory.winningPatterns = computePatterns(wins);
  memory.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TRADING_MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function getTradingContext() {
  // Injected into CC CLI prompts for informed decisions
  const m = loadTradingMemory();
  return `Trading context: win_rate=${m.winRate}%, best_strategy=${m.bestStrategy},
    avoid_pairs=${m.highLossPairs.join(',')}, preferred_regime=${m.bestMarketRegime}`;
}
```

**Inject into mission prompts** (mission-dispatcher.js):
```js
// In buildPrompt():
const tradingCtx = require('./trading-memory-bridge').getTradingContext();
if (projectName === 'algo-trader' && tradingCtx) {
  prompt = `${tradingCtx}\n\n${prompt}`;
}
```

**algo-trader writes back** after each trade close:
```typescript
// src/core/BotEngine.ts — on position close:
fs.writeFileSync(
  path.join(OPENCLAW_DATA_DIR, 'trade-feedback.json'),
  JSON.stringify({ pair, pnl, strategy, marketRegime, closedAt: Date.now() })
);
```
openclaw's trading-memory-bridge polls `trade-feedback.json` every 30s.

---

## 5. Existing Integration Points Summary

| Surface | Location | How to Hook |
|---------|----------|-------------|
| Project routing | `mission-dispatcher.js:107` | `'algo-trader': 'apps/algo-trader'` already registered |
| Priority gate | `mission-dispatcher.js:84` | `'agi'` keyword → P0, `'trading'` needs adding |
| Auto-task list | `config.js:BINH_PHAP_TASKS` | Add 4 trading tasks (see §2) |
| Project registry | `config.js:PROJECTS` | `'algo-trader'` already in `['mekong-cli','algo-trader','well']` |
| Learning memory | `lib/learning-engine.js` | `recordOutcome()` — extend for trade P&L |
| Safety gate | `config.js:SAFETY_GATE` | Add `algo-trader/data/` to FORBIDDEN_FILES to protect trade state |
| RL integration | `config.js:OPENCLAW_RL_*` | Future: route strategy param tuning to GPU RL server |

**algo-trader is P1 in the 3-worker tmux setup** (P0=standby, P1=well, P2=algo-trader per config line 70). Missions already routed here autonomously.

---

## Key Design Decisions

1. **File IPC over Redis** — 100ms poll sufficient, zero new infra, already working
2. **Extend config.js BINH_PHAP_TASKS** — not a new file, honors DRY
3. **AGI writes recommendation file, not direct orders** — human-readable audit trail + safety gate before execution
4. **trading-memory-bridge.js** — single ~40-line file bridges trade outcomes → CC CLI context
5. **Stale + confidence guards** — prevent acting on outdated AGI output; critical for real money

---

## Unresolved Questions

1. **Real-money kill switch**: Who resets `TRADING_HALTED` file? Manual only or auto-reset after N hours?
2. **Market regime detection**: Should OpenClaw detect regime (trending/ranging/volatile) before dispatching strategy missions, or let algo-trader own this?
3. **Trade size authority**: AGI recommends size — does algo-trader's RiskManager always override, or can AGI increase limits in high-confidence scenarios?
4. **Concurrent missions**: Config allows `MAX_CONCURRENT_MISSIONS=2`. If algo-trader has an active analysis mission AND a code-fix mission running simultaneously, they could conflict on file writes. Need team-mutex for trading data files.
5. **RL integration timing**: `OPENCLAW_RL_ENABLED` is off (no host set). When GPU server available, which strategy params feed into RL training?

# Walk-Forward Validation Pipeline — Research Report
Date: 2026-03-02 | Slug: walkforward-validation-patterns

---

## 1. Current Architecture (What Exists)

`BacktestEngine.walkForward()` already implements basic rolling WFA:
- **Splits**: Divides candles into `N` equal windows, each split 70/30 train/test
- **Mode**: Rolling (non-anchored) — each window is independent, no data reuse
- **Robustness metric**: `robustnessRatio = avgTestSharpe / avgTrainSharpe`
- **Overfit flag**: `robustnessRatio < 0.5`
- **Gap**: No optimization integration — WFA runs fixed params, not optimized-per-window

**Key missing pieces:**
1. No Walk-Forward Efficiency (WFE) calculation
2. No per-window optimization (optimize on train → validate on test)
3. No anchored window mode
4. No statistical significance test across windows

---

## 2. Walk-Forward Validation Best Practices

### 2.1 Rolling vs Anchored Windows

| Mode | Description | Best For |
|------|-------------|----------|
| **Rolling** | Fixed-size train window shifts forward | Intraday, crypto — recent data more relevant |
| **Anchored** | Train window grows from fixed start date | Weekly/daily — regime stability matters |

**Recommendation for this codebase:** Rolling is correct for crypto (highly non-stationary). Keep current approach.

### 2.2 Standard Window Ratios (Industry Norms)

- Train/Test split per window: **70/30** (current) or **80/20** ✓
- Minimum candles per window: **400+** (current guard) ✓
- Minimum windows: **4-5** to get statistically meaningful averages ✓
- Window overlap: None (current) = correct for true OOS validation

### 2.3 Optimized Walk-Forward (Missing Piece)

True WFO = optimize params on train window → apply best params to test window:

```
Window 1: optimize(trainData₁) → bestParams₁ → test(testData₁, bestParams₁)
Window 2: optimize(trainData₂) → bestParams₂ → test(testData₂, bestParams₂)
...
Aggregate: median OOS performance across all windows
```

Current implementation uses the same fixed strategy factory for both train and test — no per-window optimization.

---

## 3. Overfitting Detection Metrics

### 3.1 Walk-Forward Efficiency (WFE) — Primary Metric

```
WFE = annualizedOOS_return / annualizedIS_return
```

- WFE > 0.6: strategy generalizes well
- WFE 0.4–0.6: marginal, inspect further
- WFE < 0.4: overfitted, reject

**Current code uses**: `robustnessRatio = avgTestSharpe / avgTrainSharpe` — this is equivalent to WFE but using Sharpe instead of returns. Sharpe-based is more stable (less affected by leverage/position sizing).

### 3.2 Additional Overfitting Signals

| Metric | Formula | Threshold |
|--------|---------|-----------|
| Sharpe degradation | `testSharpe / trainSharpe` | < 0.5 = overfit (current: `overfit` flag) |
| Return degradation | `OOS_return / IS_return` | < 0.4 = overfit |
| Consistency ratio | `#windows_profitable / totalWindows` | < 0.6 = overfit |
| Param stability | std(bestParams) across windows | High variance = overfitting |

### 3.3 Probabilistic Walk-Forward (Advanced)

Run walk-forward with randomized window boundaries ±10% — if results are sensitive to boundary choice, strategy is fragile.

---

## 4. Integration Pattern with Existing Code

### 4.1 Minimal Extension to `BacktestEngine.walkForward()`

Add optional `optimizerFn` parameter:

```typescript
// Proposed signature extension
async walkForward(
  strategyFactory: (params?: Record<string, number>) => IStrategy,
  candles: ICandle[],
  windows = 5,
  trainRatio = 0.7,
  initialBalance = 10000,
  optimizerFn?: (trainCandles: ICandle[]) => Promise<Record<string, number>>
): Promise<WalkForwardResult>
```

If `optimizerFn` provided → optimize on train, apply best params to test. Backward compatible.

### 4.2 New Metrics to Add to `WalkForwardResult`

```typescript
// Extend existing interface in backtest-engine-result-types.ts
interface WalkForwardResult {
  // ... existing fields ...
  wfe: number;                    // Walk-Forward Efficiency (OOS/IS return ratio)
  consistencyRatio: number;       // % of windows with positive OOS return
  paramStability: Record<string, number>; // std of best params per window (if optimizer used)
  avgTrainSharpe: number;         // Currently computed but not stored
  avgTestSharpe: number;          // Currently computed but not stored
}
```

### 4.3 Wiring BacktestOptimizer → BacktestEngine

```typescript
// New pipeline: WalkForwardOptimizer
// 1. BacktestOptimizer.optimize(trainCandles) → bestParams
// 2. BacktestEngine.runDetailed(strategy(bestParams), testCandles) → testResult
// 3. Aggregate across windows → WalkForwardResult with WFE
```

Create `walk-forward-optimizer.ts` (new file, ~150 lines) that wraps both.

---

## 5. Implementation Priority

| Priority | Task | Complexity |
|----------|------|-----------|
| P1 | Add WFE + consistencyRatio to `WalkForwardResult` | Low — math only |
| P1 | Store avgTrainSharpe + avgTestSharpe in result | Trivial — already computed |
| P2 | Per-window optimization via `optimizerFn` callback | Medium — wire Optimizer+Engine |
| P3 | Param stability tracking | Medium |
| P4 | Anchored window mode option | Low |

---

## 6. Key Invariants to Preserve

- **No data leakage**: test window must never overlap train window
- **Strategy re-init per window**: `strategyFactory()` creates fresh instance (current ✓)
- **Warm-up respected**: `BacktestEngine.runDetailed` handles warmup per window (current ✓)
- **Min candles guard**: 400 candles/window (current ✓)

---

## Unresolved Questions

1. Should `optimizerFn` call `BacktestOptimizer` internally or be injected externally? External injection is more flexible (KISS) but adds complexity for callers.
2. What is the correct annualization factor for WFE with crypto (365 days vs 252 trading days)?
3. Should param stability be tracked per window or across all windows as a single coefficient of variation?
4. Is Sharpe-based robustness ratio (current) or return-based WFE the primary metric to expose in the API?

---

Sources:
- [Walk-Forward Optimization — QuantInsti](https://blog.quantinsti.com/walk-forward-optimization-introduction/)
- [Walk-Forward Analysis Deep Dive — IBKR](https://www.interactivebrokers.com/campus/ibkr-quant-news/the-future-of-backtesting-a-deep-dive-into-walk-forward-analysis/)
- [Walk Forward Optimization — Wikipedia](https://en.wikipedia.org/wiki/Walk_forward_optimization)
- [Rigorous Walk-Forward Validation Framework — arXiv 2024](https://arxiv.org/abs/2512.12924)
- [Walk-Forward Analysis Best Practices — Surmount](https://surmount.ai/blogs/walk-forward-analysis-vs-backtesting-pros-cons-best-practices)
- [Walk-Forward Optimization — QuantConnect Docs](https://www.quantconnect.com/docs/v2/writing-algorithms/optimization/walk-forward-optimization)

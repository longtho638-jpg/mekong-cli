# RL Trading Agents — Research Report
Date: 2026-03-02 | Researcher

## Codebase Context

`IStrategy` contract: `init(history) → onCandle(candle) → ISignal | null`
`BacktestEngine.runDetailed()` → `EngineResult` (equityCurve, trades, sharpeRatio, maxDrawdown)
An RL strategy wraps neatly inside `IStrategy`: `onCandle()` = policy action, `init()` = load model.

---

## 1. RL Architectures — Practical Ranking for TypeScript

| Algo | Suitability | Why |
|------|-------------|-----|
| **DQN** | Best for TS | Discrete action space, replay buffer fits in-memory, tfjs has working DQN example |
| **PPO** | Strong but harder | Needs actor-critic, continuous actions; research shows superior Sharpe vs DQN |
| **A2C** | Middle ground | Simpler than PPO, no replay buffer, but noisier gradients |

**Recommendation: DQN first.** PPO outperforms in research but requires 3–4× implementation complexity. DQN achieves avg 12.3% ROI across crypto pairs in published benchmarks.

---

## 2. Observation Space (State Vector)

Recommended ~15–20 normalized features per timestep:

**Price features (normalize by rolling 20-period z-score):**
- Returns: `(close - close[-1]) / close[-1]`
- High-low spread: `(high - low) / close`
- Volume ratio: `volume / sma(volume, 20)`

**Indicators (all normalized 0–1 or z-scored):**
- RSI(14) / 100
- SMA(20) / SMA(50) — ratio
- ATR(14) / close — volatility proxy
- Bollinger %B: `(close - lower) / (upper - lower)`

**Position state (critical — prevents ghost signals):**
- `isLong`: 0 or 1
- `unrealizedPnl`: normalized
- `barsHeld`: capped + normalized (e.g., min(bars, 50) / 50)

Window: stack last N=10 candles → state shape `[10, 15]` flattened to `[150]` for dense layers.

---

## 3. Action Space

**Discrete (3 actions): RECOMMENDED for initial implementation**
- 0 = HOLD, 1 = BUY, 2 = SELL
- Maps directly to `ISignal` pattern; simple softmax output
- Invalid actions masked (can't BUY when already long → mask action 1)

**Continuous (avoid initially):**
- Position sizing as continuous output (e.g., % of capital)
- Needs DDPG/PPO, harder to train, not needed for v1

---

## 4. Reward Function

**Differential Sharpe Ratio (best for stability):**
```
reward = (returnT - μ) / σ  — running estimate updated each step
```
Better than raw PnL: prevents high-variance lottery behavior.

**Risk-adjusted alternatives ranked:**
1. `differential_sharpe` — smoothest convergence, Sharpe ~1.28 in 2025 research
2. `log_return - λ * drawdown_penalty` — λ=0.1 to 0.5, simpler to tune
3. Raw PnL — easiest but trains toward gambling; avoid

**Per-step reward shaping:**
- Add small negative reward per step held (encourages efficiency)
- Large negative on ruin (balance < 20% initial) → episode termination

---

## 5. Training Loop — Episode Structure

```
Episode = one sequential pass through historical candles window (e.g., 2000 bars)
  → Reset balance, position state
  → Step through each candle: observe → act → reward → store transition
  → At episode end: sample replay buffer → gradient update

Replay buffer: CircularBuffer, capacity 50_000 transitions
Batch size: 64
Update frequency: every 4 steps
Target network sync: every 500 steps (hard copy)
Exploration: ε-greedy, ε: 1.0 → 0.1 over 10_000 steps
```

Walk-forward integration: train on first 70% of candles, eval on last 30% — aligns with existing `WalkForwardOptimizerPipeline`.

---

## 6. TensorFlow.js Practicality

**Verdict: Practical for DQN in Node.js, not for heavy PPO.**

- tfjs 4.x Node.js backend (`@tensorflow/tfjs-node`) uses native C++ bindings (libtensorflow)
- DQN with `[150 → 128 → 64 → 3]` dense network: ~2ms inference, ~50ms per gradient update on M1
- Memory: ~200MB for model + 50K replay buffer — acceptable
- Training 100K steps (~1000 episodes × 100 candles): ~10–15 min on M1 CPU; acceptable for offline training
- **Limitation:** No GPU acceleration on M1 via tfjs-node (Metal not supported as of 2025); Python PyTorch trains 10–50× faster
- **Practical pattern:** Train offline in Node.js, serialize model, load for inference in live strategy

**Alternative to tfjs:** Pure TypeScript tabular approach (see §7) avoids tfjs dependency entirely for simple cases.

---

## 7. Simpler Alternatives — When They Win

| Approach | Use When | Implementation |
|----------|----------|----------------|
| **Tabular Q-learning** | State space discretizable (<1000 states), data < 50K candles | Q-table: `Map<stateKey, number[]>`, no deps |
| **Contextual Bandits** | Signal selection (which indicator to trust), stateless rewards | LinUCB or ε-greedy over fixed actions |
| **Bayesian Optimization** | Hyperparameter tuning of existing strategies | Already have `RandomSearchOptimizer`, extend it |

**Contextual bandits outperform deep RL when:**
- Training data < 10K samples (bandit sample efficiency advantage)
- Reward is stateless (no sequential dependency between trades)
- Latency critical — bandit inference is microseconds

**Tabular Q-learning** is viable if state = discretized RSI bucket × position × trend — yields ~20×50×3 = 3000 states, fully representable in a Map.

**Recommendation for algo-trader v1:** Start with tabular Q-learning (zero deps, fast iteration), then graduate to DQN only if tabular plateaus.

---

## Integration Pattern with IStrategy

```
RLStrategy implements IStrategy:
  init(history):
    - compute indicators on history
    - load pre-trained model (tfjs or Q-table JSON)
  onCandle(candle):
    - build state vector from candle + indicator window
    - query model → action (0/1/2)
    - map to ISignal (BUY/SELL/null)
    - store transition for online fine-tuning (optional)
```

Training happens offline via `BacktestEngine.runDetailed()` used as environment simulator.

---

## Sources

- [Deep RL for Crypto Trading — Medium/Coinmonks](https://medium.com/coinmonks/deep-reinforcement-learning-for-crypto-trading-6b5705128732)
- [Risk-Adjusted DRL Multi-Reward — Springer 2025](https://link.springer.com/article/10.1007/s44196-025-00875-8)
- [Self-Rewarding Mechanism in DRL for Trading — MDPI](https://www.mdpi.com/2227-7390/12/24/4020)
- [DRL in Quantitative Algorithmic Trading — arxiv survey](https://ar5iv.labs.arxiv.org/html/2106.00123)
- [Hedging: Contextual Bandit vs Q-Learning — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S240591882300017X)
- [RL in Quantitative Finance Survey 2024 — arxiv](https://arxiv.org/pdf/2408.10932)
- [TensorFlow.js RL intro](https://medium.com/@pierrerouhard/reinforcement-learning-in-the-browser-an-introduction-to-tensorflow-js-9a02b143c099)
- [LSTM-DQN Hybrid 2025 — Springer Digital Finance](https://link.springer.com/article/10.1007/s42521-025-00156-1)

---

## Unresolved Questions

1. Does algo-trader have GPU/Metal acceleration target, or CPU-only Node.js sufficient?
2. Should RL strategy be trained per-symbol or cross-symbol (transfer learning)?
3. Is online learning (update model during live trading) in scope, or offline training only?
4. Transaction cost model: does `feeRate=0.001` reflect real maker/taker split? Matters greatly for reward shaping.
5. What episode length is realistic — full historical dataset or rolling window (e.g., 90 days)?

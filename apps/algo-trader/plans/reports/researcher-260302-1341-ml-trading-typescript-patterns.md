# ML/AI Approaches for Algorithmic Trading — TypeScript/Node.js
**Date:** 2026-03-02 | **Scope:** algo-trader integration patterns

---

## 1. Library Comparison: TensorFlow.js vs onnxruntime-node vs brain.js

| Criterion | TensorFlow.js | onnxruntime-node | brain.js |
|-----------|--------------|-----------------|---------|
| **Inference speed** | ~12ms (CPU, MobileNet) | ~4ms (native binding) | ~1ms (simple nets) |
| **Training in Node** | Yes (full) | No (inference only) | Yes (simple nets) |
| **Model source** | Native TFJS or TF SavedModel | PyTorch/TF/sklearn → ONNX export | JS-only |
| **GPU support** | WebGL/CUDA (limited) | CUDA + TensorRT (Linux) | No |
| **Bundle size** | ~13MB | ~50MB native | ~2MB |
| **Ecosystem** | Large, mature | Best for prod inference | Minimal |
| **TS support** | Official types | Official types | Community |

**Verdict:**
- **Training phase:** Use TensorFlow.js (train LSTM/GRU in Node, save model)
- **Production inference:** Use onnxruntime-node (export TF model → ONNX, 3x faster)
- **brain.js:** YAGNI — too limited for sequence models, discard

---

## 2. Feature Engineering for ICandle

From `ICandle` fields (OHLCV) + existing `Indicators` class, optimal feature vector:

```
[rsi_14, macd_hist, bb_width, bb_pb, atr_14, vol_ratio, price_change_pct,
 sma_fast_ratio, hl_range_pct, obv_normalized]
```

Priority features (research-backed, 2025):
- **RSI(14)** — normalized to [0,1] (divide by 100): momentum signal
- **MACD histogram** — zero-centered, normalize by ATR: trend divergence
- **Bollinger Band width** (`(upper-lower)/middle`) — volatility regime
- **BB %B** (`pb` field already in `BBandsResult`) — mean reversion signal
- **ATR(14) / price** — volatility-normalized risk metric (already doable via `standardDeviation`)
- **Volume ratio** (`volume / sma_volume_20`) — unusual activity detector
- **HL range %** (`(high-low)/close`) — intrabar volatility

Window: feed last **60 candles** as sequence (each candle = feature vector → shape `[60, 7]`).

Normalization: **Min-max per feature** computed over training set, stored as JSON alongside model weights.

---

## 3. LSTM/GRU for Price Direction

**Task:** Binary classification — next-candle close UP vs DOWN (not price regression, avoids lookahead bias).

**Architecture (KISS):**
```
Input [60, 7] → GRU(64, return_sequences=false) → Dropout(0.2) → Dense(32, relu) → Dense(1, sigmoid)
```
- GRU preferred over LSTM: ~30% fewer params, comparable accuracy (2025 studies)
- Output: probability of UP move → threshold 0.55 = BUY signal, <0.45 = SELL

**Training data prep:**
1. Split candles: 70% train / 15% val / 15% test (chronological, no shuffle)
2. Label: `close[t+1] > close[t]`
3. Features: compute all indicators, normalize with train-set stats
4. Sequence: sliding window of 60 candles

**Key metrics:** Accuracy >53% needed to overcome fees. Track: F1, Sharpe of signal P&L, not just raw accuracy.

---

## 4. Reinforcement Learning — Feasibility Assessment

**Q-learning / DQN verdict: LOW priority for v1**

Pros:
- `reinforce-js` npm package has TS support (Karpathy's REINFORCEjs port)
- DQN outperforms buy-and-hold in research (R-DDQN, 2024 MDPI)
- Action space fits trading: {BUY, SELL, HOLD}

Cons:
- Requires 10k+ episodes → very slow in Node.js without GPU
- Training instability: executes buy/sell in close proximity (documented flaw)
- No mature TypeScript RL framework for production trading
- Python (Stable-Baselines3 + FinRL) is 10x more practical for RL

**Recommendation:** Defer RL to Phase 2. Use supervised LSTM as Phase 1.

---

## 5. Integration Pattern — IStrategy Implementation

```typescript
class MLStrategy implements IStrategy {
  name = 'ml-lstm-direction';
  private model: InferenceSession;  // onnxruntime-node
  private normStats: NormStats;
  private window: ICandle[] = [];

  async init(history: ICandle[], config?): Promise<void> {
    this.model = await InferenceSession.create('./models/gru_direction.onnx');
    this.normStats = JSON.parse(fs.readFileSync('./models/norm_stats.json'));
    this.window = history.slice(-60);
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.window.push(candle);
    if (this.window.length > 60) this.window.shift();
    if (this.window.length < 60) return null;

    const features = buildFeatureMatrix(this.window, this.normStats); // [60,7]
    const tensor = new Tensor('float32', features.flat(), [1, 60, 7]);
    const { output } = await this.model.run({ input: tensor });
    const prob = output.data[0];

    if (prob > 0.55) return { type: SignalType.BUY, price: candle.close, timestamp: candle.timestamp };
    if (prob < 0.45) return { type: SignalType.SELL, price: candle.close, timestamp: candle.timestamp };
    return null;
  }
}
```

Model weights stored in `./models/` — loaded once at `init()`, zero overhead per candle.

---

## 6. Training Pipeline

```
1. DATA SPLIT    chronological 70/15/15 (never shuffle time series)
2. FEATURES      compute indicators → normalize with train stats → save norm_stats.json
3. TRAINING      TensorFlow.js in Node: tfjs-node backend (C++ bindings, not WebGL)
4. CHECKPOINTS   save best val-accuracy model via tf.callbacks.ModelCheckpoint
5. EXPORT        tf.SavedModel → onnx (use tf2onnx Python tool once) → deploy .onnx
6. EVALUATION    Backtest signal P&L via existing BacktestRunner (walk-forward validate)
7. METRICS       Sharpe > 1.0, MaxDrawdown < 15%, Win Rate > 52%
```

**Training runtime:** ~500 epochs × 10k candles ≈ 5-10min on M1 CPU with tfjs-node.

**Walk-forward:** Plug `MLStrategy` into existing `WalkForwardOptimizerPipeline` directly — no extra code needed.

---

## Unresolved Questions

1. **ONNX export gap:** `tf2onnx` is Python — need one-time Python script or explore `@tensorflow/tfjs-converter` to ONNX directly.
2. **Indicator lag alignment:** RSI/MACD use lookback periods — need to verify feature matrix alignment doesn't leak future data at sequence boundaries.
3. **Live retraining:** Should model retrain on rolling basis (e.g., monthly)? Triggers and cadence TBD.
4. **Multi-asset generalization:** Train per-symbol or single universal model? Requires experiment.
5. **`onTick` hook:** Could feed intrabar price updates to model — unclear if 60-candle window needs partial-candle support.

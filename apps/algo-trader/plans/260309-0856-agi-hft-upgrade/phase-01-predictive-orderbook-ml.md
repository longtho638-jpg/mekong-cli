# Phase 1: Predictive Orderbook ML

## Overview
- **Priority:** P1
- **Status:** pending
- **File:** `src/ml/predictive-orderbook-model.ts`
- **Test:** `tests/ml/predictive-orderbook-model.test.ts`

## Key Insights
- Existing GRU model uses candle-based features; this uses orderbook snapshots
- Online learning needed: model updates incrementally per snapshot (no batch retrain)
- Lightweight dense network preferred over GRU — orderbook is point-in-time, not sequential
- Follow GruPricePredictionModel pattern: build/predict/dispose lifecycle, LicenseService gate

## Requirements

### Functional
- Accept orderbook snapshot: top N bid/ask levels, volumes, spread, imbalance
- Output: `{ priceDirection: number, liquidityShiftProb: number }` (both 0-1 sigmoid)
- Online learning: `updateWeights(snapshot, actualOutcome)` — single-sample SGD step
- Batch training for initial bootstrap from historical snapshots

### Non-Functional
- Prediction latency < 5ms (dense net, not RNN)
- Memory: dispose tensors after each prediction
- < 200 lines

## Architecture

```
OrderbookSnapshot → extractFeatures() → [bidDepth, askDepth, volumeImbalance,
  spread, midPriceChange, topBidSize, topAskSize, depthRatio] → Dense(32) →
  Dense(16) → Dense(2, sigmoid) → { priceDirection, liquidityShift }
```

## Feature Vector (8 features)
1. `bidDepthTotal` — sum of bid volumes (normalized)
2. `askDepthTotal` — sum of ask volumes (normalized)
3. `volumeImbalance` — (bidVol - askVol) / (bidVol + askVol)
4. `spread` — (bestAsk - bestBid) / midPrice
5. `midPriceChange` — delta from previous snapshot
6. `topBidSize` — volume at best bid (normalized)
7. `topAskSize` — volume at best ask (normalized)
8. `depthRatio` — bidDepthTotal / askDepthTotal

## Related Code Files

### Modify
- None (new module)

### Create
- `src/ml/predictive-orderbook-model.ts`
- `tests/ml/predictive-orderbook-model.test.ts`

## Implementation Steps

1. Define `OrderbookSnapshot` interface (bids, asks as `[price, volume][]`, timestamp)
2. Define `PredictiveOrderbookConfig` (numFeatures=8, hiddenUnits=[32,16], learningRate=0.01)
3. Implement `PredictiveOrderbookModel` class:
   - `build()`: Sequential dense network, 2-output sigmoid
   - `extractFeatures(snapshot: OrderbookSnapshot, prevMid?: number): number[]`
   - `predict(snapshot): { priceDirection: number, liquidityShiftProb: number }`
   - `updateOnline(snapshot, outcome: { priceUp: boolean, liquidityShifted: boolean })`: single SGD step via `model.trainOnBatch`
   - `train(snapshots[], outcomes[], epochs, batchSize)`: bulk training
   - `dispose()`: cleanup
4. Gate `saveWeights/loadWeights` behind LicenseService PRO
5. Write tests:
   - Model builds and predicts without error
   - Output shape is correct (2 values, both 0-1)
   - Online learning changes weights
   - Feature extraction produces 8-element vector
   - LicenseService gate works

## Todo List
- [ ] Create `PredictiveOrderbookModel` class
- [ ] Implement feature extraction from orderbook snapshots
- [ ] Build dense network (8 → 32 → 16 → 2)
- [ ] Online learning via `trainOnBatch`
- [ ] PRO license gate on save/load
- [ ] Write comprehensive tests
- [ ] Verify < 200 lines

## Success Criteria
- `predict()` returns valid probabilities in < 5ms
- `updateOnline()` modifies model weights
- All tests pass with `tf.setBackend('cpu')`
- File < 200 lines

## Risk Assessment
- TF.js memory leaks: mitigate with `tf.tidy()` in all tensor ops
- Online learning instability: use small learning rate (0.01) + gradient clipping

## Security
- LicenseService PRO gate on weight persistence
- No external network calls from model itself

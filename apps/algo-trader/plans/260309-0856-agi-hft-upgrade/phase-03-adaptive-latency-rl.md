# Phase 3: Adaptive Latency Compensation via RL

## Overview
- **Priority:** P1
- **Status:** pending
- **File:** `src/execution/adaptive-latency-rl.ts`
- **Test:** `tests/execution/adaptive-latency-rl.test.ts`

## Key Insights
- Existing LatencyOptimizer tracks stats but doesn't adapt execution timing
- Existing QLearningStrategy pattern: tabular Q-learning with discretized states
- Reuse same Q-learning pattern for latency domain
- State space is small enough for tabular (no neural net needed)
- No TF.js dependency

## Requirements

### Functional
- RL agent learns optimal timing offset per exchange pair
- State: discretized [latency_bucket, spread_velocity_bucket, fill_rate_bucket]
- Actions: `EARLY_SEND` (-offset), `NORMAL` (0), `DELAYED_SEND` (+offset), `SKIP`
- Reward: net profit from trade (positive) or missed opportunity cost (negative)
- Integrates with LatencyOptimizer for latency histogram data
- Serialize/deserialize Q-table for persistence

### Non-Functional
- Action selection < 1ms (table lookup)
- Q-table size bounded: ~3^3 * 4 = 108 entries max
- < 200 lines

## Architecture

```
LatencyOptimizer.getStats(exchange) → latency percentiles
SpreadVelocity (computed from recent spreads) → spread bucket
FillRateHistory (recent fill success %) → fill bucket
                    ↓
State = "{latBucket}_{spreadBucket}_{fillBucket}"
                    ↓
Q-Table[state] → [EARLY, NORMAL, DELAYED, SKIP] → argmax → Action
                    ↓
Execute with timing offset → Observe reward → Update Q
```

### State Discretization
1. `latencyBucket`: 0=fast(<100ms), 1=medium(100-500ms), 2=slow(>500ms)
2. `spreadVelocityBucket`: 0=stable, 1=moderate, 2=volatile
3. `fillRateBucket`: 0=low(<50%), 1=medium(50-80%), 2=high(>80%)

### Actions
- `EARLY_SEND` (0): Send order 50ms before nominal time
- `NORMAL` (1): Send at standard time
- `DELAYED_SEND` (2): Wait 100ms for better fill
- `SKIP` (3): Don't execute (too risky)

### Reward
- Profitable trade: `netProfitPct * 100`
- Unprofitable trade: `netLossPct * -200` (asymmetric penalty)
- Skip when profitable opportunity existed: `-0.1` (small penalty)
- Skip when no opportunity: `0`

## Related Code Files

### Reference (read patterns)
- `src/ml/tabular-q-learning-rl-trading-strategy.ts` — Q-table pattern, epsilon-greedy, serialize
- `src/execution/latency-optimizer.ts` — LatencyOptimizer.getStats(), LatencyStats

### Create
- `src/execution/adaptive-latency-rl.ts`
- `tests/execution/adaptive-latency-rl.test.ts`

## Implementation Steps

1. Define interfaces:
   - `AdaptiveLatencyConfig { learningRate, discountFactor, epsilon, epsilonDecay, minEpsilon, timingOffsets: number[] }`
   - `LatencyAction` enum: `EARLY_SEND=0, NORMAL=1, DELAYED_SEND=2, SKIP=3`
   - `TimingDecision { action: LatencyAction, offsetMs: number, state: string }`
2. Implement `AdaptiveLatencyRL`:
   - `constructor(config?, latencyOptimizer?)` — inject LatencyOptimizer dependency
   - `discretizeState(exchange, spreadVelocity, recentFillRate): string`
   - `selectAction(state): LatencyAction` — epsilon-greedy from Q-table
   - `getTimingDecision(exchange, spreadVelocity, fillRate): TimingDecision`
   - `recordOutcome(state, action, reward)` — Q-learning update
   - `decayEpsilon()`
   - `serialize() / deserialize()` — Q-table persistence
   - `getStatesExplored() / getEpsilon()` — diagnostics
3. Use LatencyOptimizer.getStats() to derive latency bucket
4. Gate serialize/deserialize behind LicenseService PRO
5. Write tests:
   - Action selection returns valid action
   - Q-table updates after reward
   - Epsilon-greedy explores (training mode)
   - State discretization produces correct buckets
   - Timing offsets map correctly to actions
   - Serialize/deserialize roundtrip preserves Q-table
   - Decaying epsilon works

## Todo List
- [ ] Define LatencyAction enum and interfaces
- [ ] Implement Q-table with state discretization
- [ ] Implement epsilon-greedy action selection
- [ ] Implement Q-learning update rule
- [ ] Implement `getTimingDecision` helper
- [ ] Implement serialize/deserialize
- [ ] PRO gate on persistence
- [ ] Write comprehensive tests
- [ ] Verify < 200 lines

## Success Criteria
- Action selection < 1ms
- Q-table converges to prefer EARLY_SEND in high-latency states after training
- Serialize/deserialize roundtrip preserves all state
- All tests pass
- File < 200 lines

## Risk Assessment
- Small state space may underfit complex latency patterns: acceptable for v1, upgrade to DQN later
- Exploration during live trading: start with high epsilon in paper trading, decay before live

## Security
- PRO license gate on Q-table persistence
- No network calls from RL agent

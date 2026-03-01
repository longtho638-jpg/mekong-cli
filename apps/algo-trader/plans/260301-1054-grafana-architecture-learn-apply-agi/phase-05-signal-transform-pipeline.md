## Phase 5: Signal Transform Pipeline

### Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-trading-frame-data-abstraction.md)
- Inspiration: Grafana Transformations — ordered chain of transforms, each gets previous output

### Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Description:** Composable transformation pipeline for TradingFrames. Chain indicator calculations, signal filters, aggregations. Inspired by Grafana's client-side transformation system.
- **Implementation status:** pending
- **Review status:** pending
- **Effort:** 2h

### Key Insights (from Grafana)
- Grafana transforms: ordered chain, each gets previous output as input
- Key transforms: Join by field, Group by, Calculate field, Filter by value
- Client-side (browser) — lightweight, no backend roundtrip
- Warning: heavy joins on >100k rows lag browser → pre-aggregate
- **Trading mapping:** indicator chain, signal filtering, multi-exchange merge

### Requirements
- Transform interface: `(input: TradingFrame) => TradingFrame`
- Composable: chain N transforms, output of T[n] feeds T[n+1]
- Built-in transforms: AddIndicator (RSI/SMA), FilterByThreshold, MergeExchanges, CalculateSpread
- Pipeline configurable via array of transform descriptors
- Reusable across backtest and live trading contexts

### Architecture
```
Transform = (frame: TradingFrame) => TradingFrame

TransformPipeline {
  transforms: Transform[]
  add(transform: Transform): this
  execute(input: TradingFrame): TradingFrame
}

Built-in transforms:
  addRsi(period)          → adds "rsi_{period}" field
  addSma(period)          → adds "sma_{period}" field
  filterByValue(field, op, threshold) → removes rows not matching
  calculateSpread(priceFieldA, priceFieldB) → adds "spread" field
  mergeFrames(frames[])   → joins on timestamp
```

### Related Code Files
- `src/analysis/indicators.ts` — RSI, SMA calculation functions
- `src/core/trading-frame.ts` — Phase 1 TradingFrame (input/output type)
- `src/strategies/BaseStrategy.ts` — strategy analysis pipeline
- **New:** `src/core/signal-transform-pipeline.ts`
- **New:** `src/core/signal-transform-pipeline.test.ts`

### Implementation Steps
1. Define `Transform` type and `TransformPipeline` class
2. Implement pipeline execution: sequential chain with immutable frame copies
3. Built-in: `addRsi(period)` wrapping existing indicators.ts RSI function
4. Built-in: `addSma(period)` wrapping existing SMA function
5. Built-in: `filterByValue(field, operator, threshold)` — filter rows
6. Built-in: `calculateSpread(fieldA, fieldB)` — compute spread %
7. Write tests: single transform, chained pipeline, empty frame, field validation

### Todo
- [ ] Transform type + TransformPipeline class
- [ ] Pipeline execute with immutable chaining
- [ ] addRsi built-in transform
- [ ] addSma built-in transform
- [ ] filterByValue transform
- [ ] calculateSpread transform
- [ ] Unit tests (≥8 tests)

### Success Criteria
- Pipeline chains N transforms correctly (output[n] = input[n+1])
- Built-in transforms produce correct indicator values (validated against indicators.ts)
- Empty frame / missing field handled gracefully (no crash)
- Pipeline reusable in both backtest and live contexts

### Risk Assessment
- **Low:** Pure functional transforms, no side effects
- **Medium:** Performance on large candle arrays (>10k rows)
- **Mitigation:** Transforms operate on typed arrays, avoid deep copies

### Security Considerations
- Transforms are pure functions — no I/O, no network access
- No dynamic code execution (no eval)

### Next Steps
- Combine all 5 phases: TradingFrame + Plugins + Alerts + Streaming + Transforms → unified AGI trading platform

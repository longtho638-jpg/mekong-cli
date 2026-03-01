## Phase 1: TradingFrame Data Abstraction

### Context Links
- Parent: [plan.md](plan.md)
- Docs: [system-architecture](../../docs/system-architecture.md), [code-standards](../../docs/code-standards.md)
- Inspiration: Grafana `DataFrame` — columnar, exchange-agnostic data representation

### Overview
- **Date:** 2026-03-01
- **Priority:** P1 (foundation for all other phases)
- **Description:** Create `TradingFrame` — unified data container for OHLCV + signals + metadata, inspired by Grafana's `DataFrame[]`. All strategies/indicators consume and produce TradingFrames.
- **Implementation status:** pending
- **Review status:** pending
- **Effort:** 2h

### Key Insights (from Grafana)
- Grafana normalizes ALL datasource results into `DataFrame[]` (columnar: fields[] with values[])
- Mixed datasource query fans out to N backends, merges into unified DataFrame[]
- Field config (display name, unit, thresholds) attached at field level, not panel level
- **Trading mapping:** OHLCV candles + indicator outputs + signals = TradingFrame fields

### Requirements
- Functional: Unified data format consumed by all strategies, indicators, reporters
- Non-functional: Zero-copy field references where possible, <1ms serialization overhead
- Must support: timestamp, open, high, low, close, volume, custom indicator fields, signal metadata

### Architecture
```
TradingFrame {
  name: string              // e.g., "BTC/USDT@binance"
  fields: TradingField[]    // columnar data
  meta?: FrameMeta          // exchange, timeframe, strategy source
}

TradingField {
  name: string              // "close", "rsi_14", "signal"
  type: FieldType           // number | string | boolean | timestamp
  values: number[] | string[]
  config?: FieldConfig      // display, unit, thresholds
}
```

### Related Code Files
- `src/interfaces/IStrategy.ts` — current ICandle/ISignal interfaces
- `src/analysis/indicators.ts` — RSI, SMA outputs → TradingField
- `src/data/MockDataProvider.ts` — candle generation → TradingFrame
- `src/execution/ExchangeClient.ts` — live data → TradingFrame
- **New:** `src/core/trading-frame.ts`
- **New:** `src/core/trading-frame.test.ts`

### Implementation Steps
1. Define `TradingFrame`, `TradingField`, `FieldType`, `FrameMeta` interfaces in `src/core/trading-frame.ts`
2. Add factory: `TradingFrame.fromCandles(candles: ICandle[])` → convert existing candle arrays
3. Add field helpers: `frame.getField('close')`, `frame.addField(field)`, `frame.toCandles()`
4. Add merge: `TradingFrame.merge(frames: TradingFrame[])` — like Grafana mixed datasource
5. Write unit tests covering creation, field access, merge, candle round-trip
6. Update `indicators.ts` to return TradingField (backward-compatible, additive)

### Todo
- [ ] Define TradingFrame interfaces
- [ ] Implement fromCandles factory
- [ ] Implement field accessors
- [ ] Implement merge for multi-exchange data
- [ ] Unit tests (≥8 tests)
- [ ] Backward-compatible indicator output

### Success Criteria
- TradingFrame can represent any exchange OHLCV + arbitrary indicator fields
- Round-trip: candles → TradingFrame → candles lossless
- Merge produces correct multi-exchange combined frame
- All existing 346 tests still pass

### Risk Assessment
- **Low:** Additive change, no breaking existing interfaces
- **Mitigation:** fromCandles/toCandles ensure backward compat

### Security Considerations
- No sensitive data in TradingFrame (prices are public)
- Ensure no accidental API key leakage in FrameMeta

### Next Steps
- Phase 2 uses TradingFrame as plugin I/O contract

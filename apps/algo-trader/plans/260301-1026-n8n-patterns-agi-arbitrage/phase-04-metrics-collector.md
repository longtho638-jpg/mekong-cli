## Phase 4: Metrics Collector

### Context
- Parent: [plan.md](plan.md)
- n8n pattern: Prometheus-compatible `/metrics` endpoint with queue depth, active executions, memory
- Dependency: Independent

### Overview
- Date: 2026-03-01
- Priority: P2
- Description: Implement n8n-inspired metrics collector for AGI arbitrage engine. Tracks opportunities detected, trades executed, P&L, latency percentiles, regime distribution.
- Implementation status: pending
- Review status: pending

### Key Insights (from n8n)
- n8n exposes Prometheus-format metrics via `/metrics` endpoint
- Tracks: queue depth, active executions, worker count, memory
- Structured JSON logs per execution, pruned by age
- Counters + gauges + histograms for different metric types

### Requirements
- `MetricsCollector` class tracking:
  - Counters: `opportunities_detected`, `trades_executed`, `trades_successful`, `trades_failed`
  - Gauges: `current_pnl`, `equity`, `active_positions`, `regime_confidence`
  - Histograms: `execution_latency_ms`, `spread_percent`
- `getMetrics()` returns all metrics as structured object
- `toPrometheus()` formats as Prometheus text exposition format
- `reset()` for daily reset

### Architecture
```
AgiArbitrageEngine
  └─ MetricsCollector
       ├─ increment("opportunities_detected")
       ├─ gauge("current_pnl", 150.23)
       ├─ histogram("execution_latency_ms", 45)
       ├─ getMetrics() → { counters, gauges, histograms }
       └─ toPrometheus() → "# HELP arb_opportunities_detected..."
```

### Related Code Files
- NEW: `packages/vibe-arbitrage-engine/metrics-collector.ts`
- EDIT: `packages/vibe-arbitrage-engine/index.ts` (add export)

### Implementation Steps
1. Define `MetricType`, `MetricValue` types
2. Implement counter, gauge, histogram storage
3. Add `toPrometheus()` text formatter
4. Export from index

### Todo
- [ ] Define metric types
- [ ] Implement MetricsCollector class
- [ ] Prometheus text format export
- [ ] Export from index.ts

### Success Criteria
- All metric types (counter/gauge/histogram) functional
- Prometheus output parseable by standard tools
- No performance impact (<1ms per metric operation)

### Risk Assessment
- LOW: Pure additive, no side effects
- Histogram buckets need sensible defaults

### Security
- Metrics must not expose API keys or credentials
- P&L values are sensitive — consider access control for metrics endpoint

### Next Steps
- Phase 5: Integration and tests

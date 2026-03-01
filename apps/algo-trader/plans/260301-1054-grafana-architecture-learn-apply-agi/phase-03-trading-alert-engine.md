## Phase 3: Trading Alert Engine

### Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-trading-frame-data-abstraction.md)
- Inspiration: Grafana Unified Alerting — scheduler → evaluator → state machine → contact points

### Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Description:** Build alert engine for trading events: regime changes, spread thresholds, risk violations, circuit breaker triggers. Multi-dimensional (per symbol, per exchange). Inspired by Grafana's alert evaluation pipeline.
- **Implementation status:** pending
- **Review status:** pending
- **Effort:** 3h

### Key Insights (from Grafana)
- Grafana alerting: 1 rule → N instances (one per label set/time series)
- Evaluation scheduler: goroutine per rule group, jittered to avoid thundering herd
- State machine: Normal → Pending → Alerting → (Resolved/NoData/Error)
- Contact points: email, Slack, webhook — deduplication via Alertmanager
- **Trading mapping:** 1 alert rule per symbol×exchange, states: calm→warning→critical→halt

### Requirements
- Define alert rules as objects (condition, threshold, duration, severity)
- Evaluation loop checks rules against live TradingFrame data
- State machine tracks per-symbol alert state transitions
- Notification via logger + optional webhook (extensible contact points)
- Integration with existing EmergencyCircuitBreaker

### Architecture
```
AlertRule {
  id: string                  // "btc-spread-high"
  name: string
  condition: (frame: TradingFrame) => boolean
  forDuration: number         // ms — must be true for N ms before firing
  severity: 'info' | 'warning' | 'critical'
  labels: Record<string, string>  // { symbol, exchange }
}

AlertState = 'normal' | 'pending' | 'alerting' | 'resolved'

TradingAlertEngine {
  addRule(rule: AlertRule): void
  evaluate(frame: TradingFrame): AlertEvent[]
  getStates(): Map<string, AlertState>
  onAlert(cb: (event: AlertEvent) => void): void
}
```

### Related Code Files
- `packages/vibe-arbitrage-engine/emergency-circuit-breaker.ts` — existing halt mechanism
- `packages/vibe-arbitrage-engine/regime-detector.ts` — regime change events
- `packages/vibe-arbitrage-engine/profit-tracker.ts` — P&L thresholds
- **New:** `src/core/trading-alert-engine.ts`
- **New:** `src/core/trading-alert-engine.test.ts`

### Implementation Steps
1. Define `AlertRule`, `AlertEvent`, `AlertState` types
2. Implement `TradingAlertEngine` with rule registration and evaluation loop
3. State machine: Normal → Pending (condition true) → Alerting (forDuration elapsed) → Resolved
4. Add built-in rules: spread_high, regime_change, daily_loss_limit, circuit_open
5. Add onAlert callback for notification dispatch
6. Integrate with AgiArbitrageEngine — feed TradingFrame to alert evaluator
7. Write unit tests: state transitions, timing, multi-dimensional alerts

### Todo
- [ ] Define AlertRule, AlertEvent, AlertState types
- [ ] Implement TradingAlertEngine evaluation loop
- [ ] Implement state machine with timing
- [ ] Built-in trading alert rules (4 rules)
- [ ] onAlert notification callback
- [ ] Integration point with AGI engine
- [ ] Unit tests (≥8 tests)

### Success Criteria
- Alert state machine correctly transitions through Normal → Pending → Alerting → Resolved
- forDuration prevents false positives (noise filtering)
- Multi-dimensional: separate state per symbol×exchange combination
- Built-in rules detect regime changes, spread spikes, loss limits

### Risk Assessment
- **Medium:** Alert evaluation overhead in hot path (price polling loop)
- **Mitigation:** Evaluate alerts asynchronously, debounce evaluation interval

### Security Considerations
- Alert rules must not expose API keys or credentials
- Webhook notifications must use HTTPS, no plain HTTP

### Next Steps
- Phase 4 streams alert events via WebSocket to monitoring dashboards

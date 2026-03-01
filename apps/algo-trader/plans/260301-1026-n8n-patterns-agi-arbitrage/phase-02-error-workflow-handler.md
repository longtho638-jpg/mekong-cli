## Phase 2: Error Workflow Handler

### Context
- Parent: [plan.md](plan.md)
- n8n pattern: Error Trigger workflow — failed executions route to dedicated error handler
- Dependency: Phase 1 (optional, can work standalone)

### Overview
- Date: 2026-03-01
- Priority: P2
- Description: Implement n8n-inspired error workflow pattern. Failed trade executions route to a dedicated handler that can cancel open legs, log incidents, trigger alerts.
- Implementation status: pending
- Review status: pending

### Key Insights (from n8n)
- n8n has dedicated "Error Trigger" node receiving full execution context
- Per-node error output branch — order rejection → fallback route, not crash
- Separate error workflows prevent cascading failures
- Error context includes: which node failed, input data, error message, timestamp

### Requirements
- `ErrorWorkflowHandler` class with `onError(context: ErrorContext)` callback system
- Error categories: `ORDER_REJECTED`, `EXCHANGE_DOWN`, `TIMEOUT`, `INSUFFICIENT_BALANCE`, `CIRCUIT_BREAKER`
- Recovery actions per category: cancel open legs, pause trading, alert, retry
- Integration with existing `EmergencyCircuitBreaker`

### Architecture
```
AgiArbitrageEngine
  └─ onExecutionError → ErrorWorkflowHandler
       ├─ ORDER_REJECTED  → log + skip
       ├─ EXCHANGE_DOWN   → pause exchange + alert
       ├─ TIMEOUT          → retry with backoff
       ├─ INSUFFICIENT_BAL → reduce position size
       └─ CIRCUIT_BREAKER  → halt all trading
```

### Related Code Files
- NEW: `packages/vibe-arbitrage-engine/error-workflow-handler.ts`
- EDIT: `packages/vibe-arbitrage-engine/index.ts` (add export)

### Implementation Steps
1. Define `ErrorCategory`, `ErrorContext`, `RecoveryAction` types
2. Implement `ErrorWorkflowHandler` with category→action routing
3. Add `onError` callback registration
4. Export from index

### Todo
- [ ] Define error types and context
- [ ] Implement ErrorWorkflowHandler with category routing
- [ ] Add callback registration system
- [ ] Export from index.ts

### Success Criteria
- Each error category maps to specific recovery action
- Handler doesn't throw — all errors caught and logged
- Integrates with circuit breaker

### Risk Assessment
- LOW: Pure additive module
- Ensure error handler itself never crashes (double-catch pattern)

### Security
- Error logs must not leak API keys or credentials

### Next Steps
- Phase 3: Credential vault

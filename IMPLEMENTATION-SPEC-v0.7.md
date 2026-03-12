# MEKONG-CLI v0.7.0 IMPLEMENTATION SPEC
# ROIaaS DNA Phase 4: METERING (Đo Lường)
# HIEN-PHAP-ROIAAS Điều 6, Phase 4
# Usage-based billing: track every LLM call, tool run, SOP execution

---

## 0. PREREQUISITE

v0.6.0 must pass:
```bash
pnpm build && pnpm test        # 590+ tests, 0 failures
mekong billing status           # shows subscription info
```

---

## 1. SCOPE

Track all resource consumption. Enforce tier-based limits in real-time.
Feed data to v0.8 Analytics dashboard.

---

## 2. DIRECTORY STRUCTURE

```
src/
  metering/
  |   ├── types.ts              # UsageEvent, MeterReading, UsageSummary, BillingPeriod
  |   ├── collector.ts          # MeteringCollector: buffer + flush usage events
  |   ├── store.ts              # MeteringStore: JSONL per month (~/.mekong/metering/)
  |   ├── analyzer.ts           # UsageAnalyzer: aggregate by period, detect overages
  |   ├── limiter.ts            # UsageLimiter: enforce tier quotas in real-time
  |   └── cost-calculator.ts    # Map token usage → dollar cost per provider/model

  cli/commands/
  |   └── usage.ts              # mekong usage (summary/today/this-month/export/limits)
```

---

## 3. IMPLEMENTATION PHASES (7 phases, max 500 lines each)

### Phase 1: Metering Types & Store
- `src/metering/types.ts` — UsageEvent, MeterReading, UsageSummary, BillingPeriod, OverageInfo
- `src/metering/store.ts` — JSONL append, monthly rotation (YYYY-MM.jsonl), date-range query
- Tests: 10+

### Phase 2: Metering Collector
- `src/metering/collector.ts` — buffer events, flush at 50 items or 30s
- Convenience: recordLlmCall(), recordToolRun(), recordSopRun()
- Tests: 8+

### Phase 3: Usage Analyzer
- `src/metering/analyzer.ts` — aggregate by category, period breakdowns, overage detection
- Cost estimation from LLM token events
- Tests: 10+

### Phase 4: Usage Limiter
- `src/metering/limiter.ts` — checkLimit() before operations, getRemaining()
- Daily limits reset at midnight UTC
- Enterprise = Infinity (no limits)
- Tests: 8+

### Phase 5: Cost Calculator
- `src/metering/cost-calculator.ts` — provider/model → cost-per-token mapping
- Supports anthropic, openai, ollama (free), openrouter
- Tests: 6+

### Phase 6: CLI Usage Commands
- `src/cli/commands/usage.ts` — summary/today/this-month/export/limits subcommands
- Export as CSV with headers
- Register in cli/index.ts
- Tests: 6+

### Phase 7: Engine Integration
- Hook collector into LlmRouter (after each call)
- Hook limiter into ToolRegistry + SopExecutor (before each run)
- Config: metering section in defaults.ts
- Integration tests: 6+
- All existing tests pass

---

## 4. SUCCESS CRITERIA

- [ ] `pnpm test` — 640+ tests, 0 failures
- [ ] `mekong usage today` — table: category / used / limit / remaining
- [ ] `mekong usage this-month` — monthly aggregate with cost
- [ ] `mekong usage export report.csv` — valid CSV output
- [ ] LLM calls auto-metered after engine init
- [ ] Free tier blocked at 100 LLM calls/day with clear message
- [ ] Enterprise tier has no limits
- [ ] No new runtime dependencies

# MEKONG-CLI v0.8.0 IMPLEMENTATION SPEC
# ROIaaS DNA Phase 5: ANALYTICS (Tối Ưu)
# HIEN-PHAP-ROIAAS Điều 6, Phase 5
# ROI dashboard: show revenue, growth, agent performance metrics

---

## 0. PREREQUISITE

v0.7.0 must pass:
```bash
pnpm build && pnpm test        # 640+ tests, 0 failures
mekong usage today              # shows usage table
mekong billing status           # shows subscription
```

---

## 1. SCOPE

Analytics dashboard showing ROI metrics, agent swarm performance,
revenue growth, and cost optimization recommendations.
Completes the 5-Phase ROIaaS DNA cycle.

---

## 2. DIRECTORY STRUCTURE

```
src/
  analytics/
  |   ├── types.ts              # ROIMetrics, AgentPerformance, RevenueReport, GrowthIndicator
  |   ├── roi-calculator.ts     # Calculate ROI: (value_generated - cost) / cost
  |   ├── agent-scorer.ts       # AGI Score (0-100) per HIEN-PHAP Điều 7.3
  |   ├── revenue-tracker.ts    # Track revenue from license sales + usage fees
  |   ├── growth-analyzer.ts    # MoM/WoW growth, churn rate, expansion revenue
  |   └── report-generator.ts   # Generate CLI + Markdown analytics reports

  cli/commands/
  |   └── analytics.ts          # mekong analytics (roi/agents/revenue/growth/export)
```

---

## 3. IMPLEMENTATION PHASES (7 phases, max 500 lines each)

### Phase 1: Analytics Types & ROI Calculator
- `src/analytics/types.ts` — ROIMetrics, AgentPerformance, RevenueReport, GrowthIndicator
- `src/analytics/roi-calculator.ts` — ROI = (timeSaved * hourlyRate + revGenerated - totalCost) / totalCost
- Inputs from metering (cost) + kaizen (time saved) + billing (revenue)
- Tests: 10+

### Phase 2: Agent Scorer (AGI Score)
- `src/analytics/agent-scorer.ts` — score 0-100 based on:
  - Phase progress (weight 30%)
  - Activity/commit rate (weight 25%)
  - Success rate from self-improve feedback (weight 25%)
  - Resilience: error recovery rate (weight 20%)
- Tests: 8+

### Phase 3: Revenue Tracker
- `src/analytics/revenue-tracker.ts` — aggregate from receipt-store (v0.6)
- MRR, ARR, ARPU calculations
- Tier distribution (% free/starter/pro/enterprise)
- Tests: 8+

### Phase 4: Growth Analyzer
- `src/analytics/growth-analyzer.ts` — MoM/WoW growth rates
- Churn rate, expansion revenue, net revenue retention
- Cohort analysis by signup month
- Tests: 8+

### Phase 5: Report Generator
- `src/analytics/report-generator.ts` — CLI tables + Markdown output
- Sections: ROI summary, agent leaderboard, revenue breakdown, growth trends
- Tests: 6+

### Phase 6: CLI Analytics Commands
- `src/cli/commands/analytics.ts` — roi/agents/revenue/growth/export subcommands
- `mekong analytics roi` — ROI percentage + breakdown
- `mekong analytics agents` — AGI score leaderboard
- `mekong analytics revenue` — MRR/ARR/ARPU
- `mekong analytics growth` — growth trends
- `mekong analytics export report.md` — full Markdown report
- Register in cli/index.ts
- Tests: 8+

### Phase 7: Integration & Final Wiring
- Wire analytics into engine (auto-collect on shutdown)
- Connect to kaizen (bottleneck data), metering (cost data), billing (revenue data)
- Config: analytics section in defaults.ts
- Integration tests: 6+
- Full regression: all existing tests pass

---

## 4. SUCCESS CRITERIA

- [ ] `pnpm test` — 690+ tests, 0 failures
- [ ] `mekong analytics roi` — shows ROI % with breakdown
- [ ] `mekong analytics agents` — AGI score table
- [ ] `mekong analytics revenue` — MRR/ARR numbers
- [ ] `mekong analytics growth` — MoM growth percentage
- [ ] `mekong analytics export report.md` — valid Markdown file
- [ ] ROI calculator combines data from kaizen + metering + billing
- [ ] AGI Score follows HIEN-PHAP Điều 7.3 formula
- [ ] No new runtime dependencies
- [ ] v0.8 = ROIaaS DNA COMPLETE — all 5 phases operational

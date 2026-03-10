# Plan: C-Suite Expansion — 10x Agent Roles

> Phân tích toàn bộ roles cần thiết cho algo-trader ecosystem.
> Status: Phase 1 ✅ DONE — Phase 2+3 chờ phiên sau

---

## HIỆN TẠI: 11 Roles ✅

| # | Role | SOPs | Commands | Status |
|---|------|------|----------|--------|
| 1 | CEO | 11 | 4 | ✅ Done |
| 2 | COO | 9 | 4 | ✅ Done |
| 3 | CMO | 10 | 4 | ✅ Done |
| 4 | CTO | 5 | 1 | ✅ Done |
| 5 | CXO | 4 | 1 | ✅ Done |
| 6 | CHRO | 5 | 1 | ✅ Done |
| 7 | CAIO | 4 | 1 | ✅ Done |
| 8 | CSO | 4 | 1 | ✅ Done |
| 9 | CCO | 4 | 1 | ✅ Done |
| 10 | Founder | 13 | 5 | ✅ Done |
| 11 | Trader | 10 | 20 | ✅ Done |
| — | Master | — | 1 | ✅ /trading:all |
| **Total** | | **79** | **44** | |

---

## CẦN THÊM: 9 Roles Mới

### Tier A — HIGH PRIORITY ✅ DONE (2026-03-03)

| # | Role | Viết tắt | SOPs | Command | Status |
|---|------|----------|------|---------|--------|
| 12 | **CFO** | CFO | 7 SOPs (F00-F06) | `/trading:cfo` | ✅ Done |
| 13 | **CDO** | CDO | 7 SOPs (D00-D06) | `/trading:cdo` | ✅ Done |
| 14 | **CPO** | CPO | 7 SOPs (P00-P06) | `/trading:cpo` | ✅ Done |

### Tier B — MEDIUM PRIORITY (operational agents)

| # | Role | Viết tắt | Focus | Lý do cần |
|---|------|----------|-------|-----------|
| 15 | **Quant Researcher** | QR | Strategy discovery, backtest validation, alpha research, academic papers | Tìm strategy mới thay vì chỉ chạy 4 cái cũ |
| 16 | **Risk Analyst** | RA | VaR modeling, correlation analysis, stress testing, Monte Carlo | Founder manages risk limits, RA models risk |
| 17 | **Market Analyst** | MA | Regime detection, macro analysis, on-chain data, sentiment | Feed intelligence vào signal engine |

### Tier C — FUTURE (khi scale)

| # | Role | Viết tắt | Focus | Lý do cần |
|---|------|----------|-------|-----------|
| 18 | **DevOps Engineer** | DE | CI/CD, monitoring, alerting, infrastructure-as-code | Khi scale >5 exchanges |
| 19 | **QA Tester** | QA | Test automation, regression, E2E, stress testing | 1216 tests cần người manage |
| 20 | **CLO (Chief Legal)** | CLO | Crypto regulation, exchange ToS compliance, tax law | Khi revenue >$10K/mo |

---

## IMPLEMENTATION STATUS

### Phase 1: Tier A ✅ DONE (2026-03-03 13:20)
CFO (7 SOPs + command) | CDO (7 SOPs + command) | CPO (7 SOPs + command)

### Phase 1.5: Subordinates ✅ DONE (2026-03-03 13:30)
12 subordinate roles with SOPs + commands under C-Suite hierarchy.

### Phase 1.6: OpenClaw Architecture ✅ DONE (2026-03-03 13:35)
- Architecture doc: `docs/openclaw-autonomous-trading-company-architecture.md`
- Schedule config: `config/trading-company-autonomous-schedule.json`
- Decision engine: `openclaw-worker/lib/trading-company-decision-engine.js`
- 3-tier auto/escalate/halt logic — tested and verified.

### Phase 1.7: AGI Integration ✅ DONE (2026-03-03 13:45)
- Cadence scheduler: `openclaw-worker/lib/trading-cadence-scheduler.js`
  - 7 cadences (hourly → quarterly), time-since-last-run tracking
  - Auto-dispatch trading missions when algo-trader is GREEN
  - Throttled to max 3 missions per tick, 5min cooldown
- Post-mission handler: `openclaw-worker/lib/trading-post-mission-report-handler.js`
  - Parses reports → decision engine → queues follow-up actions
  - AUTO_FIX: auto-dispatch fix command
  - HALT: dispatch emergency command (e.g., /trading:founder:emergency red)
  - ESCALATE: log for Chairman review
- Wired into `auto-cto-pilot.js` (GREEN path → trading cadence check)
- Wired into `task-queue.js` (post-mission → report analysis → decision engine)
- All integration tests PASSED

---

## ORIGINAL IMPLEMENTATION PLAN

### Phase 1: Tier A (3 roles, ~30 min)

```
1. CFO SOPs + /trading:cfo command
   - P&L tracking (trading profit - fees - infra - API costs)
   - Tax optimization (capital gains, loss harvesting)
   - Financial modeling (projected ROI, break-even)
   - Cost dashboard (exchange fees, token usage, infrastructure)

2. CDO SOPs + /trading:cdo command
   - Data quality audit (price feed gaps, stale data)
   - Analytics pipeline (metrics aggregation)
   - Backtesting data integrity
   - Historical data management

3. CPO SOPs + /trading:cpo command
   - Product roadmap governance
   - Feature prioritization (impact vs effort)
   - User feedback loop
   - Release management
```

### Phase 2: Tier B (3 roles, ~30 min)

```
4. Quant Researcher + /trading:quant command
   - Strategy discovery pipeline
   - Academic paper review
   - Backtest validation framework
   - Alpha research (new indicators, ML signals)

5. Risk Analyst + /trading:risk-analyst command
   - VaR (Value at Risk) modeling
   - Correlation matrix across pairs
   - Stress testing (flash crash, black swan)
   - Monte Carlo simulation

6. Market Analyst + /trading:market command
   - Market regime detection (trending/ranging/volatile)
   - Macro indicator tracking
   - On-chain data analysis
   - Social sentiment scoring
```

### Phase 3: Tier C + Update Master (future)

```
7. DevOps Engineer (when >5 exchanges)
8. QA Tester (when >2000 tests)
9. CLO (when revenue >$10K/mo)
10. Update /trading:all to include all new roles
```

---

## MODULE MAPPING (Deep Reference)

| New Role | Existing Modules to Reference |
|----------|------------------------------|
| CFO | `src/reporting/PerformanceAnalyzer.ts`, exchange fee configs |
| CDO | `src/netdata/TickStore.ts`, `src/netdata/HealthManager.ts` |
| CPO | `docs/project-roadmap.md`, `docs/project-changelog.md` |
| Quant | `src/strategies/`, `src/core/SignalGenerator.ts`, `src/indicators/` |
| Risk Analyst | `src/core/RiskManager.ts`, `src/execution/adaptive-circuit-breaker-per-exchange.ts` |
| Market Analyst | `src/indicators/Indicators.ts`, `src/netdata/` |

---

## COMMAND AFTER EXPANSION

```
/trading:all ← Supreme Commander (20 roles)
    ├── C-Suite (13):
    │   CEO COO CMO CTO CXO CHRO CAIO CSO CCO CFO CDO CPO CLO
    ├── Operational (3):
    │   Quant Researcher, Risk Analyst, Market Analyst
    ├── Tactical (2):
    │   Founder, Trader
    └── Infrastructure (2):
        DevOps, QA
```

**Projected totals after expansion:**
- **20 roles**
- **~110 SOPs**
- **~55 commands**
- **1 master orchestrator**

---

## EXECUTION COMMAND (Copy-paste phiên sau)

```
/cook Phase 1: Tạo CFO + CDO + CPO SOPs + commands theo plan
trong plans/260303-1313-csuite-expansion-10x-agent-roles/plan.md
```

---

*Plan created: 2026-03-03 13:13*
*Priority: Phase 1 (Tier A) first*
*Est. tokens: ~15K per phase*

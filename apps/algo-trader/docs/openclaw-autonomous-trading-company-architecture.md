# OpenClaw Autonomous Trading Company — Kiến Trúc Vận Hành

> Tôm Hùm + LLM = CEO tự trị, vận hành toàn bộ 26 roles qua 44 trading commands.
> "Cấp LLM cho OpenClaw → mọi thứ chạy auto có kiểm soát."

---

## TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────────┐
│                   ANTIGRAVITY (Chairman)                         │
│              Chiến lược tổng + phê duyệt gates                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Telegram / mission files
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              🦞 TÔM HÙM — AUTONOMOUS CEO                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ SCHEDULER    │  │ ROLE ENGINE  │  │ DECISION ENGINE      │  │
│  │ (Cadence)    │→ │ (26 Roles)   │→ │ (Auto/Escalate/Halt) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │                │
│         ▼                  ▼                    ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ MISSION      │  │ REPORT       │  │ CONTROL GATES        │  │
│  │ GENERATOR    │→ │ AGGREGATOR   │→ │ (Circuit Breakers)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  Output: mission_algo-trader_{role}_{action}.txt                │
│  → CC CLI executes → /trading:{role} {action}                   │
│  → Report saved → Tôm Hùm reads → Next decision                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CC CLI (Execution Engine)                      │
│           claude -p "/trading:{role} {action}"                   │
│           → Reads SOPs → Scans modules → Generates report       │
└─────────────────────────────────────────────────────────────────┘
```

---

## MODULE 1: SCHEDULER — Cadence Engine

Mỗi role có cadence riêng. Scheduler sinh mission files theo lịch.

### Schedule Matrix

```
HOURLY (mỗi giờ khi bot chạy live):
├── /trading:exec-spec health       ← Exchange connection check
├── /trading:sre uptime             ← System uptime verify
└── /trading:data-eng health        ← Pipeline health

EVERY_4H (4 giờ/lần):
├── /trading:auto:fast              ← Quick trading scan
├── /trading:risk-analyst var       ← VaR update
└── /trading:market-analyst regime  ← Regime detection

DAILY (sáng 8:00 AM ICT):
├── /trading:coo health             ← 5-pillar health check
├── /trading:cfo review             ← P&L daily snapshot
├── /trading:fin-analyst pnl        ← P&L attribution
├── /trading:sec-analyst scan       ← Security scan
├── /trading:backend quality        ← Code quality gate
├── /trading:ml-eng learning        ← Self-learning loop check
├── /trading:quant alpha            ← Alpha source scan
└── /trading:market-analyst intel   ← Market intelligence

WEEKLY (Monday 9:00 AM ICT):
├── /trading:ceo dashboard          ← CEO KPI dashboard
├── /trading:coo perf               ← Performance analysis
├── /trading:cfo costs              ← Cost optimization review
├── /trading:cdo audit              ← Data quality audit
├── /trading:cpo roadmap            ← Roadmap status
├── /trading:cto audit              ← Tech review
├── /trading:caio audit             ← AI signal audit
├── /trading:cso audit              ← Security audit
├── /trading:growth funnel          ← AARRR funnel analysis
├── /trading:product-analyst metrics ← Product metrics
├── /trading:risk-analyst stress    ← Stress testing
└── /trading:founder strategy       ← Strategy lifecycle review

MONTHLY (1st of month):
├── /trading:all full monthly       ← Full 26-role review
├── /trading:ceo allocate           ← Capital reallocation
├── /trading:cfo tax                ← Tax optimization
├── /trading:cfo model              ← Financial projections
├── /trading:cmo content            ← Content calendar
├── /trading:chro audit             ← Team health
├── /trading:cxo audit              ← UX audit
├── /trading:cco review             ← Revenue review
└── /trading:founder budget         ← Budget rebalance

QUARTERLY (1st of quarter):
├── /trading:all full quarterly     ← Supreme Commander review
├── /trading:ceo risk               ← Risk appetite review
├── /trading:cpo prioritize         ← ICE feature scoring
├── /trading:quant discover         ← New strategy pipeline
└── /trading:growth experiment      ← Growth experiments review
```

### Scheduler Config Format (JSON)

```json
{
  "schedules": [
    {
      "id": "hourly-health",
      "cron": "0 * * * *",
      "missions": [
        { "role": "exec-spec", "action": "health", "timeout": "SIMPLE" },
        { "role": "sre", "action": "uptime", "timeout": "SIMPLE" },
        { "role": "data-eng", "action": "health", "timeout": "SIMPLE" }
      ],
      "parallel": true,
      "gate": "NONE"
    },
    {
      "id": "daily-ops",
      "cron": "0 8 * * *",
      "missions": [
        { "role": "coo", "action": "health", "timeout": "MEDIUM" },
        { "role": "cfo", "action": "review", "timeout": "MEDIUM" },
        { "role": "sec-analyst", "action": "scan", "timeout": "SIMPLE" },
        { "role": "backend", "action": "quality", "timeout": "SIMPLE" },
        { "role": "ml-eng", "action": "learning", "timeout": "SIMPLE" }
      ],
      "parallel": false,
      "gate": "AUTO"
    },
    {
      "id": "weekly-review",
      "cron": "0 9 * * 1",
      "missions": [
        { "role": "all", "action": "quick weekly", "timeout": "COMPLEX" }
      ],
      "parallel": false,
      "gate": "REPORT_TO_CHAIRMAN"
    },
    {
      "id": "monthly-deep",
      "cron": "0 9 1 * *",
      "missions": [
        { "role": "all", "action": "full monthly", "timeout": "STRATEGIC" }
      ],
      "parallel": false,
      "gate": "CHAIRMAN_APPROVAL"
    }
  ]
}
```

---

## MODULE 2: ROLE ENGINE — Mission Generator

Converts schedule entries into mission files that OpenClaw dispatches.

### Mission File Format

```
# File: tasks/mission_algo-trader_coo_health_20260303.txt
algo-trader: /trading:coo health

Report to: plans/reports/coo-health-260303.md
Timeout: MEDIUM (30min)
Priority: P1
Gate: AUTO
```

### Role → Command Mapping (Complete)

```javascript
const ROLE_COMMANDS = {
  // C-Suite (14)
  'ceo':      { cmd: '/trading:ceo',      subs: ['dashboard','allocate','risk'] },
  'coo':      { cmd: '/trading:coo',      subs: ['health','perf','incident'] },
  'cmo':      { cmd: '/trading:cmo',      subs: ['content','growth','launch'] },
  'cto':      { cmd: '/trading:cto',      subs: ['audit'] },
  'cfo':      { cmd: '/trading:cfo',      subs: ['review','costs','tax','model'] },
  'cdo':      { cmd: '/trading:cdo',      subs: ['audit','feeds','pipeline','backtest'] },
  'cpo':      { cmd: '/trading:cpo',      subs: ['review','roadmap','prioritize','release'] },
  'cxo':      { cmd: '/trading:cxo',      subs: ['audit','onboard','a2ui'] },
  'chro':     { cmd: '/trading:chro',     subs: ['audit'] },
  'caio':     { cmd: '/trading:caio',     subs: ['audit','weights','learning','model'] },
  'cso':      { cmd: '/trading:cso',      subs: ['audit','scan','stealth','keys'] },
  'cco':      { cmd: '/trading:cco',      subs: ['review','revenue','pipeline','pricing','b2b'] },
  'founder':  { cmd: '/trading:founder',  subs: ['budget','strategy','scale','emergency'] },
  'trader':   { cmd: '/trading:auto',     subs: ['parallel','fast','agi','stealth'] },

  // Subordinates (12)
  'quant':          { cmd: '/trading:quant',          subs: ['discover','backtest','alpha','propose'] },
  'risk-analyst':   { cmd: '/trading:risk-analyst',   subs: ['var','stress','correlation','report'] },
  'market-analyst': { cmd: '/trading:market-analyst', subs: ['regime','macro','sentiment','intel'] },
  'exec-spec':      { cmd: '/trading:exec-spec',      subs: ['routing','fills','slippage','health'] },
  'data-eng':       { cmd: '/trading:data-eng',       subs: ['pipeline','feeds','storage','health'] },
  'sre':            { cmd: '/trading:sre',            subs: ['uptime','alerts','recovery','monitor'] },
  'backend':        { cmd: '/trading:backend',        subs: ['audit','architecture','quality','modules'] },
  'fin-analyst':    { cmd: '/trading:fin-analyst',    subs: ['pnl','attribution','costs','breakeven'] },
  'sec-analyst':    { cmd: '/trading:sec-analyst',    subs: ['scan','stealth','keys','vuln'] },
  'ml-eng':         { cmd: '/trading:ml-eng',         subs: ['learning','weights','features','model'] },
  'growth':         { cmd: '/trading:growth',         subs: ['funnel','experiment','viral','conversion'] },
  'product-analyst':{ cmd: '/trading:product-analyst', subs: ['metrics','adoption','segments','impact'] },
};
```

---

## MODULE 3: DECISION ENGINE — Auto/Escalate/Halt

### 3-Tier Decision Framework

```
┌──────────────────────────────────────────────────────┐
│  TIER 1: AUTO-EXECUTE (không cần phê duyệt)         │
│  ───────────────────────────────────────────────────  │
│  • Health checks (hourly)                            │
│  • Data quality audits                               │
│  • Code quality scans                                │
│  • Security scans                                    │
│  • P&L snapshots                                     │
│  • VaR calculations                                  │
│  • Regime detection                                  │
│  Condition: READ-ONLY operations, no state changes   │
└──────────────────────────────────────────────────────┘
                      │
                      ▼ Nếu phát hiện anomaly
┌──────────────────────────────────────────────────────┐
│  TIER 2: AUTO-FIX + REPORT (fix nhỏ, báo cáo sau)   │
│  ───────────────────────────────────────────────────  │
│  • Strategy weight adjustment (self-learning loop)   │
│  • Circuit breaker reset                             │
│  • WS reconnection                                   │
│  • Minor code fixes (console.log cleanup)            │
│  Condition: Changes reversible, impact < $100        │
└──────────────────────────────────────────────────────┘
                      │
                      ▼ Nếu impact lớn
┌──────────────────────────────────────────────────────┐
│  TIER 3: ESCALATE TO CHAIRMAN (chờ phê duyệt)       │
│  ───────────────────────────────────────────────────  │
│  • Capital reallocation >10%                         │
│  • New strategy deployment                           │
│  • Risk appetite change                              │
│  • Exchange add/remove                               │
│  • Budget tier change                                │
│  • Emergency halt                                    │
│  Condition: Irreversible OR impact > $100            │
└──────────────────────────────────────────────────────┘
```

### Decision Rules (Pseudo-code)

```javascript
function decideAction(report) {
  // HALT CONDITIONS (immediate)
  if (report.drawdown > 0.20) return { action: 'HALT', cmd: '/trading:founder:emergency red' };
  if (report.cb_triggered > 3)  return { action: 'HALT', cmd: '/trading:coo:incident P0' };
  if (report.security_vuln > 0) return { action: 'HALT', cmd: '/trading:cso audit' };

  // ESCALATE CONDITIONS
  if (report.capital_change > 0.10)  return { action: 'ESCALATE', reason: 'Capital reallocation >10%' };
  if (report.new_strategy)           return { action: 'ESCALATE', reason: 'New strategy proposal' };
  if (report.risk_appetite_change)   return { action: 'ESCALATE', reason: 'Risk appetite change' };

  // AUTO-FIX CONDITIONS
  if (report.weight_drift > 0.05)    return { action: 'AUTO_FIX', cmd: '/trading:ml-eng weights' };
  if (report.console_logs > 0)       return { action: 'AUTO_FIX', cmd: '/trading:backend quality' };
  if (report.feed_stale)             return { action: 'AUTO_FIX', cmd: '/trading:data-eng feeds' };

  // AUTO-EXECUTE (default: continue)
  return { action: 'CONTINUE', next_schedule: 'default' };
}
```

---

## MODULE 4: REPORT AGGREGATOR — Intelligence Loop

### Report Flow

```
CC CLI executes /trading:{role} {action}
    ↓
Report saved: plans/reports/{role}-{action}-{date}.md
    ↓
Tôm Hùm reads report (post-mission)
    ↓
Extract KPIs (regex/LLM parse)
    ↓
Feed into Decision Engine
    ↓
Next mission generated OR escalate
```

### Report Parsing (Key Patterns)

```javascript
const REPORT_PATTERNS = {
  status:    /Status:\s*(🟢|🔴|🟡)/g,
  score:     /Score:\s*(\d+)\/(\d+)/,
  pnl:       /Net P&L.*?\$([0-9,.]+)/,
  drawdown:  /Max DD.*?(\d+\.?\d*)%/,
  winrate:   /Win.*?(\d+\.?\d*)%/,
  errors:    /❌|FAIL|ERROR/gi,
  alerts:    /🔴|CRITICAL|P0/gi,
};

function parseReport(reportContent) {
  const red_flags = (reportContent.match(REPORT_PATTERNS.alerts) || []).length;
  const errors = (reportContent.match(REPORT_PATTERNS.errors) || []).length;
  return {
    healthy: red_flags === 0 && errors === 0,
    red_flags,
    errors,
    needs_action: red_flags > 0,
    needs_escalation: red_flags > 3,
  };
}
```

---

## MODULE 5: CONTROL GATES — Safety Hierarchy

```
IMMUTABLE (Tôm Hùm CANNOT override):
├── Circuit breaker triggers            ← src/execution/adaptive-circuit-breaker-per-exchange.ts
├── Max daily loss limit                ← src/core/RiskManager.ts
├── Per-trade position limits           ← RiskManager config
└── API key read-only restrictions      ← Exchange settings

CHAIRMAN APPROVAL REQUIRED:
├── Capital reallocation >10%
├── New exchange integration
├── Risk appetite level change
├── New strategy going live
└── Emergency halt override

TÔM HÙM AUTO (within bounds):
├── Strategy weight adjustment [0.05, 0.5]
├── Circuit breaker reset (after cooldown)
├── WS reconnection
├── Code quality fixes
├── Report generation
└── Schedule adjustment
```

---

## MODULE 6: INTEGRATION — OpenClaw Config Changes

### Thêm vào `config.js`

```javascript
// Trading Company Autonomous Operations
ALGO_TRADER_SCHEDULE_FILE: path.join(MEKONG_DIR, 'apps/algo-trader/config/trading-schedule.json'),
ALGO_TRADER_REPORTS_DIR: path.join(MEKONG_DIR, 'apps/algo-trader/plans/reports'),

// Decision thresholds
HALT_DRAWDOWN_THRESHOLD: 0.20,        // 20% max DD → halt all trading
HALT_CB_THRESHOLD: 3,                 // 3 CBs → halt
ESCALATE_CAPITAL_THRESHOLD: 0.10,     // 10% realloc → escalate
AUTO_FIX_WEIGHT_DRIFT: 0.05,          // 5% weight drift → auto-fix
```

### Thêm vào `auto-cto-pilot.js`

```javascript
// Trading company cadence missions
const TRADING_CADENCE = {
  hourly:   ['exec-spec health', 'sre uptime', 'data-eng health'],
  daily:    ['coo health', 'cfo review', 'backend quality', 'ml-eng learning'],
  weekly:   ['all quick weekly'],
  monthly:  ['all full monthly'],
};

function generateTradingMission(cadence) {
  const missions = TRADING_CADENCE[cadence] || [];
  const mission = missions[state.tradingCadenceIndex % missions.length];
  state.tradingCadenceIndex++;
  return `algo-trader: /trading:${mission}`;
}
```

### Mission Dispatcher Route

```javascript
// In detectProjectDir(), algo-trader missions route to apps/algo-trader
// The /trading:* command prefix ensures CC CLI loads algo-trader CLAUDE.md
// which activates all trading SOPs and module references
```

---

## DAILY OPERATION FLOW (Example)

```
08:00 AM ──→ Scheduler triggers "daily-ops"
    │
    ├── Mission 1: /trading:coo health
    │   → Report: plans/reports/coo-health-260303.md
    │   → Result: 🟢 All 5 pillars healthy
    │   → Decision: CONTINUE
    │
    ├── Mission 2: /trading:cfo review
    │   → Report: plans/reports/cfo-financial-260303.md
    │   → Result: 🟡 Fee ratio 18% (target <15%)
    │   → Decision: AUTO_FIX → queue /trading:fin-analyst costs
    │
    ├── Mission 3: /trading:backend quality
    │   → Report: inline
    │   → Result: 🔴 3 console.log found
    │   → Decision: AUTO_FIX → queue /cook "remove console.log"
    │
    ├── Mission 4: /trading:ml-eng learning
    │   → Report: inline
    │   → Result: 🟢 Self-learning loop OK
    │   → Decision: CONTINUE
    │
    └── Mission 5: /trading:sec-analyst scan
        → Report: plans/reports/security-scan-260303.md
        → Result: 🟢 0 secrets, 0 high vulns
        → Decision: CONTINUE

09:00 AM ──→ All daily missions complete
    │
    └── Aggregate: 4/5 GREEN, 1 AUTO_FIX queued
        → Log to tom_hum_cto.log
        → Next: wait for 4h cadence (12:00)

12:00 PM ──→ Scheduler triggers "every-4h"
    ├── /trading:auto:fast
    ├── /trading:risk-analyst var
    └── /trading:market-analyst regime
    ...continues...

MONDAY 09:00 AM ──→ Weekly review
    └── /trading:all quick weekly
        → Full 26-role scan
        → Master report generated
        → Sent to Chairman for review
```

---

## EMERGENCY FLOW

```
TRIGGER: Drawdown >20% detected by RiskManager

1. Circuit breaker fires automatically (immutable)
2. Alert rule fires → alert-rules-engine.ts
3. Next Tôm Hùm poll detects CB event
4. Decision Engine: HALT
5. Mission: /trading:founder:emergency red
6. CC CLI executes emergency protocol
7. Report + Telegram alert to Chairman
8. ALL trading missions paused until Chairman approval
9. Chairman sends "resume" → Tôm Hùm re-enables schedule
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Scheduler (config only)
- [ ] Create `apps/algo-trader/config/trading-schedule.json`
- [ ] Add schedule config to `openclaw-worker/config.js`
- [ ] Add `generateTradingMission()` to `auto-cto-pilot.js`

### Phase 2: Decision Engine (new module)
- [ ] Create `openclaw-worker/lib/trading-decision-engine.js`
- [ ] Implement report parsing
- [ ] Implement 3-tier decision logic
- [ ] Wire into post-mission handler

### Phase 3: Report Aggregator
- [ ] Create `openclaw-worker/lib/trading-report-aggregator.js`
- [ ] Parse report files for KPIs
- [ ] Feed into decision engine
- [ ] Generate daily/weekly summaries

### Phase 4: Control Gates
- [ ] Implement escalation to Chairman (Telegram)
- [ ] Implement halt mechanism
- [ ] Implement resume mechanism
- [ ] Test emergency flow end-to-end

---

## KEY DESIGN PRINCIPLES

1. **READ BEFORE WRITE** — Tôm Hùm chủ yếu chạy /trading commands = READ operations (audit, scan, review). Chỉ AUTO_FIX cho thay đổi nhỏ.

2. **REPORT-DRIVEN** — Mọi quyết định dựa trên report output, không đoán. Parse 🟢/🔴/🟡 → quyết định.

3. **IMMUTABLE SAFETY** — Circuit breakers, loss limits KHÔNG BAO GIỜ bị override bởi Tôm Hùm. Chỉ Chairman mới có quyền thay đổi.

4. **ESCALATION > ACTION** — Khi không chắc, ESCALATE. Tốt hơn hỏi Chairman 1 phút hơn mất $1000.

5. **CADENCE > REACTIVE** — Chạy theo lịch > chạy vì sợ. Scheduled missions ổn định hơn reactive fixes.

6. **ONE COMMAND AT A TIME** — Tôm Hùm dispatch 1 mission → chờ complete → parse report → decide next. Không spam parallel missions.

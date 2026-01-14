---
description: 🏯 Unified AgencyOS workflow - brainstorm → plan → code → test → ship in one flow
argument-hint: [idea or task description]
---

## Mission

**ONE COMMAND TO RULE THEM ALL** - Run the complete AgencyOS workflow from idea to production.

This is the unified entry point that orchestrates ALL AgencyOS components following
the Binh Pháp 4-phase methodology.

<task>$ARGUMENTS</task>

---

## 🏯 The Unified Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   🏯 AGENCYOS UNIFIED FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /agencyos "Build newsletter SaaS"                              │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PHASE 1: BRAINSTORM (Mưu Công)                          │   │
│  │ • Strategic analysis with Binh Pháp                     │   │
│  │ • WIN-WIN-WIN alignment check                           │   │
│  │ • Generate implementation plan                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PHASE 2: PLAN (Kế Hoạch)                                │   │
│  │ • Create task.md with checklist                         │   │
│  │ • Create implementation_plan.md                         │   │
│  │ • User approval gate                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PHASE 3: CODE (Quân Tranh)                              │   │
│  │ • Run VIBE 6-step workflow                              │   │
│  │ • Agent orchestration (cook)                            │   │
│  │ • Code review gate                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PHASE 4: TEST (Hành Quân)                               │   │
│  │ • Run full test suite                                   │   │
│  │ • Coverage check                                        │   │
│  │ • All tests must pass (blocking gate)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PHASE 5: SHIP (Cửu Địa)                                 │   │
│  │ • Git commit with conventional message                  │   │
│  │ • Push to repository                                    │   │
│  │ • Deploy to production                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✅ DONE! From idea to production in one flow.                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Brainstorm (Auto)

**Invoke:** `brainstormer` agent

1. Analyze the idea against Binh Pháp principles
2. Identify WIN-WIN-WIN alignment
3. Generate solution approach

**Output:** Strategic analysis with recommended approach

---

## Phase 2: Plan (Approval Required)

**Invoke:** `planner` agent

1. Create `task.md` checklist
2. Create `implementation_plan.md`
3. **WAIT for user approval**

**Gate:** User must explicitly approve before proceeding

---

## Phase 3: Code (VIBE Workflow)

**Invoke:** `/vibe-code` command

1. VIBE Step 0: Detect plan
2. VIBE Step 1: Extract tasks
3. VIBE Step 2: Implement (using agents)
4. VIBE Step 3: Test each component
5. VIBE Step 4: Code review
6. VIBE Step 5: Finalize

**Agents used:** `fullstack-developer`, `ui-ux-designer`, `code-reviewer`

---

## Phase 4: Test (Blocking Gate)

**Invoke:** `tester` agent

```bash
# turbo
PYTHONPATH=. python3 tests/test_wow.py
```

**Gate:** ALL tests must pass. If any fail → fix → re-run

---

## Phase 5: Ship (Production)

**Invoke:** `git-manager` agent

```bash
# Commit
git add -A
git commit -m "🏯 feat: $FEATURE_NAME - WIN-WIN-WIN aligned"

# Push
git push origin main

# Deploy (if configured)
# vercel deploy --prod
```

---

## Quick Examples

```bash
# Full workflow
/agencyos "Build a newsletter SaaS with viral referrals"

# Just brainstorm
/brainstorm "Should we use Next.js or Vite?"

# Just plan
/plan "Create auth system"

# Just code
/vibe-code implementation_plan.md

# Just test
/test

# Just ship
/ship
```

---

## WIN-WIN-WIN Validation

Before each phase, validate alignment:

| Check | Question |
|-------|----------|
| 👑 ANH | Does this grow personal wealth/portfolio? |
| 🏢 AGENCY | Does this build moat/cash flow? |
| 🚀 CLIENT | Does this deliver 10x value? |

**If ANY check fails → STOP and recalibrate**

---

## Python Integration

```bash
# turbo
python3 -c "
from antigravity.core.vibe_workflow import VIBEWorkflow
from antigravity.core.money_maker import MoneyMaker

# Initialize workflow
workflow = VIBEWorkflow()
mm = MoneyMaker()

# Detect current state
plan = workflow.detect_plan()
if plan:
    print(f'📋 Active Plan: {plan}')
    tasks = workflow.analyze_plan()
    print(f'📝 Tasks: {len(tasks)}')
else:
    print('💡 No active plan. Run /plan first.')

# Show Money Suite status
stats = mm.get_stats()
print(f'💰 Pipeline: \${stats[\"total_quoted_value\"]:,.0f}')
"
```

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/brainstorm` | Strategic analysis only |
| `/plan` | Create implementation plan |
| `/vibe-code` | VIBE 6-step coding |
| `/test` | Run test suite |
| `/ship` | Deploy to production |
| `/money-maker` | Revenue operations |
| `/proposal` | Generate client proposals |

---

🏯 **"Không đánh mà thắng"** - Win without fighting

*One flow. All components. From idea to production.*

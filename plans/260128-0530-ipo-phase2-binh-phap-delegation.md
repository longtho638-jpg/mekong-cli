# 🏯 IPO Factory Line Phase 2 - Binh Pháp Delegation Plan

**Created:** 2026-01-28T05:31:00+07:00
**Objective:** Complete remaining 4 IPOs with CC CLI delegation
**Strategy:** Binh Pháp orchestration patterns

---

## 📊 Current Status (From Previous Session)

| IPO            | Chapter               | Status   | Tool Uses | Duration |
| -------------- | --------------------- | -------- | --------- | -------- |
| ✅ **IPO-050** | Ch.6 虛實 (Defense)   | COMPLETE | 270       | 53m 38s  |
| ✅ **IPO-054** | Ch.4 形 (Invincible)  | COMPLETE | 133       | 31m 7s   |
| ✅ **IPO-052** | Ch.13 用間 (Intel)    | COMPLETE | 184       | 46m 9s   |
| ✅ **IPO-051** | Ch.9 行軍 (Logistics) | COMPLETE | -         | -        |

**Previous Session Metrics:**

- Runtime: 4h 6m 25s
- Cost: $438.30
- Files: +2079 -2156
- Chapters Covered: 8/13 (62%)

---

## 🎯 Remaining IPOs (4)

### Priority Order (Binh Pháp Strategic Value)

| Priority | IPO         | Chapter    | Description              | Status      |
| -------- | ----------- | ---------- | ------------------------ | ----------- |
| 1        | **IPO-053** | Ch.3 謀攻  | Analytics & BI Dashboard | ✅ COMPLETE |
| 2        | **IPO-059** | Ch.1 計    | Executive Dashboards     | ✅ COMPLETE |
| 3        | **IPO-057** | Ch.10 地形 | CDN Integration          | ✅ COMPLETE |
| 4        | **IPO-058** | Ch.11 九地 | AI/LLM Integration       | ✅ COMPLETE |

---

## 🤖 CC CLI Delegation Commands

### Step 1: Restart Fresh CC CLI Session

```bash
# Kill existing session (context exhausted at 7%)
pkill -f "claude --dangerously-skip-permissions" || true
sleep 2

# Start fresh with controlled context
cd ~/mekong-cli && source .venv/bin/activate && \
claude --dangerously-skip-permissions \
  --model sonnet \
  --print "Execute IPO Factory Line Phase 2 - Remaining 4 IPOs. Read constitution.md first. Focus on: IPO-053 Analytics (Ch.3), IPO-059 Executive Dashboard (Ch.1), IPO-057 CDN (Ch.10), IPO-058 AI/LLM (Ch.11). Use sequential execution. 100% test coverage required." \
  2>&1 | tee /tmp/ipo-phase2-session2.log
```

### Step 2: Individual IPO Delegation (Fallback)

If full automation fails, delegate individually:

#### IPO-053: Analytics & BI (Ch.3 謀攻)

```bash
claude --dangerously-skip-permissions /cook "IPO-053 Analytics Dashboard:
Implement business intelligence with revenue metrics, user behavior analytics,
conversion funnels. Map to Ch.3 謀攻 (Win Without Fighting through data intelligence).
Deliverables: apps/analytics/ dashboard, backend/services/analytics_service.py,
visualization with recharts. 100% test coverage."
```

#### IPO-059: Executive Dashboards (Ch.1 計)

```bash
claude --dangerously-skip-permissions /cook "IPO-059 Executive Dashboard:
Build C-suite reporting with KPI visualization, strategic insights.
Map to Ch.1 計 (Planning/Strategy).
Deliverables: apps/admin/app/executive/ pages, real-time metrics,
board-ready reports. Charts with recharts."
```

#### IPO-057: CDN Integration (Ch.10 地形)

```bash
claude --dangerously-skip-permissions /cook "IPO-057 CDN Integration:
Cloudflare/Fastly integration, asset optimization, edge caching.
Map to Ch.10 地形 (Terrain Analysis).
Deliverables: terraform/cdn/, backend/services/cdn_service.py,
cache invalidation scripts."
```

#### IPO-058: AI/LLM Integration (Ch.11 九地)

```bash
claude --dangerously-skip-permissions /cook "IPO-058 AI/LLM Integration:
Build LLM API layer, chatbot infrastructure, content generation.
Map to Ch.11 九地 (Adaptation in Crisis).
Deliverables: backend/services/llm_service.py,
apps/admin/app/ai/ pages, prompt management."
```

---

## 📋 Monitoring Protocol

### Realtime Monitoring (Antigravity Supervisor)

```bash
# Monitor CC CLI from Antigravity
command_status --id <command_id> --wait 180 --chars 5000
```

### Progress Checkpoints

| Checkpoint | Condition      | Action                      |
| ---------- | -------------- | --------------------------- |
| **5 min**  | Agent started  | Verify constitution.md read |
| **15 min** | 30+ tool uses  | Check first IPO progress    |
| **30 min** | 60+ tool uses  | Verify test coverage        |
| **45 min** | 100+ tool uses | Check IPO completion        |
| **60 min** | Session active | Evaluate continue/restart   |

### Error Recovery

| Error Code          | Pattern      | Recovery                |
| ------------------- | ------------ | ----------------------- |
| **Exit 139**        | SIGKILL      | Activity Kick (ĐIỀU 39) |
| **Exit 1**          | Command fail | Check command output    |
| **Quota exhausted** | Model limit  | Switch to `sonnet`      |
| **Context 7%**      | Near limit   | Restart fresh session   |

---

## 🏯 Binh Pháp Orchestration Mapping

### Sequential Pattern (Chương 1 - Kế Hoạch)

```yaml
pattern: sequential
flow: IPO-053 → IPO-059 → IPO-057 → IPO-058
principle: "Kế hoạch chu đáo, thắng trước khi đánh"
```

### Checkpoint Gates (WIN-WIN-WIN)

```yaml
gate: win3_validation
before_each_ipo:
    - owner_win: Strategic value delivered?
    - agency_win: Reusable infrastructure created?
    - client_win: Production-ready features?
```

### Quality Standards

```yaml
nuclear_weaponization:
    - 100% test coverage
    - No `: any` types
    - All lints passing
    - Documentation complete
```

---

## 📊 Expected Outcomes

### After Completion

- **Chapters:** 11/13 (85%) - UP from 62%
- **Total IPOs:** 7/8 Phase 2 complete
- **Infrastructure:** Production-ready analytics, executive dashboards, CDN, AI

### Deliverables Per IPO

| IPO     | Frontend                | Backend                | Tests | Docs               |
| ------- | ----------------------- | ---------------------- | ----- | ------------------ |
| **053** | apps/analytics/\*       | services/analytics\_\* | 20+   | analytics-guide.md |
| **059** | apps/admin/executive/\* | services/executive\_\* | 15+   | executive-guide.md |
| **057** | -                       | services/cdn\_\*       | 10+   | cdn-guide.md       |
| **058** | apps/admin/ai/\*        | services/llm\_\*       | 15+   | ai-guide.md        |

---

## 🚀 Execution Commands

### Option A: Full Automation (Recommended)

```bash
# From Antigravity terminal
run_command --cwd ~/mekong-cli \
  --command 'source .venv/bin/activate && claude --dangerously-skip-permissions --model sonnet --print "IPO Factory Line Phase 2 Continuation: Execute remaining 4 IPOs (053, 059, 057, 058). Read .claude/memory/constitution.md FIRST. Sequential execution. 100% test coverage. Nuclear Weaponization standards."' \
  --wait 500
```

### Option B: Manual Step-by-Step

1. Read constitution
2. Execute IPO-053
3. Verify tests pass
4. Execute IPO-059
5. Verify tests pass
6. Execute IPO-057
7. Verify tests pass
8. Execute IPO-058
9. Final verification
10. Git commit and push

---

## ✅ Success Criteria

- [ ] All 4 IPOs completed
- [ ] 100% test coverage maintained
- [ ] All lints passing
- [ ] Documentation created
- [ ] Git committed and pushed
- [ ] 11/13 Binh Pháp chapters covered

---

**Prepared by:** Antigravity Supervisor
**Status:** Ready for Execution
**Model:** claude-sonnet-4-5-thinking (preferred) or gemini-3-pro-high

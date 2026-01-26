---
description: How to apply Sun Tzu's strategic framework to business decisions
---

# 🏯 Binh Pháp Analysis Workflow

Apply the Art of War principles to strategic agency decisions.

## 🤖 Quick Execute

```bash
Execute workflow: https://agencyos.network/docs/workflows/binh-phap-analysis
```

## ⚡ Step-by-Step Execution

### Step 1: Run Ngũ Sự (5 Factors) Analysis (5 min)

// turbo

```bash
# Analyze strategic alignment
mekong strategy:ngu-su --context "new market entry"

# 5 Factors (Ngũ Sự):
# Đạo (Moral alignment) - Team/customer alignment
# Thiên (Heaven) - Market timing
# Địa (Earth) - Competitive terrain
# Tướng (General) - Leadership quality
# Pháp (Method) - Operational discipline
```

### Step 2: Evaluate WIN-WIN-WIN (3 min)

// turbo

```bash
# Check triple-win alignment
mekong strategy:win3 --decision "partnership with X"

# Must answer YES to all:
# 1. Does Anh (Owner) WIN?
# 2. Does Agency WIN?
# 3. Does Client/Partner WIN?
```

### Step 3: Map Competitive Terrain (5 min)

// turbo

```bash
# Analyze 9 types of ground (Cửu Địa)
mekong strategy:cuu-dia --market "vietnam-saas"

# Ground Types:
# 1. Tán địa (Dispersive) - Home territory
# 2. Khinh địa (Light) - Shallow penetration
# 3. Tranh địa (Contentious) - Key positions
# ...9 total types
```

### Step 4: Identify Moats (3 min)

// turbo

```bash
# Analyze competitive advantages
mekong strategy:moats

# Moat Categories:
# - Network effects
# - Switching costs
# - Cost advantages
# - Intangible assets
# - Efficient scale
```

### Step 5: Generate Strategic Recommendations (3 min)

// turbo

```bash
# AI-generate action plan
mekong strategy:recommend

# Output:
# 1. Immediate actions (this week)
# 2. Short-term (this month)
# 3. Long-term (this quarter)
```

## 📋 Binh Pháp Templates

### Ngũ Sự Scorecard

```yaml
ngu_su_analysis:
    dao_moral:
        question: "Are team and customers aligned on mission?"
        score: 1-10
    thien_timing:
        question: "Is market timing favorable?"
        score: 1-10
    dia_terrain:
        question: "Is competitive position strong?"
        score: 1-10
    tuong_leadership:
        question: "Is leadership capable?"
        score: 1-10
    phap_discipline:
        question: "Are processes in place?"
        score: 1-10
```

### WIN-WIN-WIN Gate

```yaml
win3_gate:
    owner_win:
        - Revenue increase?
        - Strategic value?
        - Risk acceptable?
    agency_win:
        - Profitable?
        - Builds capability?
        - Scalable?
    client_win:
        - Solves problem?
        - Fair pricing?
        - Long-term value?
```

### 13 Chapters Application

```yaml
chapters:
    1: Kế Hoạch - Strategic Assessment
    2: Tác Chiến - Resource Management
    3: Mưu Công - Win Without Fighting
    4: Hình Thế - Positioning
    5: Thế Trận - Momentum
    6: Hư Thực - Strengths/Weaknesses
    7: Quân Tranh - Speed Advantage
    8: Cửu Biến - Adaptability
    9: Hành Quân - Operations
    10: Địa Hình - Terrain Analysis
    11: Cửu Địa - 9 Situations
    12: Hỏa Công - Disruption
    13: Dụng Gián - Intelligence
```

## ✅ Success Criteria

- [ ] Ngũ Sự analysis completed
- [ ] WIN-WIN-WIN gate passed
- [ ] Competitive terrain mapped
- [ ] Moats identified
- [ ] Strategic recommendations documented

## 🔗 Next Workflow

After Binh Pháp analysis: `/vc-readiness` or `/pricing-strategy`

## 🤖 Agentic AI Patterns 2025 (TINH HOA)

> **Ánh xạ Binh Pháp → Modern Agent Orchestration**

### ClaudeKit Command Compass 🧭

| ClaudeKit /Command | Binh Pháp Chapter    | Agent Pattern 2025               |
| ------------------ | -------------------- | -------------------------------- |
| `/plan`            | Chương 1: Kế Hoạch   | Task-Oriented Planning           |
| `/delegate`        | Chương 7: Quân Tranh | Multi-Agent Delegation           |
| `/cook`            | Chương 9: Hành Quân  | Autonomous Execution             |
| `/build`           | Chương 5: Thế Trận   | Sequential Build → Test → Deploy |
| `/ship`            | Chương 12: Hỏa Công  | Continuous Deployment            |
| `/test`            | Chương 6: Hư Thực    | Producer-Reviewer Loop           |
| `/recover`         | Chương 8: Cửu Biến   | Self-Healing Agents              |

### Agent Orchestration Patterns

```yaml
orchestration_patterns:
    sequential:
        description: "Agents process in order, output → input"
        binh_phap: "Chương 1 - Kế Hoạch"
        use_case: "/plan → /delegate → /build → /test → /ship"

    concurrent_fanout:
        description: "Multiple agents work in parallel"
        binh_phap: "Chương 7 - Quân Tranh (Speed Advantage)"
        use_case: "Parallel /delegate tasks for independent work"

    intelligent_routing:
        description: "LLM decides which agent dynamically"
        binh_phap: "Chương 8 - Cửu Biến (Adaptability)"
        use_case: "Agent selection based on task keywords"

    producer_reviewer:
        description: "Iterative refinement through reviews"
        binh_phap: "Chương 6 - Hư Thực (Know Weaknesses)"
        use_case: "/test → fix → /test loop"

    hierarchical:
        description: "Main agent delegates to sub-agents"
        binh_phap: "Chương 9 - Hành Quân (Operations)"
        use_case: "Antigravity → CC CLI → Subagents"
```

### Claude Code Best Practices (2025)

1. **Clear Delegation Cues**
    - Use "MUST BE USED" in agent descriptions
    - Link agent to specific file paths or patterns
2. **Single-Responsibility Agents**
    - One clear goal per agent
    - Action-oriented descriptions
3. **Shared Communication Log**
    - `.claude/memory/tasks.md` as central log
    - Each agent records actions, files created, suggestions
4. **Human-in-the-Loop Gates**
    - WIN-WIN-WIN validation at critical points
    - Clear "Definition of Done" per task

### AgencyOS User Application

```bash
# User workflow applying Binh Pháp + ClaudeKit
claude --dangerously-skip-permissions /plan "New feature"    # Kế Hoạch
claude --dangerously-skip-permissions /delegate "Sub-task"   # Quân Tranh
claude --dangerously-skip-permissions /build "Implementation" # Thế Trận
claude --dangerously-skip-permissions /test "Verify"         # Hư Thực
claude --dangerously-skip-permissions /ship                  # Hỏa Công
```

## 🏯 Binh Pháp Alignment

"知彼知己，百戰不殆" (Know the enemy, know yourself, a hundred battles without danger) - Strategy before tactics.

---

**Updated:** 2026-01-25
**Version:** 2.0.0 (Added Agentic AI Patterns 2025)
**Source:** Internet research + ClaudeKit mapping

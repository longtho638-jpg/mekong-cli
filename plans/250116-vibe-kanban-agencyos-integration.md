---
status: pending
priority: P1
date: 2026-01-16
agents:
  - planner
  - fullstack-developer
  - mcp-manager
  - mekong-market-analyst
---

# 🚀 Plan: Tích Hợp Vibe Kanban vào AgencyOS

## 📊 Tóm Tắt Chiến Lược

Tích hợp **Vibe Kanban** (Rust + TypeScript kanban board cho AI agents) thành `/kanban` command trong AgencyOS, cho phép quản lý tác vụ của AI agents và workflow orchestration trực tiếp từ CLI.

**Mục tiêu:**
- Cộng hưởng hệ thống Kanban với Binh Pháp (6 Tướng)
- Tăng visibility 360° cho task execution của agents
- Tích hợp Gemini CLI & Claude Code vào kanban workflow
- 1-person unicorn có thể orchestrate multiple coding agents đồng thời

---

## 🎯 Phạm Vi Tích Hợp

### Giai Đoạn 1: MVP (Tuần 1)
**Lựa chọn: Tạo Wrapper + CLI Integration (Fastest Path)**

Do bạn hạn chế quota code, chiến lược là:
1. **Wrapper nhẹ** (Python + TypeScript CLI binding)
2. **Reuse vibe-kanban CLI** thay vì fork
3. **AgencyOS command bridge** để điều phối

#### 1.1 Nghiên Cứu Vibe Kanban
```
Cần tìm hiểu:
- [ ] Architecture: Rust backend + TypeScript frontend
- [ ] CLI interface (npx vibe-kanban)
- [ ] Configuration (MCP setup, agent configs)
- [ ] API endpoints (nếu có)
- [ ] Database schema (tasks, workflows, states)
```

**Kết quả kỳ vọng:** Document `research/vibe-kanban-analysis.md`

#### 1.2 Thiết Kế Wrapper & Bridge
**Wrapper Role:** Giáp dịch giữa AgencyOS agents và Vibe Kanban
```
mekong-cli/
├── antigravity/
│   └── vibe_kanban_bridge.py          # Wrapper chính
│       ├── models.py                  # Task, Workflow models
│       ├── client.py                  # Vibe Kanban client
│       └── orchestrator.py            # Agent orchestration logic
├── .agencyos/commands/
│   ├── kanban.md                      # /kanban command root
│   ├── kanban/
│   │   ├── board.md                   # /kanban board
│   │   ├── create-task.md             # /kanban create-task
│   │   ├── sync-agents.md             # /kanban sync-agents
│   │   └── report.md                  # /kanban report
└── templates/
    └── kanban-workflow.yaml           # YAML template cho agents
```

#### 1.3 CLI Commands
```
/kanban                      # Mở Kanban board (web UI hoặc CLI viewer)
/kanban create-task <spec>   # Tạo task từ natural language
/kanban sync-agents          # Sync các running agents vào board
/kanban report               # Generate task execution report
/kanban config <agent>       # Configure agent MCP + settings
```

---

### Giai Đoạn 2: Integration (Tuần 2)

#### 2.1 Agents → Kanban Sync
- Planner agent: Auto create tasks từ `/plan` output
- Fullstack Dev agent: Auto update task status during `/cook`
- Jules (automation): Auto-sync từ git commits & CI/CD

#### 2.2 Gemini CLI Integration
```python
# Example workflow
/plan "Build landing page" 
  → Creates kanban board
  → Gemini CLI generates code suggestions
  → Claude Code executes
  → Vibe Kanban tracks progress
```

#### 2.3 Multi-Agent Orchestration
```yaml
# kanban-workflow.yaml template
workflow:
  name: "Feature XYZ"
  agents:
    - planner: lập kế hoạch
    - fullstack-dev: code & test
    - tester: validation
    - docs-manager: documentation
  sync_intervals: 30s
  auto_report: true
```

---

### Giai Đoạn 3: Moat Building (Tuần 3+)

#### 3.1 Data Moat
- Store task execution history
- Agent performance patterns
- Workflow templates library

#### 3.2 Learning Moat
- AI learns optimal task breakdown từ history
- Predicts task complexity & duration
- Suggests agent assignments

#### 3.3 Identity Moat
- Custom kanban styling per agency vibe
- Branded task templates
- Agency-specific workflow presets

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 AgencyOS CLI Layer                      │
│  /plan  /cook  /test  /review  /kanban  /sync-agents   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼────────────┐    ┌─────▼───────────┐
    │ Vibe Kanban     │    │ Gemini CLI      │
    │ Bridge (Python) │    │ Claude Code     │
    │ - Wrapper       │    │ Bridge          │
    │ - Models        │    │                 │
    │ - Orchestrator  │    └─────┬───────────┘
    └────┬────────────┘          │
         │                       │
    ┌────▼───────────────────────▼──────┐
    │  Vibe Kanban (Rust + TypeScript)  │
    │  - Board                          │
    │  - Task Management                │
    │  - MCP Config                     │
    │  - Agent Coordination             │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────┐
    │  PostgreSQL   │
    │  SQLite (dev) │
    └───────────────┘

┌──────────────────────────────────────┐
│      Agent Crew (6 Tướng)           │
├──────────────────────────────────────┤
│ 🏯 Planner        (Mưu Công)       │
│ 💰 Money Maker    (Tài)            │
│ 🧲 Client Magnet  (Địa)            │
│ ⚡ Fullstack Dev   (Quân Tranh)      │
│ ☸️ Strategist      (Đạo)            │
│ 🤖 Jules          (Vô Vi)           │
└──────────────────────────────────────┘
```

---

## 🔧 Tech Stack & Dependencies

### Backend Integration
```
├── Python 3.11+
│   ├── httpx               # HTTP client → Vibe Kanban API
│   ├── pydantic            # Data validation
│   └── asyncio             # Async task management
│
└── TypeScript/Node.js (Optional)
    ├── vibe-kanban         # NPM package
    └── @vibe-cli/core      # CLI bindings
```

### Files Tạo Mới (MVP)
```
antigravity/
├── vibe_kanban_bridge.py (150 lines)
│   ├── VibeBoardClient
│   ├── TaskModel
│   └── AgentOrchestrator
├── vibe_kanban/__init__.py
└── vibe_kanban/models.py (100 lines)

.agencyos/commands/
├── kanban.md
└── kanban/ (4 command files × 50 lines avg)

templates/
└── kanban-workflow.yaml (50 lines)

tests/
└── test_vibe_kanban_bridge.py (150 lines)
```

**Tổng: ~600 lines code (Python-focused, xài VIBE standards)**

---

## 📋 Checklist Thực Hiện

### Phase 1: Research & Design (Days 1-2)

- [ ] Clone vibe-kanban repo
- [ ] Read CLAUDE.md & AGENTS.md của vibe-kanban
- [ ] Analyze architecture (crates/, frontend/, backend ports)
- [ ] Document findings → `research/vibe-kanban-analysis.md`
- [ ] Design wrapper API (Python classes & methods)
- [ ] Design CLI command structure (Frontmatter YAML)
- [ ] Get approval từ strategy team

### Phase 2: MVP Implementation (Days 3-5)

**WITHOUT code (instructions for Gemini CLI):**

1. **VibeBoardClient class**
   - Init: hostname, port, token
   - Methods: `create_task()`, `update_task()`, `list_tasks()`, `get_board()`
   - Error handling + retry logic

2. **TaskModel (Pydantic)**
   - Fields: id, title, description, agent_assigned, status, priority, created_at
   - Validation rules per AgencyOS standards

3. **AgentOrchestrator class**
   - Methods: `assign_task_to_agent()`, `sync_agent_status()`, `generate_report()`
   - Integration với `antigravity.core.agent_chains`

4. **CLI Commands** (4 commands)
   - `/kanban board` → Display board state
   - `/kanban create-task` → Parse user intent → create via VibeBoardClient
   - `/kanban sync-agents` → Fetch running agents → update tasks
   - `/kanban report` → Generate status report

5. **Templates**
   - `kanban-workflow.yaml` → Workflow definition template

### Phase 3: Testing & Documentation (Days 6-7)

- [ ] Unit tests (VibeBoardClient, TaskModel)
- [ ] Integration tests (Commands + Vibe Kanban)
- [ ] CLI manual testing
- [ ] Generate docs:
  - `docs/kanban-integration.md` (user guide)
  - `docs/kanban-api.md` (developer reference)
- [ ] Add to README.md `/kanban` command

---

## 🎬 Execution Instructions (for Gemini CLI)

**You provide these instructions to Gemini CLI `/code` command:**

```
Create vibe-kanban integration for AgencyOS with:

1. Python wrapper: antigravity/vibe_kanban_bridge.py
   - VibeBoardClient: Connect to Vibe Kanban instance
   - TaskModel: Pydantic model for tasks
   - AgentOrchestrator: Assign & sync tasks with agents

2. CLI Commands in .agencyos/commands/kanban/:
   - kanban.md: Root command
   - board.md: Display kanban board
   - create-task.md: Create task from natural language
   - sync-agents.md: Sync running agents to board
   - report.md: Generate execution report

3. Templates:
   - templates/kanban-workflow.yaml: Workflow definition

4. Tests:
   - tests/test_vibe_kanban_bridge.py: Unit + integration tests

Requirements:
- Follow VIBE standards (YAGNI/KISS/DRY, 200-line files)
- Use type hints (Python 3.11+)
- Error handling + logging
- No external APIs (local Vibe Kanban instance)
- Compatible với Python 3.11+ (antigravity environment)
```

---

## 🏆 Success Criteria (WIN-WIN-WIN)

### 👑 Owner WIN
- 1-person agency có full visibility qua `/kanban`
- Orchestrate 6 AI agents từ single CLI
- Auto-track ROI per task execution

### 🏢 Agency WIN
- Kanban board tạo "Workflow Moat"
- Reusable workflow templates
- Historical data → Learning Moat

### 🚀 Client WIN
- Transparent task tracking (opinionated UI)
- Faster delivery (parallel agent execution)
- Better estimates (from historical data)

---

## ⚠️ Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Vibe Kanban API changes | Breaking changes | Pin version, monitor releases |
| DB sync delays | Stale task data | Implement refresh mechanism |
| Multi-agent conflicts | Race conditions | Queue system + locks |
| High quota usage (Gemini) | Cost overruns | Cache templates, reuse prompts |

---

## 📚 Related Commands & Resources

- `/cook` → Implement tasks (created by Kanban)
- `/plan` → Strategy → Auto-create kanban board
- `/test` → Validate task completion
- `/antigravity` → Master dashboard (includes Kanban view)

---

## 🎯 Next Steps

1. **Share this plan** để review
2. **Gemini CLI /code** → Generate code based on instructions
3. **Manual review** của integration points
4. **Deploy MVP** → Test với real workflow
5. **Iterate** dựa trên agency feedback

---

*Generated by Planner Agent | Agency OS v2.5*
*Binh Pháp: 計篇 (Kế) - Strategic Planning*

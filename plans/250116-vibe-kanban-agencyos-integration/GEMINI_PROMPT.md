# 🎯 Gemini CLI /code Prompt - Vibe Kanban Integration MVP

## Copy & Paste vào Gemini CLI

```
/code "Implement Vibe Kanban integration for AgencyOS MVP

SCOPE:
Create Python wrapper + 4 CLI commands to manage AI agents via Kanban board.

FILES TO CREATE:

1. antigravity/vibe_kanban_bridge.py (150 lines max)
   - VibeBoardClient: HTTP client class
     * __init__(hostname, port, auth_token)
     * async create_task(title, description, assigned_agent, priority)
     * async update_task(task_id, status, notes)
     * async list_tasks(filter_status)
     * async get_board_state()
   - TaskModel: Pydantic model
     * id: str
     * title: str
     * description: str
     * agent_assigned: str (agent name from 6 Tướng)
     * status: 'todo'|'in_progress'|'review'|'done'
     * priority: 'P1'|'P2'|'P3'
     * created_at: datetime
     * updated_at: datetime
   - AgentOrchestrator: Task coordination
     * assign_task_to_agent(task_id, agent_name)
     * sync_agent_status(agent_name)
     * get_agent_workload()

2. antigravity/vibe_kanban/__init__.py
   - Export: VibeBoardClient, TaskModel, AgentOrchestrator

3. .agencyos/commands/kanban.md
   - Root command description

4. .agencyos/commands/kanban/board.md
   - /kanban board: Display tasks
   - Uses: VibeBoardClient.list_tasks()

5. .agencyos/commands/kanban/create-task.md
   - /kanban create-task <title> --agent <name> --priority <P1|P2|P3>
   - Uses: VibeBoardClient.create_task()

6. .agencyos/commands/kanban/sync-agents.md
   - /kanban sync-agents: Update task status from running agents
   - Uses: AgentOrchestrator.sync_agent_status()

7. .agencyos/commands/kanban/report.md
   - /kanban report: Generate execution report
   - Output: Markdown table with task status

8. templates/kanban-workflow.yaml (50 lines)
   - Example workflow YAML with agents, tasks, sync_interval

9. tests/test_vibe_kanban_bridge.py (100 lines)
   - Test VibeBoardClient (mock HTTP)
   - Test TaskModel validation
   - Test AgentOrchestrator logic

REQUIREMENTS:
- VIBE standards: YAGNI/KISS/DRY, max 150-200 lines per file
- Type hints: Python 3.11+
- Use pydantic for models
- Use httpx for async HTTP
- Error handling + logging (use antigravity.core.logger)
- Support 6 agents: planner, money-maker, client-magnet, fullstack-dev, strategist, jules
- Integrate with antigravity.core.agent_chains
- CLI commands use Frontmatter YAML (description, argument-hint)
- No external APIs except Vibe Kanban instance (localhost:3000 default)
- Add docstrings + Vietnamese comments

AGENT NAMES (from Binh Pháp):
- planner (Mưu Công)
- money-maker (Tài)
- client-magnet (Địa)
- fullstack-dev (Quân Tranh)
- strategist (Đạo)
- jules (Vô Vi)

DEPENDENCIES (already available):
- httpx
- pydantic
- antigravity package
- typer (for CLI)

FOLDER STRUCTURE:
mekong-cli/
├── antigravity/vibe_kanban_bridge.py
├── antigravity/vibe_kanban/__init__.py
├── .agencyos/commands/kanban.md
├── .agencyos/commands/kanban/board.md
├── .agencyos/commands/kanban/create-task.md
├── .agencyos/commands/kanban/sync-agents.md
├── .agencyos/commands/kanban/report.md
├── templates/kanban-workflow.yaml
└── tests/test_vibe_kanban_bridge.py

OUTPUT: Ready-to-use code that integrates with existing AgencyOS infrastructure.
Target: 100% pass on pytest + working CLI commands."
```

---

## Alternative: Nếu Gemini CLI không hỗ trợ long prompts

**Chia thành 2 batches:**

### Batch 1 (Backend):
```
/code "Implement Vibe Kanban Python bridge for AgencyOS:

Create antigravity/vibe_kanban_bridge.py (150 lines):
- VibeBoardClient: async HTTP client (create_task, update_task, list_tasks, get_board_state)
- TaskModel: Pydantic with fields (id, title, description, agent_assigned, status, priority, created_at)
- AgentOrchestrator: assign_task_to_agent, sync_agent_status, get_agent_workload

Support agents: planner, money-maker, client-magnet, fullstack-dev, strategist, jules
Status values: todo, in_progress, review, done
Priority: P1, P2, P3
Error handling + logging.

Create antigravity/vibe_kanban/__init__.py with exports.
Create tests/test_vibe_kanban_bridge.py (100 lines, mock-based).

VIBE standards: YAGNI/KISS/DRY, type hints, docstrings."
```

### Batch 2 (CLI Commands):
```
/code "Create AgencyOS Kanban CLI commands:

.agencyos/commands/kanban.md - root command
.agencyos/commands/kanban/board.md - display tasks (list_tasks)
.agencyos/commands/kanban/create-task.md - create task with agent + priority
.agencyos/commands/kanban/sync-agents.md - sync agent status
.agencyos/commands/kanban/report.md - markdown report table

Each command: Frontmatter YAML + agent description + implementation.
Use VibeBoardClient from antigravity.vibe_kanban_bridge.

Also create:
- templates/kanban-workflow.yaml (example workflow with agents list)

Format: Follow .agencyos/commands/estimate.md structure."
```

---

## Flags Tương Tác (nếu Gemini hỏi)

Nếu Gemini CLI hỏi chi tiết, trả lời:

| Question | Answer |
|----------|--------|
| **Vibe Kanban URL?** | Default: `http://localhost:3000` (configurable) |
| **Database?** | PostgreSQL (production) / SQLite dev |
| **Auth token?** | From `.env` `VIBE_KANBAN_TOKEN` |
| **Existing codebase patterns?** | Xem `antigravity/core/` & `.agencyos/agents/` |
| **Test framework?** | pytest |
| **Async or sync?** | Async (httpx) |

---

**Ready to ship?** ✅

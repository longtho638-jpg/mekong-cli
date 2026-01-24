---
description: Unified Kanban and Vibe Workflow Management
---

# 📊 Kanban Workflow

> **Binh Pháp:** "Tri bỉ tri kỷ" - Know tasks, know priorities

## ⚙️ Core Engine
- **Implementation**: `antigravity/core/vibe_workflow.py`
- **Data Store**: `antigravity/core/kanban/` (JSON store)
- **Sync Engine**: `antigravity/core/sync_engine.py` (assumed)

## 🚀 Trigger Commands

- `mekong kanban` - Show board
- `mekong kanban add "Task"` - Add task
- `mekong kanban move <id> <status>` - Move task
- `mekong plan` - Generate tasks from high-level goal

## 🔄 Workflow Steps

### 1. 📥 Ingestion & Planning
The `VibeWorkflow` engine decomposes goals into tasks.

```python
# antigravity/core/vibe_workflow.py
def decompose_goal(goal_description):
    # 1. Analyze goal with Planner agent
    # 2. Break down into Epics/Stories/Tasks
    # 3. Create JSON entries in .mekong/kanban.json
```

### 2. 📋 Board Management
Manages task states: `todo` → `in_progress` → `review` → `done`.

**State Protocol:**
- **Agents MUST** update state immediately upon starting/finishing.
- **Single Source of Truth**: `.mekong/kanban.json` (or CLEO integration).

### 3. 🤖 Agent Coordination
Agents interact with the board via the `manage_kanban` tool.

1. **Pick**: Agent queries `todo` tasks.
2. **Claim**: Agent updates task `agent_id` to itself.
3. **Execute**: Agent performs work.
4. **Complete**: Agent moves task to `done`.

### 4. 🔄 Synchronization
Syncs local state with external tools (GitHub Issues, Linear, Vibe Kanban).

```bash
# Auto-sync on change
mekong kanban sync --target vibe-kanban
```

## 🛠 Configuration

```json
{
  "kanban": {
    "storage": "local",
    "sync_target": "none",
    "columns": ["todo", "in_progress", "review", "done"],
    "auto_archive_days": 7
  }
}
```

## 🔗 Related Components
- `antigravity/core/kanban/` - Storage logic
- `cli/commands/kanban.py` - CLI entry point
- `cleo` - CLI Task Manager (primary backend if enabled)

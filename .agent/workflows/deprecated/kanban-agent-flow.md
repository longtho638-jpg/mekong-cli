# Kanban Agent Workflow
# =====================

This document defines how Claude/AgencyOS agents interact with the Kanban board.

## 1. The Golden Rule (Đạo)
**Agents must never hold state in memory.**
All tasks, progress, and blockers must be reflected on the Kanban board immediately.

## 2. Standard Operation Procedure (SOP)

### A. Picking a Task
1.  **List**: Call `kanban.py list {"status": "todo"}`.
2.  **Filter**: Find tasks assigned to `self.agent_name` or `unassigned`.
3.  **Claim**: Call `kanban.py update {"id": "TASK-XXX", "status": "in_progress", "agent": "self.agent_name"}`.

### B. Executing
1.  Perform the work (Code, Write, Research).
2.  **Log**: Append notes to the task if blocked or partially complete.

### C. Completion
1.  **Review**: If the task requires approval, move to `review`.
2.  **Done**: Call `kanban.py update {"id": "TASK-XXX", "status": "done"}`.

## 3. Tool Definition (for System Prompt)

```json
{
  "name": "manage_kanban",
  "description": "Interact with the project Kanban board to track tasks.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create", "update", "list"]
      },
      "params": {
        "type": "object",
        "description": "Parameters for the action (title, id, status, etc.)"
      }
    },
    "required": ["action", "params"]
  }
}
```

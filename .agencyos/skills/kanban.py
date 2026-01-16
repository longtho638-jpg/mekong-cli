"""
AgencyOS Skill: Manage Kanban
=============================

Allows AI agents to autonomously interact with the Vibe Kanban board.
Implements the "Agent Skill" pattern.
"""

import sys
import json
import asyncio
from typing import Dict, Any, Optional

# Add project root to path
sys.path.insert(0, ".")

from antigravity.vibe_kanban_bridge import VibeBoardClient, TaskModel

class KanbanSkill:
    """
    Skill for managing tasks on the Kanban board.
    """
    def __init__(self):
        self.client = VibeBoardClient()

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a Kanban action.
        
        Args:
            action: 'create', 'update', 'list', 'get'
            params: Parameters for the action
        """
        try:
            if action == "create":
                task = await self.client.create_task(
                    title=params.get("title", "Untitled"),
                    description=params.get("description", ""),
                    assigned_agent=params.get("agent", "unassigned"),
                    priority=params.get("priority", "P2")
                )
                return {"status": "success", "data": task.model_dump() if task else None}

            elif action == "update":
                task_id = params.get("id")
                if not task_id:
                    return {"status": "error", "message": "Missing task ID"}
                
                success = await self.client.update_task(
                    task_id=task_id,
                    status=params.get("status"),
                    notes=params.get("notes")
                )
                return {"status": "success", "updated": success}

            elif action == "list":
                tasks = await self.client.list_tasks(filter_status=params.get("status"))
                return {"status": "success", "count": len(tasks), "tasks": [t.model_dump() for t in tasks]}

            else:
                return {"status": "error", "message": f"Unknown action: {action}"}

        except Exception as e:
            return {"status": "error", "message": str(e)}

# Wrapper for direct execution (e.g., by Tool Use)
def run_skill(action: str, params_json: str):
    """Entry point for CLI/Tool calls."""
    skill = KanbanSkill()
    params = json.loads(params_json)
    return asyncio.run(skill.execute(action, params))

if __name__ == "__main__":
    # Example: python .agencyos/skills/kanban.py create '{"title": "Test"}'
    if len(sys.argv) > 2:
        action = sys.argv[1]
        params = sys.argv[2]
        print(json.dumps(run_skill(action, params), indent=2))
    else:
        print("Usage: kanban.py <action> <json_params>")

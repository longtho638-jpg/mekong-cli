"""
VIBE IDE Core - Developer Experience Module

Core IDE functionality for plan management, task tracking,
and developer productivity.

🏯 "Dễ như ăn kẹo" - Easy as candy
"""

from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

from .models.ide import Plan, TodoItem
from .base import BaseEngine


class VIBEIDE(BaseEngine):
    """
    VIBE IDE Core - Developer Experience Engine.
    
    Features:
    - Plan management
    - Task extraction
    - Progress tracking
    - Todo system integration
    """

    def __init__(self, workspace: str = "."):
        super().__init__()
        self.workspace = Path(workspace)
        self.plans_dir = self.workspace / "plans"
        self.active_plan: Optional[Plan] = None
        self.todos: List[TodoItem] = []

    def create_plan(
        self,
        title: str,
        description: str,
        priority: str = "P2",
        effort: str = "4h",
        tags: List[str] = None
    ) -> Path:
        """Create a new implementation plan."""
        date_str = datetime.now().strftime("%y%m%d-%H%M")
        slug = title.lower().replace(" ", "-")[:30]
        plan_name = f"{date_str}-{slug}"

        plan_dir = self.plans_dir / plan_name
        plan_dir.mkdir(parents=True, exist_ok=True)

        plan = Plan(
            title=title, description=description,
            priority=priority, effort=effort, tags=tags or []
        )

        plan_file = plan_dir / "plan.md"
        content = f"""{plan.to_frontmatter()}

# {title}

{description}

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

*Created by VIBE IDE on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        plan_file.write_text(content, encoding="utf-8")
        (plan_dir / "research").mkdir(exist_ok=True)
        (plan_dir / "reports").mkdir(exist_ok=True)

        self.active_plan = plan
        return plan_file

    def list_plans(self) -> List[Dict]:
        """List all plans in workspace."""
        if not self.plans_dir.exists():
            return []

        plans = []
        for plan_file in self.plans_dir.glob("*/plan.md"):
            content = plan_file.read_text(encoding="utf-8")
            title = plan_file.parent.name
            for line in content.split("\n"):
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"')
                    break
            plans.append({
                "path": str(plan_file),
                "name": plan_file.parent.name,
                "title": title,
                "modified": datetime.fromtimestamp(plan_file.stat().st_mtime)
            })
        return sorted(plans, key=lambda p: p["modified"], reverse=True)

    def get_active_plan(self) -> Optional[Path]:
        """Get the currently active plan."""
        active_file = self.workspace / ".vibe" / "active-plan"
        if active_file.exists():
            plan_path = Path(active_file.read_text().strip())
            if plan_path.exists():
                return plan_path
        return None

    def set_active_plan(self, plan_path: str) -> bool:
        """Set the active plan."""
        path = Path(plan_path)
        if not path.exists():
            return False
        vibe_dir = self.workspace / ".vibe"
        vibe_dir.mkdir(exist_ok=True)
        (vibe_dir / "active-plan").write_text(str(path))
        return True

    # Todo System
    def add_todo(self, text: str) -> TodoItem:
        """Add a new todo item."""
        todo = TodoItem(id=f"todo-{len(self.todos) + 1}", text=text)
        self.todos.append(todo)
        return todo

    def complete_todo(self, todo_id: str) -> bool:
        """Mark a todo as completed."""
        for todo in self.todos:
            if todo.id == todo_id:
                todo.complete()
                return True
        return False

    def get_todos(self, completed: Optional[bool] = None) -> List[TodoItem]:
        """Get todos, optionally filtered."""
        if completed is None:
            return self.todos
        return [t for t in self.todos if t.completed == completed]

    def get_stats(self) -> Dict:
        """Get IDE statistics."""
        plans = self.list_plans()
        return {
            "total_plans": len(plans),
            "pending_todos": len(self.get_todos(completed=False)),
            "completed_todos": len(self.get_todos(completed=True)),
        }

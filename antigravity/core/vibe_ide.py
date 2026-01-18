"""
🛠️ VIBE IDE Core - Developer Experience Module
==============================================

The primary interface for managing development state within the Agency OS.
Handles the lifecycle of implementation plans, task tracking, and
workspace organization for both human and AI developers.

Features:
- Strategic Planning: Frontmatter-enabled Markdown plans.
- Task Extraction: Identifying executable units from documents.
- Workspace State: Persistent active plan tracking.
- Todo Management: Lightweight productivity tracker.

Binh Pháp: 🛠️ Khí (Tools) - Sharpening the weapons before battle.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .base import BaseEngine
from .models.ide import Plan, TodoItem

# Configure logging
logger = logging.getLogger(__name__)


class VIBEIDE(BaseEngine):
    """
    🛠️ VIBE Developer Experience Engine

    Manages the 'workbench' of the Agency OS.
    Synchronizes strategic intent (plans) with tactical execution (todos).
    """

    def __init__(self, workspace: Union[str, Path] = "."):
        super().__init__()
        self.workspace = Path(workspace)
        self.plans_dir = self.workspace / "plans"
        self.plans_dir.mkdir(exist_ok=True)

        self.vibe_state_dir = self.workspace / ".antigravity" / "vibe"
        self.vibe_state_dir.mkdir(parents=True, exist_ok=True)

        self.active_plan: Optional[Plan] = None
        self.todos: List[TodoItem] = []

    def create_plan(
        self,
        title: str,
        description: str,
        priority: str = "P2",
        effort: str = "4h",
        tags: Optional[List[str]] = None,
    ) -> Path:
        """
        Initializes a new implementation plan folder and Markdown file.
        Automatically scaffolds research and reports subdirectories.
        """
        # Naming convention: YYMMDD-HHMM-slug
        ts = datetime.now().strftime("%y%m%d-%H%M")
        slug = "".join(c for c in title.lower() if c.isalnum() or c == " ").replace(" ", "-")[:30]
        folder_name = f"{ts}-{slug}"

        plan_dir = self.plans_dir / folder_name
        plan_dir.mkdir(parents=True, exist_ok=True)

        plan = Plan(
            title=title, description=description, priority=priority, effort=effort, tags=tags or []
        )

        plan_file = plan_dir / "plan.md"
        content = [
            plan.to_frontmatter(),
            f"\n# 📜 {title}\n",
            f"> {description}\n",
            "\n## 📋 Execution Tasks\n",
            "- [ ] Phase 1: Research and mapping",
            "- [ ] Phase 2: Core implementation",
            "- [ ] Phase 3: Verification and testing",
            "\n## 🔍 Research Notes\n",
            "<!-- Store initial research findings here -->\n",
            f"\n---\n*Created by VIBE IDE on {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
        ]
        plan_file.write_text("\n".join(content), encoding="utf-8")

        # Scaffold workspace
        (plan_dir / "research").mkdir(exist_ok=True)
        (plan_dir / "reports").mkdir(exist_ok=True)

        self.active_plan = plan
        self.set_active_plan(plan_file)

        logger.info(f"New development plan created: {folder_name}")
        return plan_file

    def list_plans(self) -> List[Dict[str, Any]]:
        """Scans the workspace for all available plan documents."""
        if not self.plans_dir.exists():
            return []

        found_plans = []
        for plan_file in self.plans_dir.glob("**/plan.md"):
            try:
                # Basic metadata extraction
                stat = plan_file.stat()
                found_plans.append(
                    {
                        "id": plan_file.parent.name,
                        "title": self._extract_title(plan_file),
                        "path": str(plan_file),
                        "modified": datetime.fromtimestamp(stat.st_mtime),
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to index plan {plan_file}: {e}")

        return sorted(found_plans, key=lambda p: p["modified"], reverse=True)

    def _extract_title(self, path: Path) -> str:
        """Helper to find the title in Markdown frontmatter or header."""
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
            for line in lines:
                if line.startswith("title:"):
                    return line.split(":", 1)[1].strip().strip('"')
                if line.startswith("# "):
                    return line.replace("# ", "").strip()
        except Exception:
            pass
        return path.parent.name

    def get_active_plan_path(self) -> Optional[Path]:
        """Retrieves the path of the currently pinned plan."""
        state_file = self.vibe_state_dir / "active_plan.ptr"
        if state_file.exists():
            ptr = state_file.read_text().strip()
            path = Path(ptr)
            if path.exists():
                return path
        return None

    def set_active_plan(self, plan_path: Union[str, Path]) -> bool:
        """Pins a specific plan as the active context for the workspace."""
        path = Path(plan_path)
        if not path.exists():
            logger.error(f"Cannot activate non-existent plan: {plan_path}")
            return False

        state_file = self.vibe_state_dir / "active_plan.ptr"
        state_file.write_text(str(path.absolute()), encoding="utf-8")
        return True

    # --- Lightweight Task Management ---

    def add_todo(self, text: str, category: str = "general") -> TodoItem:
        """Appends a tactical task to the global todo list."""
        todo = TodoItem(id=f"todo_{int(datetime.now().timestamp())}_{len(self.todos)}", text=text)
        self.todos.append(todo)
        return todo

    def complete_todo(self, todo_id: str) -> bool:
        """Marks a tactical task as resolved."""
        for t in self.todos:
            if t.id == todo_id:
                t.complete()
                logger.debug(f"Todo resolved: {todo_id}")
                return True
        return False

    def get_stats(self) -> Dict[str, Any]:
        """Telemetry for the IDE engine."""
        return {
            "workspace": {
                "plans_total": len(self.list_plans()),
                "has_active_plan": self.get_active_plan_path() is not None,
            },
            "tasks": {
                "pending": len([t for t in self.todos if not t.completed]),
                "completed": len([t for t in self.todos if t.completed]),
            },
        }

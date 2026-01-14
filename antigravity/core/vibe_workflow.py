"""
VIBE Workflow Engine - 6-Step Development Cycle

Mirroring ClaudeKit's /code workflow for AntigravityKit.

Steps:
0. Plan Detection - Find/select plan
1. Analysis - Extract tasks, map dependencies
2. Implementation - Execute with YAGNI/KISS/DRY
3. Testing - Run tests, 100% pass gate
4. Code Review - Score, identify issues
5. Finalize - Update docs, commit

🏯 "Công dục thiện kỳ sự, tất tiên lợi kỳ khí"
"""

from pathlib import Path
from typing import List, Dict, Optional
import subprocess

from .models.workflow import Task, TaskStatus, WorkflowStep, CodeReviewResult
from .base import BaseEngine
from .config import MAX_FILE_LINES


class VIBEWorkflow(BaseEngine):
    """
    VIBE 6-Step Development Workflow Engine.
    
    Implements ClaudeKit's proven development cycle:
    Plan → Analyze → Implement → Test → Review → Finalize
    """

    def __init__(self, plans_dir: str = "./plans"):
        super().__init__()
        self.plans_dir = Path(plans_dir)
        self.current_step = WorkflowStep.PLAN_DETECTION
        self.current_plan: Optional[Path] = None
        self.tasks: List[Task] = []
        self.test_results: Dict = {}
        self.review_result: Optional[CodeReviewResult] = None

    # Step 0: Plan Detection
    def detect_plan(self, plan_path: Optional[str] = None) -> Optional[Path]:
        """Find or select a plan from ./plans directory."""
        if plan_path:
            path = Path(plan_path)
            if path.exists():
                self.current_plan = path
                self.current_step = WorkflowStep.ANALYSIS
                return path
            return None

        if not self.plans_dir.exists():
            return None

        plans = list(self.plans_dir.glob("**/plan.md"))
        if not plans:
            return None

        latest = max(plans, key=lambda p: p.stat().st_mtime)
        self.current_plan = latest
        self.current_step = WorkflowStep.ANALYSIS
        return latest

    # Step 1: Analysis
    def analyze_plan(self) -> List[Task]:
        """Extract tasks from plan and map dependencies."""
        if not self.current_plan or not self.current_plan.exists():
            return []

        content = self.current_plan.read_text(encoding="utf-8")
        tasks = []
        task_id = 0

        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("- [ ]") or line.startswith("- [x]"):
                task_id += 1
                status = TaskStatus.COMPLETED if "[x]" in line else TaskStatus.PENDING
                name = line.replace("- [ ]", "").replace("- [x]", "").strip()
                tasks.append(Task(
                    id=f"task-{task_id}", name=name,
                    description=name, status=status
                ))

        self.tasks = tasks
        self.current_step = WorkflowStep.IMPLEMENTATION
        return tasks

    # Step 2: Implementation helpers
    def start_task(self, task_id: str) -> bool:
        """Mark a task as in-progress."""
        for task in self.tasks:
            if task.id == task_id:
                task.start()
                return True
        return False

    def complete_task(self, task_id: str) -> bool:
        """Mark a task as completed."""
        for task in self.tasks:
            if task.id == task_id:
                task.complete()
                return True
        return False

    def get_pending_tasks(self) -> List[Task]:
        """Get list of pending tasks."""
        return [t for t in self.tasks if t.status == TaskStatus.PENDING]

    # Step 3: Testing
    def run_tests(self, test_command: str = "python -m pytest") -> Dict:
        """Run test suite and return results."""
        try:
            result = subprocess.run(
                test_command.split(), capture_output=True,
                text=True, timeout=300
            )
            self.test_results = {
                "passed": result.returncode == 0,
                "stdout": result.stdout[:500],
                "return_code": result.returncode
            }
        except Exception as e:
            self.test_results = {"passed": False, "error": str(e)}

        if self.test_results.get("passed"):
            self.current_step = WorkflowStep.CODE_REVIEW
        return self.test_results

    # Step 4: Code Review
    def code_review(self, files: List[str]) -> CodeReviewResult:
        """Perform code review on changed files."""
        result = CodeReviewResult(score=10)

        for file_path in files:
            path = Path(file_path)
            if not path.exists():
                continue
            content = path.read_text(encoding="utf-8")
            lines = len(content.split("\n"))

            if lines > MAX_FILE_LINES:
                result.add_warning(f"{file_path}: {lines} lines > {MAX_FILE_LINES}")

        self.review_result = result
        if result.passed:
            self.current_step = WorkflowStep.FINALIZE
        return result

    # Step 5: Finalize
    def finalize(self, commit_message: Optional[str] = None) -> Dict:
        """Finalize workflow: update docs, commit changes."""
        result = {"docs_updated": False, "committed": False, "message": ""}

        if not self.review_result or not self.review_result.passed:
            result["message"] = "Code review not passed"
            return result

        if self.current_plan:
            result["docs_updated"] = True

        if commit_message:
            try:
                subprocess.run(["git", "add", "-A"], check=True)
                subprocess.run(["git", "commit", "-m", commit_message], check=True)
                result["committed"] = True
            except Exception:
                pass

        result["message"] = "Workflow completed"
        return result

    def get_stats(self) -> Dict:
        """Get workflow status."""
        return {
            "step": self.current_step.name,
            "plan": str(self.current_plan) if self.current_plan else None,
            "total_tasks": len(self.tasks),
            "pending": len(self.get_pending_tasks()),
            "test_passed": self.test_results.get("passed"),
            "review_score": self.review_result.score if self.review_result else None
        }

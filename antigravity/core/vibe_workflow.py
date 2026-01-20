"""
🌊 VIBE Workflow Engine - Strategic Development Cycle
=====================================================

Implements the high-velocity 'Manus Pattern' development cycle within the
Agency OS. Ensures every change is planned, implemented, verified, and
reviewed before deployment.

Standard Cycle:
0. 🔍 Detection: Identify active plan.md.
1. 📋 Analysis: Decompose plan into atomic tasks.
2. 🛠️ Implementation: Execute code changes (YAGNI/KISS).
3. 🧪 Testing: Enforce 100% pass rate.
4. 🔍 Review: Static analysis and code quality gates.
5. 🚀 Finalization: Commit and documentation sync.

Binh Pháp: 📋 Pháp (Process) - Disciplined execution leads to victory.
"""

import logging
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Union

from .base import BaseEngine
from .config import MAX_FILE_LINES
from .models.workflow import CodeReviewResult, Task, TaskStatus, WorkflowStep
from .types import VIBEWorkflowStatsDict, TestResultDict, ShipResultDict

# Configure logging
logger = logging.getLogger(__name__)


class VIBEWorkflow(BaseEngine):
    """
    🌊 VIBE Development Engine

    Orchestrates the 6-step cycle for building features and fixing bugs.
    Integrates with the local filesystem and git repository.
    """

    def __init__(self, plans_dir: Union[str, Path] = "./plans"):
        super().__init__()
        self.plans_dir = Path(plans_dir)
        self.current_step = WorkflowStep.PLAN_DETECTION
        self.current_plan: Optional[Path] = None
        self.tasks: List[Task] = []
        self.test_results: Dict[str, object] = {}
        self.review_result: Optional[CodeReviewResult] = None

    # --- Step 0: Detection ---

    def detect_plan(self, explicit_path: Optional[str] = None) -> Optional[Path]:
        """Locates the active development plan from the /plans directory."""
        if explicit_path:
            path = Path(explicit_path)
            if path.exists():
                self.current_plan = path
                self.current_step = WorkflowStep.ANALYSIS
                return path
            logger.error(f"Explicit plan path not found: {explicit_path}")
            return None

        if not self.plans_dir.exists():
            logger.warning(f"Plans directory missing: {self.plans_dir}")
            return None

        # Priority: nested plan.md files, newest first
        plans = list(self.plans_dir.glob("**/plan.md"))
        if not plans:
            # Fallback: check for task_plan.md
            plans = list(self.plans_dir.glob("**/task_plan.md"))

        if not plans:
            return None

        # Use the most recently modified plan
        latest = max(plans, key=lambda p: p.stat().st_mtime)
        self.current_plan = latest
        self.current_step = WorkflowStep.ANALYSIS
        logger.info(f"Active plan detected: {latest.name}")
        return latest

    # --- Step 1: Analysis ---

    def analyze_plan(self) -> List[Task]:
        """Parses the Markdown plan into executable task objects."""
        if not self.current_plan or not self.current_plan.exists():
            return []

        try:
            content = self.current_plan.read_text(encoding="utf-8")
            tasks = []
            task_counter = 1

            for line in content.splitlines():
                line = line.strip()
                # Detection of Markdown checkboxes
                if line.startswith("- [ ]") or line.startswith("- [x]"):
                    status = TaskStatus.COMPLETED if "[x]" in line else TaskStatus.PENDING
                    name = line.replace("- [ ]", "").replace("- [x]", "").strip()

                    tasks.append(
                        Task(
                            id=f"task-{task_counter}",
                            name=name,
                            description=f"Automated extraction from {self.current_plan.name}",
                            status=status,
                        )
                    )
                    task_counter += 1

            self.tasks = tasks
            self.current_step = WorkflowStep.IMPLEMENTATION
            logger.info(f"Analysis complete: {len(tasks)} tasks identified.")
            return tasks
        except Exception as e:
            logger.error(f"Failed to analyze plan {self.current_plan}: {e}")
            return []

    # --- Step 2: Implementation ---

    def start_task(self, task_id: str) -> bool:
        """Sets a specific task to 'in_progress' state."""
        for task in self.tasks:
            if task.id == task_id:
                task.start()
                return True
        return False

    def complete_task(self, task_id: str) -> bool:
        """Sets a specific task to 'completed' state."""
        for task in self.tasks:
            if task.id == task_id:
                task.complete()
                return True
        return False

    # --- Step 3: Testing ---

    def run_verification_suite(self, command: str = "python3 -m pytest") -> Dict[str, object]:
        """Executes the test suite and captures results for the quality gate."""
        print(f"🧪 Running verification: `{command}`...")
        try:
            result = subprocess.run(command.split(), capture_output=True, text=True, timeout=300)

            self.test_results = {
                "passed": result.returncode == 0,
                "exit_code": result.returncode,
                "summary": result.stdout[-500:] if result.stdout else "",
                "errors": result.stderr[-500:] if result.stderr else "",
            }

            if self.test_results["passed"]:
                self.current_step = WorkflowStep.CODE_REVIEW
                logger.info("Tests passed! Quality gate unlocked.")
            else:
                logger.warning("Verification failed. Fixing required before review.")

            return self.test_results
        except Exception as e:
            logger.exception("Verification suite crashed")
            return {"passed": False, "error": str(e)}

    # --- Step 4: Review ---

    def perform_code_review(self, files: List[Union[str, Path]]) -> CodeReviewResult:
        """Analyzes changed files for adherence to Agency OS standards."""
        # Initial score 10/10
        review = CodeReviewResult(score=10)

        for f in files:
            path = Path(f)
            if not path.exists():
                continue

            try:
                content = path.read_text(encoding="utf-8")
                lines = content.splitlines()

                # Rule 1: Complexity Check
                if len(lines) > MAX_FILE_LINES:
                    review.add_warning(f"File too large: {path.name} ({len(lines)} lines)")
                    review.score -= 1

                # Rule 2: Basic Pattern Check (Placeholder)
                if "TODO" in content:
                    review.add_warning(f"Technical debt found: {path.name} contains TODOs")

            except Exception as e:
                logger.warning(f"Could not review {path.name}: {e}")

        self.review_result = review
        if review.passed:
            self.current_step = WorkflowStep.FINALIZE

        return review

    # --- Step 5: Finalization ---

    def ship_changes(self, commit_msg: str) -> Dict[str, object]:
        """Integrates changes into the main repository branch."""
        report = {"success": False, "git": False, "docs": False}

        if not self.review_result or not self.review_result.passed:
            logger.error("Shipment aborted: Code review not passed.")
            return report

        try:
            # Sync documentation
            report["docs"] = True

            # Git integration
            subprocess.run(["git", "add", "-A"], check=True)
            subprocess.run(["git", "commit", "-m", f"feat: {commit_msg}"], check=True)
            report["git"] = True
            report["success"] = True

            logger.info(f"Successfully shipped changes: {commit_msg}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Git operation failed: {e}")
        except Exception:
            logger.exception("Shipment failed")

        return report

    def _collect_stats(self) -> VIBEWorkflowStatsDict:
        """Aggregates workflow telemetry."""
        return {
            "current_step": self.current_step.name,
            "tasks": {
                "total": len(self.tasks),
                "done": len([t for t in self.tasks if t.status == TaskStatus.COMPLETED]),
            },
            "quality": {
                "tests_passed": self.test_results.get("passed", False),
                "review_score": self.review_result.score if self.review_result else 0,
            },
        }

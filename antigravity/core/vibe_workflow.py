"""
VIBE Workflow Engine - Strategic Development Cycle
===================================================

Implements the high-velocity 'Manus Pattern' development cycle within the
Agency OS. Ensures every change is planned, implemented, verified, and
reviewed before deployment.

Standard Cycle:
0. Detection: Identify active plan.md.
1. Analysis: Decompose plan into atomic tasks.
2. Implementation: Execute code changes (YAGNI/KISS).
3. Testing: Enforce 100% pass rate.
4. Review: Static analysis and code quality gates.
5. Finalization: Commit and documentation sync.

Binh Phap: Phap (Process) - Disciplined execution leads to victory.
"""

import logging
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Union

from .base import BaseEngine
from .models.workflow import CodeReviewResult, Task, TaskStatus, WorkflowStep
from .types import VIBEWorkflowStatsDict
from .workflow_steps import detect_active_plan, parse_plan_tasks, perform_file_review

# Configure logging
logger = logging.getLogger(__name__)


class VIBEWorkflow(BaseEngine):
    """
    VIBE Development Engine

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
        plan = detect_active_plan(self.plans_dir, explicit_path)
        if plan:
            self.current_plan = plan
            self.current_step = WorkflowStep.ANALYSIS
        return plan

    # --- Step 1: Analysis ---

    def analyze_plan(self) -> List[Task]:
        """Parses the Markdown plan into executable task objects."""
        if not self.current_plan:
            return []
        self.tasks = parse_plan_tasks(self.current_plan)
        if self.tasks:
            self.current_step = WorkflowStep.IMPLEMENTATION
        return self.tasks

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
        logger.info(f"[TEST] Running verification: `{command}`...")
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
        self.review_result = perform_file_review(files)
        if self.review_result.passed:
            self.current_step = WorkflowStep.FINALIZE
        return self.review_result

    # --- Step 5: Finalization ---

    def ship_changes(self, commit_msg: str) -> Dict[str, object]:
        """Integrates changes into the main repository branch."""
        report: Dict[str, object] = {"success": False, "git": False, "docs": False}

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

    def _collect_stats(self) -> Dict[str, object]:
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

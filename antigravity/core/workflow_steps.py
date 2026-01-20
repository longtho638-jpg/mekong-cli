"""
VIBE Workflow Steps - Detection, Analysis, and Review Logic
============================================================

Contains the core logic for plan detection, task analysis,
and code review operations.
"""

import logging
from antigravity.core.config import MAX_FILE_LINES
from antigravity.core.models.workflow import CodeReviewResult, Task, TaskStatus
from pathlib import Path
from typing import List, Optional, Union

logger = logging.getLogger(__name__)


def detect_active_plan(
    plans_dir: Path, explicit_path: Optional[str] = None
) -> Optional[Path]:
    """
    Locates the active development plan from the /plans directory.

    Args:
        plans_dir: Directory containing plans
        explicit_path: Optional explicit path to plan file

    Returns:
        Path to active plan or None
    """
    if explicit_path:
        path = Path(explicit_path)
        if path.exists():
            return path
        logger.error(f"Explicit plan path not found: {explicit_path}")
        return None

    if not plans_dir.exists():
        logger.warning(f"Plans directory missing: {plans_dir}")
        return None

    # Priority: nested plan.md files, newest first
    plans = list(plans_dir.glob("**/plan.md"))
    if not plans:
        # Fallback: check for task_plan.md
        plans = list(plans_dir.glob("**/task_plan.md"))

    if not plans:
        return None

    # Use the most recently modified plan
    latest = max(plans, key=lambda p: p.stat().st_mtime)
    logger.info(f"Active plan detected: {latest.name}")
    return latest


def parse_plan_tasks(plan_path: Path) -> List[Task]:
    """
    Parses the Markdown plan into executable task objects.

    Args:
        plan_path: Path to plan.md file

    Returns:
        List of parsed Task objects
    """
    if not plan_path or not plan_path.exists():
        return []

    try:
        content = plan_path.read_text(encoding="utf-8")
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
                        description=f"Automated extraction from {plan_path.name}",
                        status=status,
                    )
                )
                task_counter += 1

        logger.info(f"Analysis complete: {len(tasks)} tasks identified.")
        return tasks
    except Exception as e:
        logger.error(f"Failed to analyze plan {plan_path}: {e}")
        return []


def perform_file_review(files: List[Union[str, Path]]) -> CodeReviewResult:
    """
    Analyzes changed files for adherence to Agency OS standards.

    Args:
        files: List of file paths to review

    Returns:
        CodeReviewResult with score and warnings
    """
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

            # Rule 2: Basic Pattern Check
            if "TODO" in content:
                review.add_warning(f"Technical debt found: {path.name} contains TODOs")

        except Exception as e:
            logger.warning(f"Could not review {path.name}: {e}")

    return review

"""
Mekong CLI - Code Evolution Engine (AGI v2)

Self-modifying code capabilities: analyze own source, propose changes,
test in sandbox, and apply with git branch isolation.
The closest step to AGI — the system improves its own codebase.
"""

import logging
import subprocess
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml  # type: ignore[import-untyped]

from .event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)


class EvolutionStatus(str, Enum):
    """Status of a code evolution attempt."""

    PROPOSED = "proposed"
    TESTING = "testing"
    PASSED = "passed"
    FAILED = "failed"
    APPLIED = "applied"
    ROLLED_BACK = "rolled_back"


@dataclass
class CodeChange:
    """A single proposed code change."""

    file_path: str
    original_content: str = ""
    modified_content: str = ""
    description: str = ""
    change_type: str = "modify"  # modify | create | delete


@dataclass
class EvolutionAttempt:
    """Record of a self-modification attempt."""

    id: str = ""
    description: str = ""
    changes: List[CodeChange] = field(default_factory=list)
    status: EvolutionStatus = EvolutionStatus.PROPOSED
    test_results: str = ""
    branch_name: str = ""
    timestamp: float = field(default_factory=time.time)
    reasoning: str = ""
    rollback_data: Dict[str, str] = field(default_factory=dict)


class CodeEvolutionEngine:
    """
    Self-modifying code engine.

    Analyzes own source code, proposes improvements, tests them
    in isolation (git branches), and applies on success.
    Maintains an evolution journal for full rollback capability.
    """

    MAX_JOURNAL: int = 100
    SAFE_DIRS: List[str] = ["src/core", "src/agents"]
    FORBIDDEN_FILES: List[str] = [
        "governance.py",  # Never self-modify safety systems
        "code_evolution.py",  # Don't modify self-modifier
    ]

    def __init__(
        self,
        project_root: Optional[str] = None,
        llm_client: Optional[Any] = None,
        journal_path: Optional[str] = None,
    ) -> None:
        """
        Initialize code evolution engine.

        Args:
            project_root: Root directory of the project.
            llm_client: LLM for code analysis and generation.
            journal_path: Path to evolution journal.
        """
        self.project_root = Path(project_root or ".")
        self.llm_client = llm_client
        self._journal_path = Path(
            journal_path or ".mekong/evolution_journal.yaml",
        )
        self._journal: List[EvolutionAttempt] = []
        self._load_journal()

    def analyze_source(
        self,
        target_dir: str = "src/core",
    ) -> Dict[str, Any]:
        """
        Analyze source code for improvement opportunities.

        Args:
            target_dir: Directory to analyze.

        Returns:
            Analysis report with metrics and suggestions.
        """
        target = self.project_root / target_dir
        if not target.exists():
            return {"error": f"Directory {target_dir} not found"}

        report: Dict[str, Any] = {
            "target": target_dir,
            "files": [],
            "total_lines": 0,
            "total_functions": 0,
            "issues": [],
            "suggestions": [],
        }

        py_files = list(target.rglob("*.py"))
        for py_file in py_files:
            rel_path = str(py_file.relative_to(self.project_root))
            try:
                content = py_file.read_text()
                lines = content.split("\n")
                functions = [
                    l.strip() for l in lines
                    if l.strip().startswith("def ")
                ]

                file_info: Dict[str, Any] = {
                    "path": rel_path,
                    "lines": len(lines),
                    "functions": len(functions),
                }

                # Simple code quality checks
                if len(lines) > 500:
                    report["issues"].append(
                        f"{rel_path}: Too large ({len(lines)} lines). "
                        f"Consider splitting."
                    )
                for i, line in enumerate(lines, 1):
                    if len(line) > 120:
                        file_info.setdefault("long_lines", 0)
                        file_info["long_lines"] = (
                            file_info.get("long_lines", 0) + 1
                        )

                # Check for bare except
                if "except:" in content or "except Exception:" in content:
                    report["issues"].append(
                        f"{rel_path}: Uses broad exception handling"
                    )

                # Check for TODO/FIXME
                todos = [
                    l.strip() for l in lines
                    if "TODO" in l or "FIXME" in l or "HACK" in l
                ]
                if todos:
                    report["issues"].append(
                        f"{rel_path}: {len(todos)} TODO/FIXME markers"
                    )

                report["files"].append(file_info)
                report["total_lines"] += len(lines)
                report["total_functions"] += len(functions)

            except Exception:
                continue

        return report

    def propose_evolution(
        self,
        file_path: str,
        improvement_description: str,
    ) -> Optional[EvolutionAttempt]:
        """
        Propose a code evolution for a specific file.

        Args:
            file_path: Path to file to evolve (relative to project root).
            improvement_description: What to improve.

        Returns:
            EvolutionAttempt with proposed changes, or None if blocked.
        """
        # Safety check
        if not self._is_safe_to_modify(file_path):
            logger.warning(
                "[EVOLUTION] File %s is not safe to modify", file_path,
            )
            return None

        full_path = self.project_root / file_path
        if not full_path.exists():
            return None

        original = full_path.read_text()
        attempt_id = f"evo-{int(time.time())}"

        attempt = EvolutionAttempt(
            id=attempt_id,
            description=improvement_description,
            changes=[CodeChange(
                file_path=file_path,
                original_content=original,
                description=improvement_description,
            )],
            branch_name=f"evolution/{attempt_id}",
            reasoning=improvement_description,
        )

        # Use LLM to generate the improved code
        if self.llm_client and hasattr(self.llm_client, "generate"):
            try:
                modified = self._llm_generate_improvement(
                    file_path, original, improvement_description,
                )
                if modified and modified != original:
                    attempt.changes[0].modified_content = modified
                else:
                    return None
            except Exception as e:
                logger.debug("LLM code generation failed: %s", e)
                return None
        else:
            return None

        # Record in journal
        self._journal.append(attempt)
        self._save_journal()

        bus = get_event_bus()
        bus.emit(EventType.AUTONOMOUS_CYCLE, {
            "event": "evolution_proposed",
            "id": attempt_id,
            "file": file_path,
            "description": improvement_description,
        })

        return attempt

    def test_evolution(
        self,
        attempt: EvolutionAttempt,
    ) -> bool:
        """
        Test a proposed evolution in isolation using git branch.

        Args:
            attempt: The evolution attempt to test.

        Returns:
            True if all tests pass.
        """
        attempt.status = EvolutionStatus.TESTING

        # Create git branch for isolation
        original_branch = self._git_cmd("rev-parse --abbrev-ref HEAD")
        branch = attempt.branch_name

        try:
            # Create branch
            self._git_cmd(f"checkout -b {branch}")

            # Apply changes
            for change in attempt.changes:
                full_path = self.project_root / change.file_path
                if change.modified_content:
                    # Store rollback data
                    attempt.rollback_data[change.file_path] = (
                        change.original_content
                    )
                    full_path.write_text(change.modified_content)

            # Run tests
            test_result = subprocess.run(
                ["python3", "-m", "pytest", "tests/", "-x", "--tb=short", "-q"],
                capture_output=True, text=True, timeout=120,
                cwd=str(self.project_root),
            )

            attempt.test_results = test_result.stdout + test_result.stderr
            passed = test_result.returncode == 0

            if passed:
                attempt.status = EvolutionStatus.PASSED
                # Commit the changes
                self._git_cmd("add -A")
                self._git_cmd(
                    f'commit -m "evolution({attempt.id}): {attempt.description[:50]}"'
                )
            else:
                attempt.status = EvolutionStatus.FAILED
                # Restore original files
                for change in attempt.changes:
                    full_path = self.project_root / change.file_path
                    full_path.write_text(change.original_content)

        except Exception as e:
            attempt.status = EvolutionStatus.FAILED
            attempt.test_results = str(e)
            # Restore originals on any error
            for change in attempt.changes:
                try:
                    full_path = self.project_root / change.file_path
                    full_path.write_text(change.original_content)
                except Exception:
                    pass
            passed = False
        finally:
            # Return to original branch
            self._git_cmd(f"checkout {original_branch}")
            if not passed:
                self._git_cmd(f"branch -D {branch}")

        self._save_journal()
        return passed

    def apply_evolution(self, attempt: EvolutionAttempt) -> bool:
        """
        Apply a tested evolution (merge branch).

        Args:
            attempt: Evolution that passed tests.

        Returns:
            True if applied successfully.
        """
        if attempt.status != EvolutionStatus.PASSED:
            return False

        try:
            self._git_cmd(f"merge {attempt.branch_name}")
            attempt.status = EvolutionStatus.APPLIED
            self._save_journal()

            bus = get_event_bus()
            bus.emit(EventType.AUTONOMOUS_CYCLE, {
                "event": "evolution_applied",
                "id": attempt.id,
                "description": attempt.description,
            })

            return True
        except Exception:
            attempt.status = EvolutionStatus.FAILED
            self._save_journal()
            return False

    def rollback(self, attempt_id: str) -> bool:
        """
        Rollback a previously applied evolution.

        Args:
            attempt_id: ID of the evolution to rollback.

        Returns:
            True if rollback successful.
        """
        attempt = self._find_attempt(attempt_id)
        if not attempt or attempt.status != EvolutionStatus.APPLIED:
            return False

        try:
            for file_path, original_content in attempt.rollback_data.items():
                full_path = self.project_root / file_path
                full_path.write_text(original_content)

            attempt.status = EvolutionStatus.ROLLED_BACK
            self._save_journal()
            return True
        except Exception:
            return False

    def get_journal(self, limit: int = 20) -> List[EvolutionAttempt]:
        """Return recent evolution attempts."""
        return self._journal[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        """Return evolution statistics."""
        if not self._journal:
            return {
                "total_attempts": 0,
                "success_rate": 0.0,
                "applied": 0,
            }

        applied = sum(
            1 for a in self._journal
            if a.status == EvolutionStatus.APPLIED
        )
        passed = sum(
            1 for a in self._journal
            if a.status in (EvolutionStatus.PASSED, EvolutionStatus.APPLIED)
        )
        total = len(self._journal)

        return {
            "total_attempts": total,
            "passed": passed,
            "applied": applied,
            "failed": sum(
                1 for a in self._journal
                if a.status == EvolutionStatus.FAILED
            ),
            "rolled_back": sum(
                1 for a in self._journal
                if a.status == EvolutionStatus.ROLLED_BACK
            ),
            "success_rate": passed / total if total > 0 else 0.0,
        }

    # --- Internal helpers ---

    def _is_safe_to_modify(self, file_path: str) -> bool:
        """Check if a file is safe to self-modify."""
        basename = Path(file_path).name
        if basename in self.FORBIDDEN_FILES:
            return False
        return any(
            file_path.startswith(d) for d in self.SAFE_DIRS
        )

    def _git_cmd(self, cmd: str) -> str:
        """Run a git command."""
        result = subprocess.run(
            f"git {cmd}", shell=True,
            capture_output=True, text=True, timeout=30,
            cwd=str(self.project_root),
        )
        return result.stdout.strip()

    def _llm_generate_improvement(
        self,
        file_path: str,
        original: str,
        description: str,
    ) -> str:
        """Use LLM to generate improved code."""
        prompt = (
            f"Improve this Python file based on the description.\n\n"
            f"File: {file_path}\n"
            f"Description: {description}\n\n"
            f"Original code:\n```python\n{original[:3000]}\n```\n\n"
            f"Return ONLY the complete improved Python file, no explanations."
        )
        if self.llm_client is None:
            return ""
        return self.llm_client.generate(prompt)

    def _find_attempt(self, attempt_id: str) -> Optional[EvolutionAttempt]:
        """Find an attempt by ID."""
        for attempt in self._journal:
            if attempt.id == attempt_id:
                return attempt
        return None

    def _load_journal(self) -> None:
        """Load journal from YAML."""
        if not self._journal_path.exists():
            return
        try:
            data = yaml.safe_load(self._journal_path.read_text()) or []
            self._journal = []
            for item in data:
                try:
                    status = EvolutionStatus(item.get("status", "proposed"))
                except ValueError:
                    status = EvolutionStatus.PROPOSED
                self._journal.append(EvolutionAttempt(
                    id=item.get("id", ""),
                    description=item.get("description", ""),
                    status=status,
                    test_results=item.get("test_results", ""),
                    branch_name=item.get("branch_name", ""),
                    timestamp=item.get("timestamp", 0),
                    reasoning=item.get("reasoning", ""),
                ))
        except Exception:
            self._journal = []

    def _save_journal(self) -> None:
        """Save journal to YAML."""
        self._journal_path.parent.mkdir(parents=True, exist_ok=True)
        data = [
            {
                "id": a.id,
                "description": a.description,
                "status": a.status.value,
                "test_results": a.test_results[:500],
                "branch_name": a.branch_name,
                "timestamp": a.timestamp,
                "reasoning": a.reasoning,
            }
            for a in self._journal[-self.MAX_JOURNAL:]
        ]
        self._journal_path.write_text(yaml.dump(data, default_flow_style=False))


__all__ = [
    "CodeEvolutionEngine",
    "CodeChange",
    "EvolutionAttempt",
    "EvolutionStatus",
]

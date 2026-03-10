"""
Mekong CLI - World Model (AGI v2)

Snapshots the environment state (files, git, processes, ports) to enable
context-aware planning and side-effect prediction. Pure Python, no external deps.
"""

import logging
import os
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


@dataclass
class WorldState:
    """Snapshot of the current environment."""

    timestamp: float = field(default_factory=time.time)
    working_directory: str = ""
    file_tree: List[str] = field(default_factory=list)
    file_count: int = 0
    git_branch: str = ""
    git_status: str = ""
    git_dirty_files: List[str] = field(default_factory=list)
    running_processes: List[Dict[str, str]] = field(default_factory=list)
    open_ports: List[int] = field(default_factory=list)
    env_vars: Dict[str, str] = field(default_factory=dict)
    disk_usage_mb: float = 0.0


@dataclass
class WorldDiff:
    """Difference between two WorldState snapshots."""

    files_added: List[str] = field(default_factory=list)
    files_removed: List[str] = field(default_factory=list)
    files_modified: List[str] = field(default_factory=list)
    git_changed: bool = False
    new_processes: List[Dict[str, str]] = field(default_factory=list)
    stopped_processes: List[Dict[str, str]] = field(default_factory=list)
    new_ports: List[int] = field(default_factory=list)
    closed_ports: List[int] = field(default_factory=list)
    duration_ms: float = 0.0

    @property
    def has_changes(self) -> bool:
        return bool(
            self.files_added or self.files_removed or self.files_modified
            or self.git_changed or self.new_processes or self.stopped_processes
            or self.new_ports or self.closed_ports
        )

    def summary(self) -> str:
        """Human-readable summary of changes."""
        parts = []
        if self.files_added:
            parts.append(f"+{len(self.files_added)} files added")
        if self.files_removed:
            parts.append(f"-{len(self.files_removed)} files removed")
        if self.files_modified:
            parts.append(f"~{len(self.files_modified)} files modified")
        if self.git_changed:
            parts.append("git state changed")
        if self.new_ports:
            parts.append(f"new ports: {self.new_ports}")
        if not parts:
            return "No changes detected"
        return "; ".join(parts)


@dataclass
class SideEffectPrediction:
    """Predicted side effects of a planned action."""

    action: str
    predicted_files_modified: List[str] = field(default_factory=list)
    predicted_files_created: List[str] = field(default_factory=list)
    predicted_services_affected: List[str] = field(default_factory=list)
    risk_level: str = "low"  # "low" | "medium" | "high"
    warnings: List[str] = field(default_factory=list)


class WorldModel:
    """
    Environment state tracker for context-aware planning.

    Takes snapshots of the working environment (file system, git state,
    running processes) and computes diffs to understand what changed.
    """

    def __init__(
        self,
        working_dir: Optional[str] = None,
        llm_client: Optional[Any] = None,
    ) -> None:
        """
        Initialize world model.

        Args:
            working_dir: Directory to monitor. Defaults to cwd.
            llm_client: Optional LLM for side-effect prediction.
        """
        self.working_dir = working_dir or os.getcwd()
        self.llm_client = llm_client
        self._snapshots: List[WorldState] = []

    def snapshot(self) -> WorldState:
        """
        Take a snapshot of the current environment state.

        Captures: file tree, git status, running processes, open ports.

        Returns:
            WorldState with current environment data.
        """
        state = WorldState(working_directory=self.working_dir)

        # File tree (limited depth, exclude common noise)
        state.file_tree = self._get_file_tree()
        state.file_count = len(state.file_tree)

        # Git state
        state.git_branch = self._run_cmd("git rev-parse --abbrev-ref HEAD")
        state.git_status = self._run_cmd("git status --short")
        if state.git_status:
            state.git_dirty_files = [
                line.strip().split()[-1]
                for line in state.git_status.strip().split("\n")
                if line.strip()
            ]

        # Running processes (relevant ones only)
        state.running_processes = self._get_relevant_processes()

        # Open ports
        state.open_ports = self._get_open_ports()

        # Relevant environment variables
        state.env_vars = {
            k: v for k, v in os.environ.items()
            if any(
                pat in k.upper()
                for pat in [
                    "API", "KEY", "URL", "PORT", "HOST",
                    "DATABASE", "REDIS", "MEKONG", "LLM",
                ]
            )
        }

        # Store snapshot
        self._snapshots.append(state)
        if len(self._snapshots) > 20:
            self._snapshots = self._snapshots[-20:]

        return state

    def diff(
        self,
        before: WorldState,
        after: WorldState,
    ) -> WorldDiff:
        """
        Compute difference between two snapshots.

        Args:
            before: Earlier snapshot.
            after: Later snapshot.

        Returns:
            WorldDiff describing all changes.
        """
        before_files = set(before.file_tree)
        after_files = set(after.file_tree)

        result = WorldDiff(
            files_added=sorted(after_files - before_files),
            files_removed=sorted(before_files - after_files),
            git_changed=(
                before.git_branch != after.git_branch
                or before.git_status != after.git_status
            ),
            duration_ms=(after.timestamp - before.timestamp) * 1000,
        )

        # Modified files (in git dirty list of after but not before)
        before_dirty = set(before.git_dirty_files)
        after_dirty = set(after.git_dirty_files)
        result.files_modified = sorted(after_dirty - before_dirty)

        # Process changes
        before_pids = {
            p.get("pid", ""): p for p in before.running_processes
        }
        after_pids = {
            p.get("pid", ""): p for p in after.running_processes
        }
        result.new_processes = [
            p for pid, p in after_pids.items()
            if pid not in before_pids
        ]
        result.stopped_processes = [
            p for pid, p in before_pids.items()
            if pid not in after_pids
        ]

        # Port changes
        before_ports = set(before.open_ports)
        after_ports = set(after.open_ports)
        result.new_ports = sorted(after_ports - before_ports)
        result.closed_ports = sorted(before_ports - after_ports)

        return result

    def predict_side_effects(
        self, plan_description: str,
    ) -> SideEffectPrediction:
        """
        Predict side effects of a planned action.

        Uses heuristics and optionally LLM for analysis.

        Args:
            plan_description: Description of what will be executed.

        Returns:
            SideEffectPrediction with expected changes.
        """
        prediction = SideEffectPrediction(action=plan_description)
        desc_lower = plan_description.lower()

        # Heuristic predictions
        if any(w in desc_lower for w in ["rm ", "delete", "remove", "unlink"]):
            prediction.risk_level = "high"
            prediction.warnings.append("Destructive operation: files may be deleted")

        if any(w in desc_lower for w in ["pip install", "npm install", "brew"]):
            prediction.risk_level = "medium"
            prediction.warnings.append("Package installation may modify environment")

        if any(w in desc_lower for w in ["deploy", "push", "publish"]):
            prediction.risk_level = "high"
            prediction.warnings.append("Production deployment detected")

        if any(w in desc_lower for w in ["git reset", "git clean", "git checkout -- "]):
            prediction.risk_level = "high"
            prediction.warnings.append("Git operation may discard uncommitted changes")

        if any(w in desc_lower for w in ["docker", "systemctl", "kill"]):
            prediction.risk_level = "medium"
            prediction.warnings.append("Service management operation")
            prediction.predicted_services_affected.append("system services")

        # File predictions based on common patterns
        if "create" in desc_lower or "init" in desc_lower:
            prediction.predicted_files_created.append("(new files expected)")

        if "modify" in desc_lower or "edit" in desc_lower or "update" in desc_lower:
            prediction.predicted_files_modified.append("(existing files may change)")

        # LLM-powered prediction if available
        if self.llm_client and hasattr(self.llm_client, "generate_json"):
            try:
                llm_pred = self._llm_predict(plan_description)
                if llm_pred:
                    prediction.predicted_files_modified.extend(
                        llm_pred.get("files_modified", []),
                    )
                    prediction.predicted_files_created.extend(
                        llm_pred.get("files_created", []),
                    )
                    prediction.warnings.extend(llm_pred.get("warnings", []))
            except Exception:
                pass

        if not prediction.risk_level or prediction.risk_level == "low":
            if prediction.warnings:
                prediction.risk_level = "medium"

        return prediction

    def get_latest_snapshot(self) -> Optional[WorldState]:
        """Return the most recent snapshot."""
        return self._snapshots[-1] if self._snapshots else None

    def get_context_summary(self) -> str:
        """
        Return a compact summary of the current world state for LLM context.

        Useful for injecting into planning prompts.
        """
        state = self.get_latest_snapshot()
        if not state:
            state = self.snapshot()

        lines = [
            f"Working dir: {state.working_directory}",
            f"Files: {state.file_count}",
            f"Git branch: {state.git_branch or 'N/A'}",
        ]
        if state.git_dirty_files:
            lines.append(
                f"Dirty files: {', '.join(state.git_dirty_files[:5])}"
            )
        if state.open_ports:
            lines.append(f"Open ports: {state.open_ports}")
        if state.running_processes:
            procs = [p.get("name", "?") for p in state.running_processes[:5]]
            lines.append(f"Running: {', '.join(procs)}")

        return "\n".join(lines)

    # --- Internal helpers ---

    def _get_file_tree(self, max_depth: int = 3) -> List[str]:
        """Get file listing (excluding noise directories)."""
        exclusions = {
            ".git", "node_modules", "__pycache__", ".venv",
            "venv", ".tox", ".mypy_cache", ".pytest_cache",
            "dist", "build", ".egg-info",
        }
        files: List[str] = []
        root = Path(self.working_dir)
        try:
            for item in root.rglob("*"):
                # Check depth
                rel = item.relative_to(root)
                if len(rel.parts) > max_depth:
                    continue
                # Skip excluded dirs
                if any(part in exclusions for part in rel.parts):
                    continue
                if item.is_file():
                    files.append(str(rel))
                if len(files) >= 500:
                    break
        except Exception:
            pass
        return files

    def _get_relevant_processes(self) -> List[Dict[str, str]]:
        """Get running processes relevant to development."""
        keywords = [
            "python", "node", "uvicorn", "gunicorn", "npm",
            "docker", "redis", "postgres", "mekong",
        ]
        processes: List[Dict[str, str]] = []
        try:
            output = self._run_cmd("ps aux")
            if not output:
                return []
            for line in output.strip().split("\n")[1:]:  # Skip header
                parts = line.split(None, 10)
                if len(parts) >= 11:
                    cmd = parts[10].lower()
                    if any(kw in cmd for kw in keywords):
                        processes.append({
                            "pid": parts[1],
                            "name": parts[10][:80],
                            "cpu": parts[2],
                            "mem": parts[3],
                        })
        except Exception:
            pass
        return processes[:20]

    def _get_open_ports(self) -> List[int]:
        """Get locally listening ports."""
        ports: Set[int] = set()
        try:
            output = self._run_cmd("lsof -i -P -n | grep LISTEN")
            if output:
                for line in output.strip().split("\n"):
                    parts = line.split()
                    for part in parts:
                        if ":" in part:
                            try:
                                port = int(part.split(":")[-1])
                                if 1024 <= port <= 65535:
                                    ports.add(port)
                            except ValueError:
                                pass
        except Exception:
            pass
        return sorted(ports)

    def _run_cmd(self, cmd: str) -> str:
        """Run a shell command and return stdout."""
        try:
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True,
                timeout=5, cwd=self.working_dir,
            )
            return result.stdout.strip()
        except (subprocess.TimeoutExpired, Exception):
            return ""

    def _llm_predict(self, plan: str) -> Dict[str, Any]:
        """Use LLM for side-effect prediction."""
        prompt = (
            f"Predict the side effects of this action:\n"
            f"Action: {plan}\n"
            f"Current state:\n{self.get_context_summary()}\n\n"
            f"Return JSON with: files_modified, files_created, warnings"
        )
        if self.llm_client is None:
            return {}
        try:
            result = self.llm_client.generate_json(prompt)
            return result if isinstance(result, dict) else {}
        except Exception:
            return {}


__all__ = [
    "WorldModel",
    "WorldState",
    "WorldDiff",
    "SideEffectPrediction",
]

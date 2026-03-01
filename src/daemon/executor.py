"""
Mekong Daemon - Mission Executor

Runs missions via subprocess (shell) or LLM client.
Abstract enough to swap execution backends.
"""

import logging
import subprocess
import time
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class MissionResult:
    """Result of a mission execution."""
    success: bool
    output: str = ""
    error: str = ""
    duration: float = 0.0
    exit_code: int = -1


class MissionExecutor:
    """
    Executes missions as shell commands or LLM prompts.

    Args:
        working_dir: Default working directory for shell commands
        timeout: Default timeout in seconds
    """

    def __init__(self, working_dir: str = ".", timeout: int = 1800) -> None:
        self._cwd = working_dir
        self._timeout = timeout

    def run_shell(self, command: str, timeout: Optional[int] = None) -> MissionResult:
        """Execute a shell command and return result."""
        t = timeout or self._timeout
        start = time.time()
        try:
            proc = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                cwd=self._cwd, timeout=t,
            )
            return MissionResult(
                success=proc.returncode == 0,
                output=proc.stdout[-2000:] if proc.stdout else "",
                error=proc.stderr[-1000:] if proc.stderr else "",
                duration=round(time.time() - start, 2),
                exit_code=proc.returncode,
            )
        except subprocess.TimeoutExpired:
            return MissionResult(
                success=False, error=f"Timeout after {t}s",
                duration=round(time.time() - start, 2),
            )
        except Exception as e:
            return MissionResult(
                success=False, error=str(e),
                duration=round(time.time() - start, 2),
            )

    def run_mission_file(self, filepath: str, timeout: Optional[int] = None) -> MissionResult:
        """Read mission file content and execute as shell command."""
        try:
            with open(filepath, "r") as f:
                content = f.read().strip()
            if not content:
                return MissionResult(success=False, error="Empty mission file")
            return self.run_shell(content, timeout)
        except Exception as e:
            return MissionResult(success=False, error=f"Failed to read mission: {e}")


__all__ = ["MissionExecutor", "MissionResult"]

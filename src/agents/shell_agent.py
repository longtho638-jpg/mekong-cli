"""
Mekong CLI - ShellAgent

Safe execution of arbitrary shell commands with timeout and sandbox restrictions.
"""

import subprocess
import shlex
from typing import List

from ..core.agent_base import AgentBase, Task, Result

# Commands that are never allowed for safety
BLOCKED_COMMANDS = frozenset([
    "rm -rf /", "rm -rf /*", "mkfs", "dd if=",
    ":(){ :|:& };:", "chmod -R 777 /",
    "shutdown", "reboot", "halt", "poweroff",
    "> /dev/sda", "mv / ", "wget -O- | sh",
    "curl | sh", "curl | bash",
])

# Patterns that indicate dangerous operations
BLOCKED_PATTERNS = frozenset([
    "rm -rf /",
    "/dev/sd",
    "/dev/disk",
    "mkfs.",
    "format c:",
])


class ShellAgent(AgentBase):
    """
    Agent for safe shell command execution.

    Supports:
    - run <command>: Execute a shell command
    - pipe <cmd1> | <cmd2>: Execute piped commands
    - env: Show environment info
    """

    DEFAULT_TIMEOUT = 30
    MAX_TIMEOUT = 120

    def __init__(self, cwd: str = ".", timeout: int = DEFAULT_TIMEOUT):
        super().__init__(name="ShellAgent")
        self.cwd = cwd
        self.timeout = min(timeout, self.MAX_TIMEOUT)

    def plan(self, input_data: str) -> List[Task]:
        """Parse shell command into tasks."""
        parts = input_data.strip().split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""

        if command == "env":
            return [
                Task(id="shell_env", description="Show environment", input={})
            ]

        if command == "run":
            cmd_str = args
        else:
            # Treat entire input as the command
            cmd_str = input_data.strip()

        return [
            Task(
                id="shell_run",
                description=f"Run: {cmd_str[:60]}",
                input={"command": cmd_str},
            )
        ]

    def execute(self, task: Task) -> Result:
        """Execute shell command with safety checks."""
        if task.id == "shell_env":
            return self._run_env()

        cmd_str = task.input.get("command", "")
        if not cmd_str:
            return Result(
                task_id=task.id, success=False, output=None,
                error="Empty command",
            )

        # Safety check
        violation = self._check_safety(cmd_str)
        if violation:
            return Result(
                task_id=task.id, success=False, output=None,
                error=f"Blocked: {violation}",
            )

        try:
            result = subprocess.run(
                cmd_str,
                shell=True,
                cwd=self.cwd,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )

            output = result.stdout.strip() or result.stderr.strip()
            return Result(
                task_id=task.id,
                success=result.returncode == 0,
                output={
                    "stdout": result.stdout.strip()[:10000],
                    "stderr": result.stderr.strip()[:2000],
                    "exit_code": result.returncode,
                },
                error=result.stderr.strip()[:500] if result.returncode != 0 else None,
            )

        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id, success=False, output=None,
                error=f"Timed out after {self.timeout}s",
            )
        except Exception as e:
            return Result(
                task_id=task.id, success=False, output=None, error=str(e),
            )

    def _check_safety(self, cmd: str) -> str:
        """Check if command is safe to execute. Returns violation reason or empty string."""
        cmd_lower = cmd.lower().strip()

        # Check exact blocked commands
        for blocked in BLOCKED_COMMANDS:
            if blocked in cmd_lower:
                return f"Dangerous command pattern: {blocked}"

        # Check blocked patterns
        for pattern in BLOCKED_PATTERNS:
            if pattern in cmd_lower:
                return f"Dangerous pattern: {pattern}"

        return ""

    def _run_env(self) -> Result:
        """Show basic environment info."""
        import platform
        info = {
            "os": platform.system(),
            "arch": platform.machine(),
            "python": platform.python_version(),
            "cwd": self.cwd,
        }
        return Result(task_id="shell_env", success=True, output=info)


__all__ = ["ShellAgent"]

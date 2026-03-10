"""
Google Workspace Agent - Official gws CLI integration.

Provides native access to Drive, Gmail, Calendar, Sheets, Docs, Chat, Admin.
"""

from typing import Any, Dict, List

import json
import subprocess

from src.core.agent_base import AgentBase, Task, Result


class WorkspaceAgent(AgentBase):
    """
    Official Google Workspace Agent powered by @googleworkspace/cli (gws).

    Provides native access to Drive, Gmail, Calendar, Sheets, Docs, Chat, Admin.
    """

    def __init__(self, name: str = "workspace", max_retries: int = 3) -> None:
        """Initialize WorkspaceAgent and verify gws CLI is available."""
        super().__init__(name, max_retries)
        self._check_gws_installed()

    def _check_gws_installed(self) -> None:
        """Ensure gws CLI is installed and available in PATH."""
        try:
            subprocess.run(
                ["gws", "--version"],
                capture_output=True,
                text=True,
                check=True,
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            raise Exception(
                "❌ @googleworkspace/cli (gws) is not installed or not in PATH.\n"
                "Please run: npm install -g @googleworkspace/cli"
            ) from e

    def plan(self, input_data: str) -> List[Task]:
        """
        Parse input into executable tasks.

        Since gws operates as a direct REST-like CLI, many tasks map 1:1.
        For complex goals, we delegate to LLM planner.

        Args:
            input_data: User's goal description

        Returns:
            List of Task objects
        """
        # We rely on the core LLM planner for multi-step Workspace tasks
        # returning an empty list tells the Orchestrator to use the LLM to figure it out
        return []

    def execute(self, task: Task) -> Result:
        """
        Execute a single task.

        Args:
            task: Task to execute with command in description

        Returns:
            Result with output or error
        """
        command = task.description

        # Ensure we only run gws commands for security
        if not command.startswith("gws "):
            command = f"gws {command}"

        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                check=True,
            )

            # Try to parse JSON output if possible
            output = result.stdout.strip()
            try:
                parsed_output = json.loads(output)
                return Result(
                    task_id=task.id,
                    success=True,
                    output=parsed_output,
                )
            except json.JSONDecodeError:
                return Result(
                    task_id=task.id,
                    success=True,
                    output=output,
                )

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.strip() or e.stdout.strip()
            if "accessNotConfigured" in error_msg or "invalid_grant" in error_msg:
                error_msg += (
                    "\n💡 Hint: Run 'gws auth setup' or check 'scripts/gws-auth-setup.sh'"
                )

            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=error_msg,
            )

    def verify(self, result: Result) -> bool:
        """
        Validate task result.

        Args:
            result: Result to validate

        Returns:
            True if valid, False to retry
        """
        return result.success

"""
Mekong CLI - GitAgent

Real agent for Git operations: status, diff, commit, branch management.
"""

import subprocess
from typing import List

from ..core.agent_base import AgentBase, Task, Result


class GitAgent(AgentBase):
    """
    Agent for Git repository operations.

    Supports:
    - status: Show working tree status
    - diff: Show unstaged changes
    - log: Show recent commits
    - commit: Stage all and commit
    - branch: List or create branches
    """

    def __init__(self, cwd: str = "."):
        super().__init__(name="GitAgent")
        self.cwd = cwd

    def plan(self, input_data: str) -> List[Task]:
        """
        Parse git command string into tasks.

        Args:
            input_data: Command like "status", "commit <message>", "log 5"
        """
        parts = input_data.strip().split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""

        if command == "status":
            return [Task(id="git_status", description="Git status", input={})]

        elif command == "diff":
            return [Task(id="git_diff", description="Git diff", input={})]

        elif command == "log":
            count = int(args) if args.isdigit() else 10
            return [
                Task(
                    id="git_log",
                    description=f"Git log (last {count})",
                    input={"count": count},
                )
            ]

        elif command == "commit":
            message = args or "chore: auto-commit via Mekong CLI"
            return [
                Task(id="git_add", description="Stage all changes", input={}),
                Task(
                    id="git_commit",
                    description=f"Commit: {message}",
                    input={"message": message},
                ),
            ]

        elif command == "branch":
            if args:
                return [
                    Task(
                        id="git_branch_create",
                        description=f"Create branch: {args}",
                        input={"name": args},
                    )
                ]
            return [Task(id="git_branch_list", description="List branches", input={})]

        else:
            return [
                Task(
                    id="git_custom",
                    description=f"git {input_data}",
                    input={"cmd": input_data},
                )
            ]

    def execute(self, task: Task) -> Result:
        """Execute git command."""
        cmd_map = {
            "git_status": ["git", "status", "--short"],
            "git_diff": ["git", "diff", "--stat"],
            "git_log": ["git", "log", "--oneline", f"-{task.input.get('count', 10)}"],
            "git_add": ["git", "add", "-A"],
            "git_commit": [
                "git",
                "commit",
                "-m",
                task.input.get("message", "auto-commit"),
            ],
            "git_branch_list": ["git", "branch", "-a"],
            "git_branch_create": [
                "git",
                "checkout",
                "-b",
                task.input.get("name", "new-branch"),
            ],
        }

        cmd = cmd_map.get(task.id)
        if not cmd:
            # Custom command
            custom = task.input.get("cmd", "")
            cmd = ["git"] + custom.split()

        try:
            result = subprocess.run(
                cmd,
                cwd=self.cwd,
                capture_output=True,
                text=True,
                timeout=30,
            )

            output = result.stdout.strip() or result.stderr.strip()
            return Result(
                task_id=task.id,
                success=result.returncode == 0,
                output=output,
                error=result.stderr.strip() if result.returncode != 0 else None,
            )

        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id, success=False, output=None, error="Command timed out"
            )
        except Exception as e:
            return Result(task_id=task.id, success=False, output=None, error=str(e))


__all__ = ["GitAgent"]

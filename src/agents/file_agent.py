"""
Mekong CLI - FileAgent

Real agent for file system operations: search, read, create, analyze.
"""

import subprocess
from pathlib import Path
from typing import List

from ..core.agent_base import AgentBase, Task, Result


class FileAgent(AgentBase):
    """
    Agent for file system operations.

    Supports:
    - find <pattern>: Search for files matching pattern
    - read <path>: Read file content
    - tree [depth]: Show directory tree
    - stats: Show project file statistics
    - grep <pattern>: Search content in files
    """

    def __init__(self, cwd: str = "."):
        super().__init__(name="FileAgent")
        self.cwd = cwd

    def plan(self, input_data: str) -> List[Task]:
        """Parse file command into tasks."""
        parts = input_data.strip().split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""

        if command == "find":
            return [
                Task(
                    id="file_find",
                    description=f"Find files: {args}",
                    input={"pattern": args},
                )
            ]

        elif command == "read":
            return [
                Task(id="file_read", description=f"Read: {args}", input={"path": args})
            ]

        elif command == "tree":
            depth = int(args) if args.isdigit() else 3
            return [
                Task(
                    id="file_tree",
                    description=f"Directory tree (depth {depth})",
                    input={"depth": depth},
                )
            ]

        elif command == "stats":
            return [
                Task(id="file_stats", description="Project file statistics", input={})
            ]

        elif command == "grep":
            return [
                Task(
                    id="file_grep", description=f"Grep: {args}", input={"pattern": args}
                )
            ]

        else:
            return [
                Task(
                    id="file_custom", description=input_data, input={"raw": input_data}
                )
            ]

    def execute(self, task: Task) -> Result:
        """Execute file operation."""
        try:
            if task.id == "file_find":
                pattern = task.input.get("pattern", "*")
                cmd = [
                    "find",
                    ".",
                    "-name",
                    pattern,
                    "-not",
                    "-path",
                    "*/node_modules/*",
                    "-not",
                    "-path",
                    "*/.git/*",
                    "-not",
                    "-path",
                    "*/venv/*",
                ]
                result = subprocess.run(
                    cmd, cwd=self.cwd, capture_output=True, text=True, timeout=15
                )
                files = [f for f in result.stdout.strip().split("\n") if f][
                    :50
                ]  # Cap at 50
                return Result(
                    task_id=task.id,
                    success=True,
                    output={"files": files, "count": len(files)},
                )

            elif task.id == "file_read":
                filepath = Path(self.cwd) / task.input.get("path", "")
                if not filepath.exists():
                    return Result(
                        task_id=task.id,
                        success=False,
                        output=None,
                        error=f"File not found: {filepath}",
                    )
                content = filepath.read_text(encoding="utf-8", errors="replace")
                lines = content.count("\n") + 1
                return Result(
                    task_id=task.id,
                    success=True,
                    output={
                        "content": content[:5000],
                        "lines": lines,
                        "size": len(content),
                    },
                )

            elif task.id == "file_tree":
                depth = task.input.get("depth", 3)
                cmd = [
                    "find",
                    ".",
                    "-maxdepth",
                    str(depth),
                    "-not",
                    "-path",
                    "*/node_modules/*",
                    "-not",
                    "-path",
                    "*/.git/*",
                    "-not",
                    "-path",
                    "*/venv/*",
                    "-not",
                    "-path",
                    "*/__pycache__/*",
                ]
                result = subprocess.run(
                    cmd, cwd=self.cwd, capture_output=True, text=True, timeout=15
                )
                entries = sorted(result.stdout.strip().split("\n"))[:100]
                return Result(
                    task_id=task.id,
                    success=True,
                    output={"tree": entries, "count": len(entries)},
                )

            elif task.id == "file_stats":
                stats = {}
                root = Path(self.cwd)
                for ext in [
                    ".py",
                    ".ts",
                    ".tsx",
                    ".js",
                    ".jsx",
                    ".md",
                    ".json",
                    ".yaml",
                    ".yml",
                    ".css",
                ]:
                    files = list(root.rglob(f"*{ext}"))
                    # Exclude node_modules, venv, .git
                    files = [
                        f
                        for f in files
                        if not any(
                            part in f.parts
                            for part in ("node_modules", "venv", ".git", "__pycache__")
                        )
                    ]
                    if files:
                        total_lines = 0
                        for f in files:
                            try:
                                total_lines += f.read_text(errors="replace").count("\n")
                            except Exception:
                                pass
                        stats[ext] = {"files": len(files), "lines": total_lines}

                return Result(task_id=task.id, success=True, output=stats)

            elif task.id == "file_grep":
                pattern = task.input.get("pattern", "")
                cmd = [
                    "grep",
                    "-rn",
                    "--include=*.py",
                    "--include=*.ts",
                    "--include=*.tsx",
                    "--include=*.js",
                    "--include=*.md",
                    pattern,
                    ".",
                ]
                result = subprocess.run(
                    cmd, cwd=self.cwd, capture_output=True, text=True, timeout=15
                )
                matches = result.stdout.strip().split("\n")[:30]  # Cap at 30
                return Result(
                    task_id=task.id,
                    success=True,
                    output={
                        "matches": [m for m in matches if m],
                        "count": len([m for m in matches if m]),
                    },
                )

            else:
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=f"Unknown task: {task.id}",
                )

        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id, success=False, output=None, error="Command timed out"
            )
        except Exception as e:
            return Result(task_id=task.id, success=False, output=None, error=str(e))


__all__ = ["FileAgent"]

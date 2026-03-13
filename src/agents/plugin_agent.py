"""
Mekong CLI - PluginAgent

Agent for plugin management: list, install, remove, update plugins.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from ..core.agent_base import AgentBase, Task, Result


class PluginAgent(AgentBase):
    """
    Agent for plugin/package management operations.

    Supports:
    - list: List installed plugins
    - install: Install new plugin
    - remove: Remove installed plugin
    - update: Update plugin to latest version
    """

    def __init__(self, cwd: str = ".", registry_path: str | None = None) -> None:
        """Initialize PluginAgent.

        Args:
            cwd: Working directory for plugin operations. Defaults to current dir.
            registry_path: Path to plugins registry JSON file. Defaults to .mekong/plugins.json.
        """
        super().__init__(name="PluginAgent")
        self.cwd = Path(cwd).resolve()
        self.registry_path = Path(registry_path) if registry_path else self.cwd / ".mekong" / "plugins.json"

    def plan(self, input_data: str) -> list[Task]:
        """Parse plugin command string into tasks.

        Args:
            input_data: Command like "list", "install <plugin>", "remove <plugin>", "update <plugin>"

        Returns:
            List of Task objects to execute
        """
        stripped = input_data.strip()
        if not stripped:
            return [
                Task(
                    id="error",
                    description="Empty command",
                    input={"error": "Command cannot be empty"},
                )
            ]

        parts = stripped.split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""

        if command == "list":
            return [Task(id="list_plugins", description="List installed plugins", input={})]

        elif command == "install":
            if not args:
                return [
                    Task(
                        id="error",
                        description="install requires plugin name",
                        input={"error": "Plugin name required"},
                    )
                ]
            return [
                Task(
                    id="install_plugin",
                    description=f"Install plugin: {args}",
                    input={"plugin": args},
                )
            ]

        elif command == "remove":
            if not args:
                return [
                    Task(
                        id="error",
                        description="remove requires plugin name",
                        input={"error": "Plugin name required"},
                    )
                ]
            return [
                Task(
                    id="remove_plugin",
                    description=f"Remove plugin: {args}",
                    input={"plugin": args},
                )
            ]

        elif command == "update":
            plugin = args if args else "all"
            return [
                Task(
                    id="update_plugin",
                    description=f"Update plugin: {plugin}",
                    input={"plugin": plugin},
                )
            ]

        else:
            return [
                Task(
                    id="error",
                    description=f"Unknown command: {command}",
                    input={"error": f"Unknown command: {command}"},
                )
            ]

    def execute(self, task: Task) -> Result:
        """Execute plugin management task."""
        try:
            if task.id == "list_plugins":
                return self._list_plugins(task)
            elif task.id == "install_plugin":
                return self._install_plugin(task)
            elif task.id == "remove_plugin":
                return self._remove_plugin(task)
            elif task.id == "update_plugin":
                return self._update_plugin(task)
            elif task.id == "error":
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=task.input.get("error", "Unknown error"),
                )
            else:
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=f"Unknown task: {task.id}",
                )
        except Exception as e:
            return Result(task_id=task.id, success=False, output=None, error=str(e))

    def _ensure_registry_dir(self) -> None:
        """Ensure registry directory exists."""
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)

    def _read_registry(self) -> dict[str, Any]:
        """Read plugins registry from JSON file."""
        if not self.registry_path.exists():
            return {"plugins": {}}
        with open(self.registry_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_registry(self, registry: dict[str, Any]) -> None:
        """Write plugins registry to JSON file."""
        self._ensure_registry_dir()
        with open(self.registry_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2)

    def _list_plugins(self, task: Task) -> Result:
        """List all installed plugins."""
        registry = self._read_registry()
        plugins = registry.get("plugins", {})

        if not plugins:
            return Result(
                task_id=task.id,
                success=True,
                output="No plugins installed",
                error=None,
            )

        output_lines = ["Installed plugins:"]
        for name, info in plugins.items():
            version = info.get("version", "unknown")
            output_lines.append(f"  - {name}@{version}")

        return Result(task_id=task.id, success=True, output="\n".join(output_lines), error=None)

    def _install_plugin(self, task: Task) -> Result:
        """Install a new plugin."""
        plugin = task.input.get("plugin", "")
        if not plugin:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="Plugin name required",
            )

        registry = self._read_registry()
        plugins = registry.get("plugins", {})

        if plugin in plugins:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Plugin '{plugin}' is already installed",
            )

        # Simulate plugin installation (in real impl, this would fetch from registry)
        plugins[plugin] = {"version": "1.0.0", "installed_at": str(Path.cwd())}
        registry["plugins"] = plugins
        self._write_registry(registry)

        return Result(
            task_id=task.id,
            success=True,
            output=f"Successfully installed plugin: {plugin}@1.0.0",
            error=None,
        )

    def _remove_plugin(self, task: Task) -> Result:
        """Remove an installed plugin."""
        plugin = task.input.get("plugin", "")
        if not plugin:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="Plugin name required",
            )

        registry = self._read_registry()
        plugins = registry.get("plugins", {})

        if plugin not in plugins:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Plugin '{plugin}' is not installed",
            )

        del plugins[plugin]
        registry["plugins"] = plugins
        self._write_registry(registry)

        return Result(
            task_id=task.id,
            success=True,
            output=f"Successfully removed plugin: {plugin}",
            error=None,
        )

    def _update_plugin(self, task: Task) -> Result:
        """Update plugin(s) to latest version."""
        plugin = task.input.get("plugin", "all")

        registry = self._read_registry()
        plugins = registry.get("plugins", {})

        if not plugins:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No plugins installed",
            )

        if plugin != "all" and plugin not in plugins:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Plugin '{plugin}' is not installed",
            )

        updated = []
        target_plugins = [plugin] if plugin != "all" else list(plugins.keys())

        for name in target_plugins:
            if name in plugins:
                old_version = plugins[name].get("version", "unknown")
                plugins[name]["version"] = "1.0.0"  # Simulated update
                updated.append(f"{name}: {old_version} → 1.0.0")

        registry["plugins"] = plugins
        self._write_registry(registry)

        output = "Updated plugins:\n" + "\n".join(f"  - {u}" for u in updated)
        return Result(task_id=task.id, success=True, output=output, error=None)

    def _run_subprocess(self, cmd: list[str], task: Task) -> Result:
        """Run external subprocess (for real plugin installations)."""
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.cwd),
                capture_output=True,
                text=True,
                timeout=120,
            )
            output = result.stdout.strip() or result.stderr.strip()
            return Result(
                task_id=task.id,
                success=result.returncode == 0,
                output=output,
                error=result.stderr.strip() if result.returncode != 0 else None,
            )
        except subprocess.TimeoutExpired:
            return Result(task_id=task.id, success=False, output=None, error="Command timed out")
        except Exception as e:
            return Result(task_id=task.id, success=False, output=None, error=str(e))


__all__ = ["PluginAgent"]

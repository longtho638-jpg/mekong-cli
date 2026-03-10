"""
Mekong CLI - Dynamic Tool Registry (AGI v2)

Dynamic tool discovery, registration, and execution.
Supports auto-discovery from CLI --help, OpenAPI specs, and MCP servers.
Enables the AGI to expand its own capabilities at runtime.
"""

import json
import logging
import re
import subprocess
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import yaml  # type: ignore[import-untyped]

from .event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)


class ToolType(str, Enum):
    """Tool source types."""

    BUILTIN = "builtin"       # Hardcoded Python functions
    CLI = "cli"               # Discovered from CLI --help
    API = "api"               # Generated from OpenAPI spec
    MCP = "mcp"               # Connected via MCP protocol
    CUSTOM = "custom"         # User-defined


@dataclass
class ToolParameter:
    """Single parameter definition for a tool."""

    name: str
    description: str = ""
    type: str = "string"  # string | int | float | bool | list
    required: bool = False
    default: Any = None


@dataclass
class Tool:
    """A registered tool that the AGI can use."""

    name: str
    description: str
    tool_type: ToolType = ToolType.BUILTIN
    parameters: List[ToolParameter] = field(default_factory=list)
    command_template: str = ""  # For CLI tools: "git {subcommand} {args}"
    endpoint: str = ""          # For API tools: "POST /api/v1/deploy"
    tags: List[str] = field(default_factory=list)
    success_count: int = 0
    failure_count: int = 0
    avg_duration_ms: float = 0.0
    last_used: float = 0.0
    _handler: Optional[Callable[..., Any]] = field(
        default=None, repr=False,
    )

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.failure_count
        return self.success_count / total if total > 0 else 0.0

    @property
    def reliability(self) -> str:
        rate = self.success_rate
        if rate >= 0.9:
            return "high"
        if rate >= 0.6:
            return "medium"
        return "low"


class ToolRegistry:
    """
    Dynamic tool registry with auto-discovery.

    Manages all tools available to the AGI system. Supports:
    - Manual registration of Python functions
    - Auto-discovery from CLI help output
    - OpenAPI spec parsing → tool generation
    - MCP server connections
    """

    MAX_TOOLS: int = 200

    def __init__(self, persist_path: Optional[str] = None) -> None:
        """Initialize tool registry."""
        self._tools: Dict[str, Tool] = {}
        self._persist_path = Path(
            persist_path or ".mekong/tool_registry.yaml",
        )
        self._load()
        self._register_builtins()

    def register(
        self,
        name: str,
        description: str,
        tool_type: ToolType = ToolType.CUSTOM,
        parameters: Optional[List[ToolParameter]] = None,
        command_template: str = "",
        handler: Optional[Callable[..., Any]] = None,
        tags: Optional[List[str]] = None,
    ) -> Tool:
        """
        Register a new tool.

        Args:
            name: Unique tool name.
            description: What the tool does.
            tool_type: Source type (builtin, cli, api, etc.).
            parameters: Parameter definitions.
            command_template: Shell command template for CLI tools.
            handler: Python callable for builtin tools.
            tags: Tags for categorization.

        Returns:
            Registered Tool object.
        """
        tool = Tool(
            name=name,
            description=description,
            tool_type=tool_type,
            parameters=parameters or [],
            command_template=command_template,
            tags=tags or [],
            _handler=handler,
        )
        self._tools[name] = tool
        self._persist()

        bus = get_event_bus()
        bus.emit(EventType.AUTONOMOUS_CYCLE, {
            "event": "tool_registered",
            "name": name,
            "type": tool_type.value,
        })

        return tool

    def unregister(self, name: str) -> bool:
        """Remove a tool. Returns True if found."""
        if name in self._tools:
            del self._tools[name]
            self._persist()
            return True
        return False

    def get(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self._tools.get(name)

    def search(
        self,
        query: str,
        tool_type: Optional[ToolType] = None,
        tags: Optional[List[str]] = None,
    ) -> List[Tool]:
        """
        Search tools by name, description, or tags.

        Args:
            query: Search string.
            tool_type: Optional type filter.
            tags: Optional tag filter (any match).

        Returns:
            List of matching Tools.
        """
        query_lower = query.lower()
        results: List[Tool] = []

        for tool in self._tools.values():
            # Type filter
            if tool_type and tool.tool_type != tool_type:
                continue

            # Tag filter
            if tags and not any(t in tool.tags for t in tags):
                continue

            # Text match
            if (
                query_lower in tool.name.lower()
                or query_lower in tool.description.lower()
                or any(query_lower in tag.lower() for tag in tool.tags)
            ):
                results.append(tool)

        # Sort by reliability
        results.sort(key=lambda t: t.success_rate, reverse=True)
        return results

    def execute(
        self,
        name: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Execute a tool by name.

        Args:
            name: Tool name.
            params: Parameters to pass.

        Returns:
            Dict with 'success', 'output', 'duration_ms'.
        """
        tool = self._tools.get(name)
        if not tool:
            return {
                "success": False,
                "output": f"Tool '{name}' not found",
                "duration_ms": 0,
            }

        start = time.time()
        params = params or {}

        try:
            output = ""
            if tool._handler:
                # Python callable
                result = tool._handler(**params)
                output = str(result)
            elif tool.command_template:
                # Shell command
                cmd = tool.command_template.format(**params)
                proc = subprocess.run(
                    cmd, shell=True, capture_output=True, text=True,
                    timeout=30,
                )
                output = proc.stdout or proc.stderr
                if proc.returncode != 0:
                    raise RuntimeError(f"Exit code {proc.returncode}: {output}")
            else:
                output = f"Tool '{name}' has no handler or command template"
                raise RuntimeError(output)

            duration = (time.time() - start) * 1000
            tool.success_count += 1
            tool.last_used = time.time()
            self._update_avg_duration(tool, duration)
            self._persist()

            return {
                "success": True,
                "output": output.strip(),
                "duration_ms": duration,
            }

        except Exception as e:
            duration = (time.time() - start) * 1000
            tool.failure_count += 1
            tool.last_used = time.time()
            self._persist()

            return {
                "success": False,
                "output": str(e),
                "duration_ms": duration,
            }

    def discover_from_cli(self, command: str) -> List[Tool]:
        """
        Auto-discover tools from a CLI's --help output.

        Parses the help text to extract subcommands and options.

        Args:
            command: CLI command (e.g., "git", "docker", "npm").

        Returns:
            List of discovered and registered Tools.
        """
        discovered: List[Tool] = []

        try:
            result = subprocess.run(
                f"{command} --help", shell=True,
                capture_output=True, text=True, timeout=10,
            )
            help_text = result.stdout or result.stderr
        except Exception:
            return []

        if not help_text:
            return []

        # Parse subcommands from help text
        subcommands = self._parse_help_subcommands(help_text)
        for subcmd, desc in subcommands:
            tool_name = f"{command}:{subcmd}"
            if tool_name not in self._tools:
                tool = self.register(
                    name=tool_name,
                    description=desc,
                    tool_type=ToolType.CLI,
                    command_template=f"{command} {subcmd} {{args}}",
                    tags=[command, "cli", "auto-discovered"],
                    parameters=[ToolParameter(
                        name="args", description="Additional arguments",
                    )],
                )
                discovered.append(tool)

        return discovered

    def discover_from_openapi(self, spec: Dict[str, Any]) -> List[Tool]:
        """
        Generate tools from an OpenAPI specification.

        Args:
            spec: Parsed OpenAPI spec dict.

        Returns:
            List of discovered Tools.
        """
        discovered: List[Tool] = []
        paths = spec.get("paths", {})
        base_url = ""

        # Extract base URL
        servers = spec.get("servers", [])
        if servers:
            base_url = servers[0].get("url", "")

        for path, methods in paths.items():
            for method, details in methods.items():
                if method.lower() not in ("get", "post", "put", "delete", "patch"):
                    continue

                operation_id = details.get(
                    "operationId",
                    f"{method}_{path.replace('/', '_')}",
                )
                summary = details.get("summary", details.get("description", ""))

                # Extract parameters
                params = []
                for param in details.get("parameters", []):
                    params.append(ToolParameter(
                        name=param.get("name", ""),
                        description=param.get("description", ""),
                        type=param.get("schema", {}).get("type", "string"),
                        required=param.get("required", False),
                    ))

                tool_name = f"api:{operation_id}"
                tool = self.register(
                    name=tool_name,
                    description=summary,
                    tool_type=ToolType.API,
                    parameters=params,
                    tags=["api", "openapi", "auto-discovered"],
                )
                tool.endpoint = f"{method.upper()} {base_url}{path}"
                discovered.append(tool)

        return discovered

    def list_tools(
        self,
        tool_type: Optional[ToolType] = None,
    ) -> List[Tool]:
        """List all registered tools, optionally filtered by type."""
        tools = list(self._tools.values())
        if tool_type:
            tools = [t for t in tools if t.tool_type == tool_type]
        return tools

    def get_stats(self) -> Dict[str, Any]:
        """Return registry statistics."""
        type_counts: Dict[str, int] = {}
        for tool in self._tools.values():
            t = tool.tool_type.value
            type_counts[t] = type_counts.get(t, 0) + 1

        total_executions = sum(
            t.success_count + t.failure_count for t in self._tools.values()
        )
        total_success = sum(t.success_count for t in self._tools.values())

        return {
            "total_tools": len(self._tools),
            "type_counts": type_counts,
            "total_executions": total_executions,
            "overall_success_rate": (
                total_success / total_executions if total_executions > 0 else 0
            ),
        }

    def suggest_tool(self, goal: str) -> Optional[Tool]:
        """
        Suggest the best tool for a given goal.

        Uses keyword matching and success rate to rank tools.
        """
        candidates = self.search(goal)
        if not candidates:
            return None
        # Prefer high reliability tools
        return candidates[0]

    # --- Internal helpers ---

    def _register_builtins(self) -> None:
        """Register built-in tools if not already present."""
        builtins = [
            ("shell:run", "Execute a shell command", "sh -c '{command}'"),
            ("file:read", "Read file contents", "cat {path}"),
            ("file:write", "Write content to file", "echo '{content}' > {path}"),
            ("file:list", "List directory contents", "ls -la {path}"),
            ("git:status", "Show git status", "git status"),
            ("git:diff", "Show git diff", "git diff {args}"),
            ("git:log", "Show git log", "git log --oneline -n {count}"),
        ]
        for name, desc, template in builtins:
            if name not in self._tools:
                self.register(
                    name=name,
                    description=desc,
                    tool_type=ToolType.BUILTIN,
                    command_template=template,
                    tags=["builtin"],
                )

    def _parse_help_subcommands(
        self, help_text: str,
    ) -> List[tuple]:
        """Parse subcommands from --help output."""
        subcommands: List[tuple] = []
        # Common help format: "  subcommand    Description text"
        pattern = re.compile(r"^\s{2,}(\w[\w-]*)\s{2,}(.+)$", re.MULTILINE)
        for match in pattern.finditer(help_text):
            subcmd = match.group(1)
            desc = match.group(2).strip()
            # Skip common non-command entries
            if subcmd.lower() not in ("options", "usage", "examples", "see"):
                subcommands.append((subcmd, desc))
        return subcommands[:30]  # Limit

    def _update_avg_duration(self, tool: Tool, duration: float) -> None:
        """Update rolling average duration."""
        total = tool.success_count + tool.failure_count
        if total <= 1:
            tool.avg_duration_ms = duration
        else:
            tool.avg_duration_ms = (
                tool.avg_duration_ms * (total - 1) + duration
            ) / total

    def _persist(self) -> None:
        """Save registry to YAML."""
        self._persist_path.parent.mkdir(parents=True, exist_ok=True)
        data = {}
        for name, tool in self._tools.items():
            data[name] = {
                "description": tool.description,
                "tool_type": tool.tool_type.value,
                "command_template": tool.command_template,
                "endpoint": tool.endpoint,
                "tags": tool.tags,
                "success_count": tool.success_count,
                "failure_count": tool.failure_count,
                "parameters": [
                    {
                        "name": p.name,
                        "description": p.description,
                        "type": p.type,
                        "required": p.required,
                    }
                    for p in tool.parameters
                ],
            }
        self._persist_path.write_text(yaml.dump(data, default_flow_style=False))

    def _load(self) -> None:
        """Load registry from YAML."""
        if not self._persist_path.exists():
            return
        try:
            data = yaml.safe_load(self._persist_path.read_text()) or {}
            for name, info in data.items():
                try:
                    tool_type = ToolType(info.get("tool_type", "custom"))
                except ValueError:
                    tool_type = ToolType.CUSTOM
                params = [
                    ToolParameter(**p)
                    for p in info.get("parameters", [])
                ]
                self._tools[name] = Tool(
                    name=name,
                    description=info.get("description", ""),
                    tool_type=tool_type,
                    command_template=info.get("command_template", ""),
                    endpoint=info.get("endpoint", ""),
                    tags=info.get("tags", []),
                    success_count=info.get("success_count", 0),
                    failure_count=info.get("failure_count", 0),
                    parameters=params,
                )
        except Exception:
            pass


__all__ = [
    "Tool",
    "ToolParameter",
    "ToolRegistry",
    "ToolType",
]

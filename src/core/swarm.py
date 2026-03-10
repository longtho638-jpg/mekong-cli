"""Mekong CLI - Swarm Registry.

Multi-node orchestration for distributed Mekong gateways.
Manages a registry of remote nodes with health checking.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests  # type: ignore[import-untyped]


@dataclass
class SwarmNode:
    """A registered remote Mekong gateway node."""

    id: str
    name: str
    host: str
    port: int
    token: str
    status: str = "unknown"
    last_heartbeat: float = 0.0


class SwarmRegistry:
    """Registry of Mekong gateway nodes forming a swarm."""

    def __init__(self, config_path: str | None = None) -> None:
        """Initialize SwarmRegistry and load persisted nodes from disk.

        Args:
            config_path: Path to the YAML config file. Defaults to .mekong/swarm.yaml.

        """
        self._nodes: dict[str, SwarmNode] = {}
        self._config_path = config_path or str(
            Path(".mekong") / "swarm.yaml",
        )
        self._load()

    def register_node(
        self, name: str, host: str, port: int, token: str,
    ) -> SwarmNode:
        """Register a new node in the swarm."""
        node_id = uuid.uuid4().hex[:8]
        node = SwarmNode(
            id=node_id, name=name, host=host, port=port, token=token,
        )
        self._nodes[node_id] = node
        self._save()
        return node

    def remove_node(self, node_id: str) -> bool:
        """Remove a node from the swarm. Returns True if found."""
        if node_id in self._nodes:
            del self._nodes[node_id]
            self._save()
            return True
        return False

    def list_nodes(self) -> list[SwarmNode]:
        """Return all registered nodes."""
        return list(self._nodes.values())

    def get_node(self, node_id: str) -> SwarmNode | None:
        """Get a node by ID."""
        return self._nodes.get(node_id)

    def check_health(self, node: SwarmNode, timeout: float = 3.0) -> str:
        """Check a single node's health via GET /health."""
        url = f"http://{node.host}:{node.port}/health"
        try:
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 200:
                node.status = "healthy"
            else:
                node.status = "unhealthy"
        except requests.RequestException:
            node.status = "unreachable"
        node.last_heartbeat = time.time()
        return node.status

    def check_all_health(self, timeout: float = 3.0) -> dict[str, str]:
        """Run health checks on all registered nodes."""
        results: dict[str, str] = {}
        for node in self._nodes.values():
            results[node.id] = self.check_health(node, timeout)
        self._save()
        return results

    def dispatch_goal(
        self, node_id: str, goal: str, timeout: float = 60.0,
    ) -> dict[str, Any]:
        """Send a goal to a remote node via POST /cmd."""
        node = self.get_node(node_id)
        if not node:
            return {"error": f"Node {node_id} not found"}

        url = f"http://{node.host}:{node.port}/cmd"
        try:
            resp = requests.post(
                url,
                json={"goal": goal, "token": node.token},
                timeout=timeout,
            )
            return dict(resp.json())
        except requests.RequestException as e:
            return {"error": str(e)}

    def _save(self) -> None:
        """Persist registry to YAML file."""
        path = Path(self._config_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        lines = ["# Mekong Swarm Registry\nnodes:\n"]
        for node in self._nodes.values():
            lines.append(f"  - id: {node.id}\n")
            lines.append(f"    name: {node.name}\n")
            lines.append(f"    host: {node.host}\n")
            lines.append(f"    port: {node.port}\n")
            lines.append(f"    token: {node.token}\n")
            lines.append(f"    status: {node.status}\n")
            lines.append(f"    last_heartbeat: {node.last_heartbeat}\n")
        path.write_text("".join(lines), encoding="utf-8")

    def _load(self) -> None:
        """Load registry from YAML file if it exists."""
        path = Path(self._config_path)
        if not path.exists():
            return

        try:
            import yaml  # type: ignore[import-untyped]
        except ImportError:
            return

        try:
            raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        except Exception:
            return

        for entry in raw.get("nodes") or []:
            node = SwarmNode(
                id=str(entry.get("id", "")),
                name=str(entry.get("name", "")),
                host=str(entry.get("host", "")),
                port=int(entry.get("port", 8000)),
                token=str(entry.get("token", "")),
                status=str(entry.get("status", "unknown")),
                last_heartbeat=float(entry.get("last_heartbeat", 0.0)),
            )
            if node.id:
                self._nodes[node.id] = node


class SwarmDispatcher:
    """Dispatches RecipeStep tasks to local agents or remote swarm nodes.

    Routing logic:
    - If healthy remote nodes exist, dispatch to first available (V1: round-robin not needed)
    - Fallback to local agent execution when no healthy nodes

    Local agent routing:
    - step type "git"   -> GitAgent
    - step type "file"  -> FileAgent
    - step type "shell" -> ShellAgent (default)
    """

    # Map step type keywords to agent class names
    _AGENT_TYPE_MAP: dict[str, str] = {
        "git": "git",
        "file": "file",
        "shell": "shell",
    }

    def __init__(self, registry: SwarmRegistry) -> None:
        self.registry = registry
        self._local_agents: dict[str, Any] = {}
        self._init_local_agents()

    def _init_local_agents(self) -> None:
        """Lazy-load local agents to avoid circular imports."""
        try:
            from src.agents.file_agent import FileAgent
            from src.agents.git_agent import GitAgent
            from src.agents.shell_agent import ShellAgent
            self._local_agents = {
                "git": GitAgent(),
                "file": FileAgent(),
                "shell": ShellAgent(),
            }
        except ImportError:
            self._local_agents = {}

    def get_healthy_nodes(self) -> list[SwarmNode]:
        """Return all nodes with status='healthy'."""
        return [n for n in self.registry.list_nodes() if n.status == "healthy"]

    def _route_step(self, step: Any) -> str:
        """Determine agent type from step params or description.

        Returns one of: 'git', 'file', 'shell'
        """
        params = getattr(step, "params", None) or {}
        step_type = str(params.get("type", "")).lower()
        if step_type in self._AGENT_TYPE_MAP:
            return self._AGENT_TYPE_MAP[step_type]

        # Fallback: infer from description keywords
        description = str(getattr(step, "description", "")).lower()
        if any(kw in description for kw in ("git ", "commit", "branch", "diff", "status")):
            return "git"
        if any(kw in description for kw in ("read file", "write file", "find file", "grep")):
            return "file"
        return "shell"

    def _dispatch_local(self, step: Any, agent_type: str) -> Any:
        """Execute step using local agent. Returns ExecutionResult."""
        agent = self._local_agents.get(agent_type) or self._local_agents.get("shell")
        if agent is None:
            # No agents available — return minimal failure result
            from .verifier import ExecutionResult
            return ExecutionResult(exit_code=1, stdout="", stderr="No local agent available")

        from .agent_base import Task
        description = getattr(step, "description", "")
        params = getattr(step, "params", None) or {}
        # ShellAgent reads command from input["command"]
        task_input = dict(params)
        if "command" not in task_input:
            task_input["command"] = description
        task = Task(
            id="swarm-dispatch",
            description=description,
            input=task_input,
        )
        result = agent.execute(task)

        # Convert Result -> ExecutionResult
        from .verifier import ExecutionResult
        return ExecutionResult(
            exit_code=0 if result.success else 1,
            stdout=result.output or "",
            stderr=result.error or "",
        )

    def _dispatch_remote(self, step: Any, node: SwarmNode) -> Any:
        """Send step to remote node via POST /cmd. Returns ExecutionResult."""
        from .verifier import ExecutionResult
        url = f"http://{node.host}:{node.port}/cmd"
        try:
            resp = requests.post(
                url,
                json={"goal": getattr(step, "description", ""), "token": node.token},
                timeout=60.0,
            )
            data = resp.json()
            return ExecutionResult(
                exit_code=0 if data.get("status") == "success" else 1,
                stdout=str(data.get("result", "")),
                stderr=str(data.get("error", "")),
            )
        except requests.RequestException as e:
            return ExecutionResult(exit_code=1, stdout="", stderr=str(e))

    def dispatch(self, step: Any) -> Any:
        """Dispatch a single RecipeStep. Returns ExecutionResult.

        Priority: healthy remote node -> local agent fallback.
        """
        agent_type = self._route_step(step)
        healthy = self.get_healthy_nodes()
        if healthy:
            return self._dispatch_remote(step, healthy[0])
        return self._dispatch_local(step, agent_type)


__all__ = ["SwarmDispatcher", "SwarmNode", "SwarmRegistry"]

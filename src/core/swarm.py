"""
Mekong CLI - Swarm Registry

Multi-node orchestration for distributed Mekong gateways.
Manages a registry of remote nodes with health checking.
"""

import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import requests


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

    def __init__(self, config_path: Optional[str] = None):
        self._nodes: Dict[str, SwarmNode] = {}
        self._config_path = config_path or str(
            Path(".mekong") / "swarm.yaml"
        )
        self._load()

    def register_node(
        self, name: str, host: str, port: int, token: str
    ) -> SwarmNode:
        """Register a new node in the swarm."""
        node_id = uuid.uuid4().hex[:8]
        node = SwarmNode(
            id=node_id, name=name, host=host, port=port, token=token
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

    def list_nodes(self) -> List[SwarmNode]:
        """Return all registered nodes."""
        return list(self._nodes.values())

    def get_node(self, node_id: str) -> Optional[SwarmNode]:
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

    def check_all_health(self, timeout: float = 3.0) -> Dict[str, str]:
        """Run health checks on all registered nodes."""
        results: Dict[str, str] = {}
        for node in self._nodes.values():
            results[node.id] = self.check_health(node, timeout)
        self._save()
        return results

    def dispatch_goal(
        self, node_id: str, goal: str, timeout: float = 60.0
    ) -> dict:
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
            return resp.json()
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


__all__ = ["SwarmNode", "SwarmRegistry"]

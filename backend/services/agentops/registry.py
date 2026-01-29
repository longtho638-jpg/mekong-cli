"""
AgentOps Registry - Management of ops and agent counts
"""

import os
from typing import Dict

from backend.models.agentops import OpsStatus

from .enums import OpsCategory


class OpsRegistry:
    """Manages the registration and discovery of AgentOps modules."""

    def __init__(self):
        self.ops_registry: Dict[str, OpsStatus] = {}
        self._initialize_ops_registry()

    def _initialize_ops_registry(self):
        """Initialize all ops from enum"""
        base_path = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        )

        for ops in OpsCategory:
            agents_count = self._count_agents(ops.value, base_path)
            self.ops_registry[ops.value] = OpsStatus(
                name=ops.name.replace("_", " ").title(),
                category=ops.value,
                status="ready",
                agents_count=agents_count,
            )

    def _count_agents(self, ops_name: str, base_path: str) -> int:
        """Count agents in an ops directory"""
        ops_path = os.path.join(base_path, "backend", "agents", ops_name)

        if os.path.exists(ops_path):
            py_files = [f for f in os.listdir(ops_path) if f.endswith(".py") and f != "__init__.py"]
            return len(py_files)
        return 0

    def get_registry(self) -> Dict[str, OpsStatus]:
        return self.ops_registry

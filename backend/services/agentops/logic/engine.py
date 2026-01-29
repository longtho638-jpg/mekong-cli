"""
AgentOps Service core logic and registry.
"""

import logging
import os
from typing import Any, Dict

from backend.models.agentops import OpsStatus

from .enums import OpsCategory

logger = logging.getLogger(__name__)


class AgentOpsEngine:
    def __init__(self):
        self.ops_registry: Dict[str, OpsStatus] = {}
        self._initialize_ops_registry()

    def _initialize_ops_registry(self):
        base_path = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        )
        for ops in OpsCategory:
            self.ops_registry[ops.value] = OpsStatus(
                name=ops.name.replace("_", " ").title(),
                category=ops.value,
                status="ready",
                agents_count=self._count_agents(ops.value, base_path),
            )

    def _count_agents(self, ops_name: str, base_path: str) -> int:
        ops_path = os.path.join(base_path, "backend", "agents", ops_name)
        if os.path.exists(ops_path):
            return len(
                [f for f in os.listdir(ops_path) if f.endswith(".py") and f != "__init__.py"]
            )
        return 0

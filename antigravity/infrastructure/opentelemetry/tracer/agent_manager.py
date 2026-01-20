"""
OpenTelemetry Agent Manager Module
==================================

Agent registration and management functionality for DistributedTracer.
Extracted from tracer.py for modularization.
"""

import logging
from typing import TYPE_CHECKING, Any, Dict, List, Optional

if TYPE_CHECKING:
    from ..tracing_agent import TracingAgent

logger = logging.getLogger(__name__)


class AgentManagerMixin:
    """Mixin providing agent management functionality for DistributedTracer.

    Handles:
    - Default agent registration
    - Custom agent creation and registration
    - Agent lifecycle management
    """

    # Type hints for attributes from main class
    agent_registry: Dict[str, Any]

    def _register_default_agents(self) -> None:
        """Register default tracing agents for common services."""
        from ..tracing_agent import TracingAgent

        # Payment processor agent
        self.agent_registry["payment_processor"] = TracingAgent(
            name="payment_processor",
            operations=["create", "process", "refund", "cancel"],
            critical_operations=["create", "process", "refund"],
            tracing_system=self
        )

        # User service agent
        self.agent_registry["user_service"] = TracingAgent(
            name="user_service",
            operations=["authenticate", "authorize", "profile", "preferences"],
            critical_operations=["authenticate", "authorize"],
            tracing_system=self
        )

        # Queue processor agent
        self.agent_registry["queue_processor"] = TracingAgent(
            name="queue_processor",
            operations=["submit", "complete", "fail", "timeout"],
            critical_operations=["submit", "complete"],
            tracing_system=self
        )

        # AI processor agent
        self.agent_registry["ai_processor"] = TracingAgent(
            name="ai_processor",
            operations=["inference", "optimize", "train"],
            critical_operations=["inference"],
            tracing_system=self
        )

        logger.info(f"Registered {len(self.agent_registry)} tracing agents")

    def create_tracing_agent(
        self,
        name: str,
        operations: List[str],
        critical_operations: Optional[List[str]] = None
    ) -> "TracingAgent":
        """Create tracing agent with specific operations.

        Args:
            name: Unique agent name
            operations: List of operations the agent handles
            critical_operations: Subset requiring enhanced tracing

        Returns:
            New TracingAgent instance
        """
        from ..tracing_agent import TracingAgent

        return TracingAgent(
            name=name,
            operations=operations,
            critical_operations=critical_operations or [],
            tracing_system=self
        )

    def register_tracing_agent(self, agent_config: Dict[str, Any]) -> None:
        """Register custom tracing agent.

        Args:
            agent_config: Agent configuration dictionary with:
                - name: Agent name (required)
                - operations: List of operations (default: [])
                - critical_operations: Critical ops list (default: [])
        """
        from ..tracing_agent import TracingAgent

        name = agent_config.get("name")
        if not name:
            raise ValueError("Agent config must include 'name'")

        agent = TracingAgent(
            name=name,
            operations=agent_config.get("operations", []),
            critical_operations=agent_config.get("critical_operations", []),
            tracing_system=self
        )

        self.agent_registry[name] = agent
        logger.info(f"Registered custom tracing agent: {name}")


__all__ = ["AgentManagerMixin"]

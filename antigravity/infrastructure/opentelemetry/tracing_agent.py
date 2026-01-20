"""
OpenTelemetry Tracing Agent Module
==================================

Tracing agent implementation for distributed tracing with operation-level
monitoring and lifecycle management.

A TracingAgent represents a service or component that can be traced. It
registers supported operations and tracks critical operations that require
higher sampling rates or special handling.
"""

import time
import logging
from typing import List, Optional, Any, TYPE_CHECKING

if TYPE_CHECKING:
    # Avoid circular import - only import for type hints
    from .span import Span

logger = logging.getLogger(__name__)


class TracingAgent:
    """Tracing agent for distributed operation monitoring.

    A TracingAgent represents a traceable component within the system. Each agent
    registers the operations it supports and identifies which operations are
    critical (e.g., payment processing, authentication).

    Attributes:
        name: Unique identifier for this agent
        operations: List of operation names this agent can perform
        critical_operations: Subset of operations requiring enhanced tracing
        tracing_system: Optional reference to parent DistributedTracer
        active: Whether this agent is currently active
        shutdown_requested: Flag to signal shutdown
    """

    def __init__(
        self,
        name: str,
        operations: List[str],
        critical_operations: Optional[List[str]] = None,
        tracing_system: Optional[Any] = None
    ):
        """Initialize a new tracing agent.

        Args:
            name: Unique agent identifier (e.g., "payment_processor")
            operations: List of operations this agent handles
            critical_operations: Operations requiring enhanced tracing (default [])
            tracing_system: Optional parent DistributedTracer reference
        """
        self.name = name
        self.operations = operations
        self.critical_operations = critical_operations or []
        self.tracing_system = tracing_system
        self.active = True
        self.shutdown_requested = False

        # Internal tracking
        self._operation_counts: dict = {op: 0 for op in operations}
        self._error_counts: dict = {op: 0 for op in operations}
        self._last_activity: float = time.time()
        self._active_spans: dict = {}

        logger.debug(
            f"Initialized TracingAgent '{name}' with {len(operations)} operations, "
            f"{len(self.critical_operations)} critical"
        )

    def is_critical_operation(self, operation_name: str) -> bool:
        """Check if an operation is marked as critical.

        Args:
            operation_name: Name of the operation to check

        Returns:
            True if operation is in critical_operations list
        """
        return operation_name in self.critical_operations

    def is_supported_operation(self, operation_name: str) -> bool:
        """Check if agent supports an operation.

        Args:
            operation_name: Name of the operation to check

        Returns:
            True if operation is supported by this agent
        """
        return operation_name in self.operations

    def record_operation(
        self,
        operation_name: str,
        success: bool = True
    ) -> None:
        """Record an operation execution for analytics.

        Args:
            operation_name: Name of the operation executed
            success: Whether the operation succeeded
        """
        if operation_name in self._operation_counts:
            self._operation_counts[operation_name] += 1
            if not success:
                self._error_counts[operation_name] += 1

        self._last_activity = time.time()

    def register_span(self, span_id: str, span: 'Span') -> None:
        """Register an active span for this agent.

        Args:
            span_id: Unique span identifier
            span: The span object
        """
        self._active_spans[span_id] = span
        self._last_activity = time.time()

    def unregister_span(self, span_id: str) -> None:
        """Remove a completed span from tracking.

        Args:
            span_id: Unique span identifier to remove
        """
        if span_id in self._active_spans:
            del self._active_spans[span_id]

    def get_active_span_count(self) -> int:
        """Get count of currently active spans.

        Returns:
            Number of active spans for this agent
        """
        return len(self._active_spans)

    def get_operation_stats(self) -> dict:
        """Get operation statistics for this agent.

        Returns:
            Dictionary with operation counts and error rates
        """
        stats = {}
        for op in self.operations:
            total = self._operation_counts.get(op, 0)
            errors = self._error_counts.get(op, 0)
            error_rate = (errors / total * 100) if total > 0 else 0.0

            stats[op] = {
                "total_count": total,
                "error_count": errors,
                "error_rate_percent": round(error_rate, 2),
                "is_critical": op in self.critical_operations
            }

        return stats

    def get_health_status(self) -> dict:
        """Get health status of this agent.

        Returns:
            Dictionary with health metrics
        """
        total_ops = sum(self._operation_counts.values())
        total_errors = sum(self._error_counts.values())
        error_rate = (total_errors / total_ops * 100) if total_ops > 0 else 0.0

        return {
            "name": self.name,
            "active": self.active,
            "shutdown_requested": self.shutdown_requested,
            "total_operations": total_ops,
            "total_errors": total_errors,
            "error_rate_percent": round(error_rate, 2),
            "active_spans": len(self._active_spans),
            "last_activity": self._last_activity,
            "seconds_since_activity": round(time.time() - self._last_activity, 2)
        }

    def activate(self) -> None:
        """Activate this agent for tracing."""
        self.active = True
        self.shutdown_requested = False
        logger.info(f"TracingAgent '{self.name}' activated")

    def deactivate(self) -> None:
        """Deactivate this agent (stop accepting new operations)."""
        self.active = False
        logger.info(f"TracingAgent '{self.name}' deactivated")

    def shutdown(self) -> None:
        """Gracefully shutdown this tracing agent.

        Sets shutdown flag and deactivates agent. Active spans will
        continue until completion but no new operations accepted.
        """
        self.shutdown_requested = True
        self.active = False

        # Log any remaining active spans
        if self._active_spans:
            logger.warning(
                f"TracingAgent '{self.name}' shutting down with "
                f"{len(self._active_spans)} active spans"
            )

        logger.info(f"TracingAgent '{self.name}' shutdown complete")

    def to_dict(self) -> dict:
        """Convert agent to dictionary for serialization.

        Returns:
            Dictionary representation of the agent
        """
        return {
            "name": self.name,
            "operations": self.operations,
            "critical_operations": self.critical_operations,
            "active": self.active,
            "shutdown_requested": self.shutdown_requested,
            "active_spans": len(self._active_spans),
            "stats": self.get_operation_stats()
        }

    def __repr__(self) -> str:
        return (
            f"TracingAgent(name='{self.name}', "
            f"operations={len(self.operations)}, "
            f"active={self.active})"
        )


__all__ = ["TracingAgent"]

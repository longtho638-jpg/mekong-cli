"""
Tracing Agent stats and lifecycle management.
"""
import logging
import time

from .agent import TracingAgentCore

logger = logging.getLogger(__name__)

class TracingAgent(TracingAgentCore):
    def get_operation_stats(self) -> dict:
        stats = {}
        for op in self.operations:
            total = self._operation_counts.get(op, 0)
            errors = self._error_counts.get(op, 0)
            rate = (errors / total * 100) if total > 0 else 0.0
            stats[op] = {"total_count": total, "error_count": errors, "error_rate_percent": round(rate, 2), "is_critical": op in self.critical_operations}
        return stats

    def get_health_status(self) -> dict:
        total_ops = sum(self._operation_counts.values())
        total_errors = sum(self._error_counts.values())
        rate = (total_errors / total_ops * 100) if total_ops > 0 else 0.0
        return {"name": self.name, "active": self.active, "total_operations": total_ops, "error_rate_percent": round(rate, 2), "active_spans": len(self._active_spans)}

    def activate(self) -> None:
        self.active = True
        self.shutdown_requested = False
        logger.info(f"TracingAgent '{self.name}' activated")

    def deactivate(self) -> None:
        self.active = False
        logger.info(f"TracingAgent '{self.name}' deactivated")

    def shutdown(self) -> None:
        self.shutdown_requested = True
        self.active = False
        logger.info(f"TracingAgent '{self.name}' shutdown complete")

    def to_dict(self) -> dict:
        return {"name": self.name, "operations": self.operations, "active": self.active, "stats": self.get_operation_stats()}

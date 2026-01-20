"""
Tracing agent core implementation.
"""
import logging
import time
from typing import TYPE_CHECKING, Any, List, Optional

if TYPE_CHECKING:
    from ..span import Span

logger = logging.getLogger(__name__)

class TracingAgentCore:
    def __init__(
        self,
        name: str,
        operations: List[str],
        critical_operations: Optional[List[str]] = None,
        tracing_system: Optional[Any] = None
    ):
        self.name = name
        self.operations = operations
        self.critical_operations = critical_operations or []
        self.tracing_system = tracing_system
        self.active = True
        self.shutdown_requested = False

        self._operation_counts: dict = {op: 0 for op in operations}
        self._error_counts: dict = {op: 0 for op in operations}
        self._last_activity: float = time.time()
        self._active_spans: dict = {}

        logger.debug(f"Initialized TracingAgent '{name}'")

    def is_critical_operation(self, operation_name: str) -> bool:
        return operation_name in self.critical_operations

    def is_supported_operation(self, operation_name: str) -> bool:
        return operation_name in self.operations

    def record_operation(self, operation_name: str, success: bool = True) -> None:
        if operation_name in self._operation_counts:
            self._operation_counts[operation_name] += 1
            if not success: self._error_counts[operation_name] += 1
        self._last_activity = time.time()

    def register_span(self, span_id: str, span: 'Span') -> None:
        self._active_spans[span_id] = span
        self._last_activity = time.time()

    def unregister_span(self, span_id: str) -> None:
        if span_id in self._active_spans: del self._active_spans[span_id]

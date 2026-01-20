"""Export processing and performance analysis for distributed tracing."""

import time
import logging
from typing import Dict, Any, List, Optional, Callable
from collections import deque

from .base import BaseProcessor

logger = logging.getLogger(__name__)


class ExportLoopProcessor(BaseProcessor):
    """Background processor for exporting telemetry data."""

    def __init__(
        self,
        export_queue: deque,
        active_spans: Dict[str, Any],
        completed_spans: List[Dict[str, Any]],
        export_callback: Optional[Callable[[Dict[str, Any]], bool]] = None,
        interval_seconds: float = 60.0
    ):
        """Initialize export processor with queue and callback."""
        super().__init__("ExportProcessor", interval_seconds)
        self.export_queue = export_queue
        self.active_spans = active_spans
        self.completed_spans = completed_spans
        self.export_callback = export_callback
        self._retention_seconds = 3600  # 1 hour

    def process(self) -> None:
        """Process export batch."""
        export_batch: Optional[List[Dict[str, Any]]] = None

        with self._lock:
            if self.export_queue:
                export_batch = []
                while self.export_queue and len(export_batch) < 100:
                    try:
                        export_batch.append(self.export_queue.popleft())
                    except IndexError:
                        break

        if export_batch:
            logger.info(f"Processing export batch of {len(export_batch)} spans")

            for span_dict in export_batch:
                try:
                    if self.export_callback:
                        success = self.export_callback(span_dict)
                        if success:
                            span_dict["exported"] = True
                    else:
                        span_dict["exported"] = True

                    trace_id = span_dict.get("trace_id")
                    if trace_id and trace_id in self.active_spans:
                        del self.active_spans[trace_id]

                except Exception as e:
                    logger.error(f"Error exporting span: {e}")
                    span_dict["export_error"] = str(e)

            self.completed_spans.extend(export_batch)
            self._cleanup_old_spans()
            logger.debug(f"Exported {len(export_batch)} spans")

    def _cleanup_old_spans(self) -> None:
        """Remove spans older than retention period."""
        current_time = time.time()
        cutoff_time = current_time - self._retention_seconds

        with self._lock:
            valid_spans: List[Dict[str, Any]] = []
            for s in self.completed_spans:
                if isinstance(s, dict):
                    end_time = s.get("end_time", current_time)
                else:
                    end_time = getattr(s, "end_time", current_time)

                if end_time is None or end_time > cutoff_time:
                    valid_spans.append(s)

            self.completed_spans.clear()
            self.completed_spans.extend(valid_spans)


class PerformanceAnalyzer(BaseProcessor):
    """Background processor for real-time performance analytics."""

    def __init__(
        self,
        performance_analytics: Dict[str, Any],
        agent_registry: Dict[str, Any],
        interval_seconds: float = 60.0
    ):
        """Initialize performance analyzer with analytics and registry."""
        super().__init__("PerformanceAnalyzer", interval_seconds)
        self.performance_analytics = performance_analytics
        self.agent_registry = agent_registry
        self._health_history: deque = deque(maxlen=100)

    def process(self) -> None:
        """Analyze performance and update analytics."""
        try:
            active_agents = 0
            total_operations = 0

            for agent_name, agent in self.agent_registry.items():
                if not hasattr(agent, "active"):
                    continue

                if agent.active and not agent.shutdown_requested:
                    active_agents += 1
                    if hasattr(agent, "operations"):
                        total_operations += len(agent.operations)

            with self._lock:
                self.performance_analytics.update({
                    "active_agents": active_agents,
                    "total_registered_operations": total_operations,
                    "health_check_timestamp": time.time()
                })

            self._health_history.append({
                "timestamp": time.time(),
                "active_agents": active_agents,
                "error_rate": self.performance_analytics.get("error_rate", 0)
            })

            logger.debug(
                f"Performance analysis: {active_agents} active agents, "
                f"{total_operations} operations registered"
            )

        except Exception as e:
            logger.error(f"Error in performance analysis: {e}")


def create_export_processor_loop(
    export_queue: deque,
    active_spans: Dict[str, Any],
    completed_spans: List[Dict[str, Any]],
    export_callback: Optional[Callable[[Dict[str, Any]], bool]],
    shutdown_flag: Callable[[], bool],
    interval_seconds: float = 60.0
) -> Callable[[], None]:
    """Create export processor loop function for backwards compatibility."""
    processor = ExportLoopProcessor(
        export_queue=export_queue,
        active_spans=active_spans,
        completed_spans=completed_spans,
        export_callback=export_callback,
        interval_seconds=interval_seconds
    )

    def loop() -> None:
        while not shutdown_flag():
            try:
                time.sleep(interval_seconds)
                processor.process()
            except Exception as e:
                logger.error(f"Error in export processor loop: {e}")

    return loop


__all__ = [
    "ExportLoopProcessor",
    "PerformanceAnalyzer",
    "create_export_processor_loop",
]

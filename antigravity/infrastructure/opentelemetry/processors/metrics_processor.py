"""
OpenTelemetry Metrics Processor Module
======================================

Metrics aggregation for distributed tracing.
"""

import time
import logging
from typing import Dict, Any, List, Callable
from collections import deque

from .base import BaseProcessor

logger = logging.getLogger(__name__)


class MetricsProcessor(BaseProcessor):
    """Background processor for metrics aggregation.

    Periodically calculates performance metrics from span data and
    updates the analytics store.
    """

    def __init__(
        self,
        performance_analytics: Dict[str, Any],
        completed_spans: List[Dict[str, Any]],
        interval_seconds: float = 30.0
    ):
        """Initialize metrics processor.

        Args:
            performance_analytics: Dictionary to store computed metrics
            completed_spans: List of completed spans for analysis
            interval_seconds: Aggregation interval (default 30s)
        """
        super().__init__("MetricsProcessor", interval_seconds)
        self.performance_analytics = performance_analytics
        self.completed_spans = completed_spans
        self._metrics_history: deque = deque(maxlen=1000)

    def process(self) -> None:
        """Aggregate and compute performance metrics."""
        try:
            # Calculate metrics from completed spans
            total_requests = self.performance_analytics.get("request_count", 0)
            total_errors = 0
            total_duration = 0.0
            span_count = 0

            for span in self.completed_spans[-100:]:  # Last 100 spans
                if isinstance(span, dict):
                    status = span.get("status", "")
                    if status == "error":
                        total_errors += 1
                    duration = span.get("duration")
                    if duration is not None:
                        total_duration += duration
                        span_count += 1

            # Compute rates
            error_rate = (total_errors / span_count * 100) if span_count > 0 else 0.0
            avg_response_time = (total_duration / span_count) if span_count > 0 else 0.0

            # Update analytics
            with self._lock:
                self.performance_analytics.update({
                    "request_count": total_requests,
                    "error_rate": round(error_rate, 2),
                    "avg_response_time": round(avg_response_time, 4),
                    "timestamp": time.time(),
                    "spans_analyzed": span_count
                })

            # Store in history
            self._metrics_history.append({
                "timestamp": time.time(),
                "error_rate": error_rate,
                "avg_response_time": avg_response_time,
                "span_count": span_count
            })

            logger.debug(
                f"Metrics updated: error_rate={error_rate:.2f}%, "
                f"avg_response_time={avg_response_time:.4f}s"
            )

        except Exception as e:
            logger.error(f"Error computing metrics: {e}")


def create_metrics_processor_loop(
    performance_analytics: Dict[str, Any],
    completed_spans: List[Dict[str, Any]],
    shutdown_flag: Callable[[], bool],
    interval_seconds: float = 30.0
) -> Callable[[], None]:
    """Create a metrics processor loop function.

    Factory function for backwards compatibility with DistributedTracer.

    Args:
        performance_analytics: Dictionary to store computed metrics
        completed_spans: List of completed spans
        shutdown_flag: Callable returning True when shutdown requested
        interval_seconds: Processing interval

    Returns:
        Loop function for threading.Thread target
    """
    processor = MetricsProcessor(
        performance_analytics=performance_analytics,
        completed_spans=completed_spans,
        interval_seconds=interval_seconds
    )

    def loop() -> None:
        while not shutdown_flag():
            try:
                time.sleep(interval_seconds)
                processor.process()
            except Exception as e:
                logger.error(f"Error in metrics processor loop: {e}")

    return loop


__all__ = ["MetricsProcessor", "create_metrics_processor_loop"]

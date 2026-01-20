"""
Tunnel performance metrics.
"""

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TunnelMetrics:
    """Tunnel performance metrics."""

    requests_total: int = 0
    requests_success: int = 0
    requests_failed: int = 0
    avg_response_time: float = 0.0
    p99_response_time: float = 0.0
    slow_requests_count: int = 0  # >100ms
    cache_hits: int = 0
    cache_misses: int = 0
    connection_reuse_count: int = 0
    connection_new_count: int = 0

    def record_request(self, duration: float, success: bool, from_cache: bool = False):
        """Record request metrics."""
        self.requests_total += 1

        if success:
            self.requests_success += 1
        else:
            self.requests_failed += 1

        # Update average response time
        if self.requests_total == 1:
            self.avg_response_time = duration
        else:
            self.avg_response_time = (
                self.avg_response_time * (self.requests_total - 1) + duration
            ) / self.requests_total

        # Track slow requests (>100ms)
        if duration > 0.1:  # 100ms
            self.slow_requests_count += 1
            logger.warning(f"Slow request: {duration:.3f}s")

        # Track cache hits
        if from_cache:
            self.cache_hits += 1
        else:
            self.cache_misses += 1

"""
Performance Monitoring Middleware
==================================
Tracks request duration, slow queries, and latency metrics for all API calls.
"""

import logging
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

# In-memory metrics storage
class MetricsStore:
    """Thread-safe in-memory storage for performance metrics"""

    def __init__(self, max_samples: int = 1000):
        self.max_samples = max_samples
        self.request_times = deque(maxlen=max_samples)
        self.slow_queries = deque(maxlen=100)  # Keep last 100 slow queries
        self.endpoint_metrics = {}  # endpoint -> list of response times
        self.p99_threshold = 2000.0  # ms, will be updated dynamically
        self.last_alert_time = None
        self.alert_cooldown = timedelta(minutes=5)  # Avoid alert spam

    def add_request(self, endpoint: str, duration_ms: float, timestamp: datetime):
        """Add a request metric"""
        self.request_times.append({
            'endpoint': endpoint,
            'duration_ms': duration_ms,
            'timestamp': timestamp
        })

        # Track per-endpoint metrics
        if endpoint not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint] = deque(maxlen=100)
        self.endpoint_metrics[endpoint].append(duration_ms)

        # Track slow queries (>500ms)
        if duration_ms > 500:
            self.slow_queries.append({
                'endpoint': endpoint,
                'duration_ms': duration_ms,
                'timestamp': timestamp
            })
            logger.warning(
                f"Slow query detected: {endpoint} took {duration_ms:.2f}ms"
            )

    def calculate_percentile(self, percentile: float = 99.0) -> float:
        """Calculate the specified percentile of response times"""
        if not self.request_times:
            return 0.0

        durations = sorted([req['duration_ms'] for req in self.request_times])
        index = int(len(durations) * (percentile / 100.0))
        return durations[min(index, len(durations) - 1)]

    def check_p99_spike(self) -> Optional[dict]:
        """
        Check if current p99 latency has spiked significantly.
        Returns alert data if spike detected, None otherwise.
        """
        if len(self.request_times) < 50:  # Need enough samples
            return None

        current_p99 = self.calculate_percentile(99.0)

        # Update baseline threshold (rolling average of p99)
        if self.p99_threshold == 2000.0:  # Initial value
            self.p99_threshold = current_p99 * 1.5
        else:
            # Exponential moving average
            self.p99_threshold = 0.9 * self.p99_threshold + 0.1 * current_p99

        # Alert if current p99 is 2x the threshold
        spike_threshold = self.p99_threshold * 2.0

        # Check cooldown to avoid alert spam
        now = datetime.now()
        if self.last_alert_time:
            if now - self.last_alert_time < self.alert_cooldown:
                return None

        if current_p99 > spike_threshold:
            self.last_alert_time = now
            return {
                'current_p99': current_p99,
                'threshold': spike_threshold,
                'baseline': self.p99_threshold,
                'timestamp': now.isoformat()
            }

        return None

    def get_summary(self) -> dict:
        """Get summary statistics for dashboard"""
        if not self.request_times:
            return {
                'total_requests': 0,
                'avg_response_time': 0,
                'p50': 0,
                'p95': 0,
                'p99': 0,
                'slow_queries_count': 0
            }

        durations = [req['duration_ms'] for req in self.request_times]

        return {
            'total_requests': len(self.request_times),
            'avg_response_time': sum(durations) / len(durations),
            'p50': self.calculate_percentile(50.0),
            'p95': self.calculate_percentile(95.0),
            'p99': self.calculate_percentile(99.0),
            'slow_queries_count': len(self.slow_queries),
            'slow_queries': list(self.slow_queries)[-10:],  # Last 10 slow queries
            'endpoint_breakdown': {
                endpoint: {
                    'avg': sum(times) / len(times),
                    'count': len(times),
                    'max': max(times),
                    'min': min(times)
                }
                for endpoint, times in self.endpoint_metrics.items()
                if times
            }
        }


# Global metrics store
metrics_store = MetricsStore()


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor API performance:
    - Logs request duration
    - Tracks slow queries (>500ms)
    - Adds X-Response-Time header
    - Stores metrics for dashboard
    - Alerts on p99 latency spikes
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        logger.info("Performance monitoring middleware initialized")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timing
        start_time = time.perf_counter()

        # Get endpoint path for tracking
        endpoint = f"{request.method} {request.url.path}"

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_s = time.perf_counter() - start_time
        duration_ms = duration_s * 1000.0

        # Add X-Response-Time header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # Log request
        logger.info(
            f"{endpoint} - {response.status_code} - {duration_ms:.2f}ms"
        )

        # Store metrics
        timestamp = datetime.now()
        metrics_store.add_request(endpoint, duration_ms, timestamp)

        # Check for p99 spike
        spike_alert = metrics_store.check_p99_spike()
        if spike_alert:
            logger.error(
                f"⚠️  P99 LATENCY SPIKE DETECTED! "
                f"Current p99: {spike_alert['current_p99']:.2f}ms "
                f"(threshold: {spike_alert['threshold']:.2f}ms, "
                f"baseline: {spike_alert['baseline']:.2f}ms)"
            )
            # In production, this could trigger alerts via email, Slack, etc.

        return response


def get_metrics_summary() -> dict:
    """Get current metrics summary for dashboard"""
    return metrics_store.get_summary()


def reset_metrics():
    """Reset all metrics (useful for testing)"""
    global metrics_store
    metrics_store = MetricsStore()
    logger.info("Performance metrics reset")

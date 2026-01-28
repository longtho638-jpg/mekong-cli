"""
Cache Metrics Module
Tracks hits, misses, latency, and other cache performance indicators.
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from backend.api.config.settings import settings

logger = logging.getLogger(__name__)

@dataclass
class CacheMetrics:
    hits: int = 0
    misses: int = 0
    writes: int = 0
    deletes: int = 0
    errors: int = 0
    total_latency_ms: float = 0.0
    evictions: int = 0

    # Track by operation type
    ops_latency: Dict[str, float] = field(default_factory=lambda: {
        "get": 0.0, "set": 0.0, "delete": 0.0, "exists": 0.0
    })
    ops_count: Dict[str, int] = field(default_factory=lambda: {
        "get": 0, "set": 0, "delete": 0, "exists": 0
    })

    def increment_hit(self):
        self.hits += 1

    def increment_miss(self):
        self.misses += 1

    def increment_write(self):
        self.writes += 1

    def increment_delete(self):
        self.deletes += 1

    def increment_error(self):
        self.errors += 1

    def record_latency(self, operation: str, duration_sec: float):
        ms = duration_sec * 1000
        self.total_latency_ms += ms

        if operation in self.ops_latency:
            self.ops_latency[operation] += ms
            self.ops_count[operation] += 1

    def get_hit_rate(self) -> float:
        total = self.hits + self.misses
        if total == 0:
            return 0.0
        return (self.hits / total) * 100

    def get_avg_latency(self) -> float:
        total_ops = sum(self.ops_count.values())
        if total_ops == 0:
            return 0.0
        return self.total_latency_ms / total_ops

    def reset(self):
        self.hits = 0
        self.misses = 0
        self.writes = 0
        self.deletes = 0
        self.errors = 0
        self.total_latency_ms = 0.0
        self.evictions = 0
        self.ops_latency = {k: 0.0 for k in self.ops_latency}
        self.ops_count = {k: 0 for k in self.ops_count}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "writes": self.writes,
            "deletes": self.deletes,
            "errors": self.errors,
            "hit_rate_percent": round(self.get_hit_rate(), 2),
            "avg_latency_ms": round(self.get_avg_latency(), 4),
            "ops_breakdown": self.ops_count
        }

# Global metrics instance
global_metrics = CacheMetrics()

class MetricsContext:
    """Context manager for tracking cache operation latency"""

    def __init__(self, operation: str):
        self.operation = operation
        self.start_time = 0

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        global_metrics.record_latency(self.operation, duration)
        if exc_type:
            global_metrics.increment_error()

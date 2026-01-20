"""
Antigravity API Tunnel - High Performance Connection Tunnel
======================================================

Implements Cloudflare 1.1.1.1 WAR-inspired performance optimizations:
- Connection pooling with persistent HTTP connections
- Async operations with parallel request batching
- Response caching with TTL
- Comprehensive latency tracking and metrics
"""

from .cache import CacheEntry, ResponseCache
from .manager import (
    get_optimized_status,
    get_optimized_tools,
    get_tunnel,
    get_tunnel_metrics,
    pre_warm_tunnel,
    shutdown_tunnel,
    tunnel,
)
from .metrics import TunnelMetrics
from .optimizer import TunnelOptimizer

__all__ = [
    "TunnelOptimizer",
    "tunnel",
    "get_optimized_tools",
    "get_optimized_status",
    "pre_warm_tunnel",
    "get_tunnel_metrics",
    "shutdown_tunnel",
    "TunnelMetrics",
    "ResponseCache",
    "CacheEntry",
    "get_tunnel",
]

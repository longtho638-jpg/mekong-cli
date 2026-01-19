"""
Antigravity API Tunnel - High Performance Connection Tunnel
======================================================

Implements Cloudflare 1.1.1.1 WAR-inspired performance optimizations:
- Connection pooling with persistent HTTP connections
- Async operations with parallel request batching
- Response caching with TTL
- Comprehensive latency tracking and metrics
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import aiohttp
import httpx

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


@dataclass
class CacheEntry:
    """Cache entry with TTL."""

    data: Any
    timestamp: float
    ttl: float

    @property
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        return time.time() > (self.timestamp + self.ttl)


class ResponseCache:
    """In-memory response cache with TTL."""

    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.access_times: Dict[str, float] = defaultdict(float)

    def _generate_key(self, method: str, url: str, params: Dict = None) -> str:
        """Generate cache key."""
        cache_data = {"method": method, "url": url, "params": params or {}}
        cache_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_str.encode()).hexdigest()

    def get(self, method: str, url: str, params: Dict = None) -> Optional[Any]:
        """Get cached response."""
        key = self._generate_key(method, url, params)

        if key not in self.cache:
            return None

        entry = self.cache[key]

        if entry.is_expired:
            del self.cache[key]
            if key in self.access_times:
                del self.access_times[key]
            return None

        # Update access time for LRU
        self.access_times[key] = time.time()
        return entry.data

    def set(self, method: str, url: str, data: Any, ttl: float, params: Dict = None):
        """Set cache entry."""
        key = self._generate_key(method, url, params)

        # Remove oldest entry if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.access_times.items(), key=lambda x: x[1])[0]
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

        self.cache[key] = CacheEntry(data=data, timestamp=time.time(), ttl=ttl)
        self.access_times[key] = time.time()

    def clear(self):
        """Clear all cache entries."""
        self.cache.clear()
        self.access_times.clear()


class TunnelOptimizer:
    """High-performance API tunnel with connection pooling and caching."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        max_connections: int = 100,
        cache_ttl: float = 5.0,  # 5 seconds
        max_cache_size: int = 1000,
    ):
        self.base_url = base_url.rstrip("/")
        self.metrics = TunnelMetrics()
        self.cache = ResponseCache(max_cache_size)
        self.max_connections = max_connections

        # Connection pool with httpx
        self.httpx_client = httpx.AsyncClient(
            base_url=base_url,
            limits=httpx.Limits(max_connections=max_connections, max_keepalive_connections=20),
            timeout=httpx.Timeout(10.0, connect=2.0),
            http2=True,
        )

        # Alternative aiohttp client for compatibility
        self.aiohttp_connector = aiohttp.TCPConnector(
            limit=max_connections,
            limit_per_host=max_connections,
            keepalive_timeout=30.0,
            enable_cleanup_closed=True,
        )

        # Request batch queue
        self.batch_queue: deque = deque()
        self.batch_processing = False

        logger.info(f"TunnelOptimizer initialized: {base_url}")

    async def pre_warm_connections(self):
        """Pre-warm connection pool with test requests."""
        try:
            start_time = time.time()
            await self.httpx_client.get("/health")
            warm_time = time.time() - start_time
            logger.info(f"Connection pool warmed in {warm_time:.3f}s")
        except Exception as e:
            logger.warning(f"Failed to warm connection pool: {e}")

    async def request(
        self,
        method: str,
        endpoint: str,
        params: Dict = None,
        data: Dict = None,
        headers: Dict = None,
        use_cache: bool = True,
        ttl: float = None,
    ) -> Dict[str, Any]:
        """Make optimized HTTP request."""

        start_time = time.time()

        # Check cache first
        if use_cache and method.upper() in ["GET", "HEAD"]:
            cached_response = self.cache.get(method, endpoint, params)
            if cached_response:
                duration = time.time() - start_time
                self.metrics.record_request(duration, True, from_cache=True)
                return cached_response

        try:
            # Make actual request
            response = await self.httpx_client.request(
                method=method, url=endpoint, params=params, json=data, headers=headers
            )

            duration = time.time() - start_time

            # Parse response
            if response.headers.get("content-type", "").startswith("application/json"):
                result = response.json()
            else:
                result = {"data": response.text, "status_code": response.status_code}

            # Cache successful GET requests
            if use_cache and method.upper() in ["GET", "HEAD"] and response.status_code == 200:
                cache_ttl = ttl or self._get_default_ttl(endpoint)
                self.cache.set(method, endpoint, result, cache_ttl, params)

            # Record metrics
            self.metrics.record_request(duration, response.is_success, from_cache=False)

            # Track connection reuse (httpx doesn't expose this directly, so we estimate)
            if duration < 0.05:  # Fast responses likely reuse connections
                self.metrics.connection_reuse_count += 1
            else:
                self.metrics.connection_new_count += 1

            return result

        except Exception as e:
            duration = time.time() - start_time
            self.metrics.record_request(duration, False)
            logger.error(f"Tunnel request failed: {e}")
            raise

    def _get_default_ttl(self, endpoint: str) -> float:
        """Get default TTL for endpoint."""
        if endpoint == "/api/code/tools":
            return 30.0  # Tools rarely change
        elif endpoint == "/api/code/status":
            return 5.0  # Status changes frequently
        elif endpoint == "/health":
            return 10.0  # Health status
        else:
            return 5.0  # Default

    async def batch_requests(
        self, requests: List[Dict[str, Any]], max_concurrent: int = 10
    ) -> List[Dict[str, Any]]:
        """Execute multiple requests in parallel."""

        semaphore = asyncio.Semaphore(max_concurrent)
        results = []

        async def bounded_request(req_data):
            async with semaphore:
                return await self.request(**req_data)

        tasks = [bounded_request(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return results

    async def health_check(self) -> Dict[str, Any]:
        """Check tunnel health."""
        try:
            start_time = time.time()
            response = await self.request("GET", "/health", use_cache=False)
            duration = time.time() - start_time

            return {
                "status": "healthy",
                "response_time": duration,
                "server_response": response.get("status", "unknown"),
                "metrics": self.get_metrics_summary(),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "metrics": self.get_metrics_summary(),
            }

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary."""
        return {
            "requests": {
                "total": self.metrics.requests_total,
                "success": self.metrics.requests_success,
                "failed": self.metrics.requests_failed,
                "success_rate": (
                    self.metrics.requests_success / self.metrics.requests_total
                    if self.metrics.requests_total > 0
                    else 0
                )
                * 100,
            },
            "performance": {
                "avg_response_time_ms": self.metrics.avg_response_time * 1000,
                "p99_response_time_ms": self.metrics.p99_response_time * 1000,
                "slow_requests_count": self.metrics.slow_requests_count,
                "slow_request_rate": (
                    self.metrics.slow_requests_count / self.metrics.requests_total
                    if self.metrics.requests_total > 0
                    else 0
                )
                * 100,
            },
            "cache": {
                "hits": self.metrics.cache_hits,
                "misses": self.metrics.cache_misses,
                "hit_rate": (
                    self.metrics.cache_hits / (self.metrics.cache_hits + self.metrics.cache_misses)
                    if (self.metrics.cache_hits + self.metrics.cache_misses) > 0
                    else 0
                )
                * 100,
                "cache_size": len(self.cache.cache),
            },
            "connections": {
                "reuse_count": self.metrics.connection_reuse_count,
                "new_count": self.metrics.connection_new_count,
                "reuse_rate": (
                    self.metrics.connection_reuse_count
                    / (self.metrics.connection_reuse_count + self.metrics.connection_new_count)
                    if (self.metrics.connection_reuse_count + self.metrics.connection_new_count) > 0
                    else 0
                )
                * 100,
                "max_connections": self.max_connections,
            },
        }

    async def clear_cache(self):
        """Clear response cache."""
        self.cache.clear()
        logger.info("Tunnel cache cleared")

    async def close(self):
        """Close tunnel and cleanup resources."""
        await self.httpx_client.aclose()
        logger.info("TunnelOptimizer closed")


# Global tunnel instance - lazy initialization to avoid event loop issues
_tunnel: Optional[TunnelOptimizer] = None


def get_tunnel() -> TunnelOptimizer:
    """Get or create tunnel instance (lazy initialization)."""
    global _tunnel
    if _tunnel is None:
        _tunnel = TunnelOptimizer()
    return _tunnel


# Backward compatibility alias
tunnel = None  # Will be set on first async access


# Tunnel management functions
async def get_optimized_tools() -> Dict[str, Any]:
    """Get API tools with caching."""
    return await get_tunnel().request("GET", "/api/code/tools", use_cache=True)


async def get_optimized_status() -> Dict[str, Any]:
    """Get API status with caching."""
    return await get_tunnel().request("GET", "/api/code/status", use_cache=True)


async def pre_warm_tunnel():
    """Pre-warm tunnel connections."""
    await get_tunnel().pre_warm_connections()


def get_tunnel_metrics() -> Dict[str, Any]:
    """Get tunnel performance metrics."""
    t = get_tunnel()
    return t.get_metrics_summary()


async def shutdown_tunnel():
    """Shutdown tunnel gracefully."""
    global _tunnel
    if _tunnel is not None:
        await _tunnel.close()
        _tunnel = None


# Export tunnel interface
__all__ = [
    "TunnelOptimizer",
    "tunnel",
    "get_optimized_tools",
    "get_optimized_status",
    "pre_warm_tunnel",
    "get_tunnel_metrics",
    "shutdown_tunnel",
]

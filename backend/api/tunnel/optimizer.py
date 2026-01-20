"""
Tunnel optimizer implementation.
"""

import asyncio
import logging
import time
from collections import deque
from typing import Any, Dict, List

import aiohttp
import httpx

from .cache import ResponseCache
from .metrics import TunnelMetrics

logger = logging.getLogger(__name__)


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

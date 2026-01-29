"""
Tunnel Optimizer Facade.
"""

from .cache import ResponseCache
from .metrics import TunnelMetrics
from .requests import RequestHandler


class TunnelOptimizer(RequestHandler):
    def __init__(
        self, base_url: str = "http://localhost:8000", max_connections: int = 100, **kwargs
    ):
        super().__init__(base_url, max_connections)
        self.metrics = TunnelMetrics()
        self.cache = ResponseCache(kwargs.get("max_cache_size", 1000))

    async def health_check(self):
        try:
            res = await self.request("GET", "/health", use_cache=False)
            return {"status": "healthy", "server_response": res.get("status", "unknown")}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

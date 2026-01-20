"""
Tunnel Request and Batch processing.
"""
import asyncio
import time
from typing import Any, Dict, List

from .connections import ConnectionPool


class RequestHandler(ConnectionPool):
    async def request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        use_cache = kwargs.pop("use_cache", True)
        start_time = time.time()
        if use_cache and method.upper() in ["GET", "HEAD"] and hasattr(self, 'cache'):
            cached = self.cache.get(method, endpoint, kwargs.get("params"))
            if cached: return cached
        try:
            resp = await self.httpx_client.request(method=method, url=endpoint, **kwargs)
            res = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"data": resp.text, "status_code": resp.status_code}
            if hasattr(self, 'metrics'): self.metrics.record_request(time.time() - start_time, resp.is_success)
            return res
        except Exception:
            if hasattr(self, 'metrics'): self.metrics.record_request(time.time() - start_time, False)
            raise

    async def batch_requests(self, requests: List[Dict[str, Any]], max_concurrent: int = 10) -> List[Any]:
        sem = asyncio.Semaphore(max_concurrent)
        async def bounded(r):
            async with sem: return await self.request(**r)
        return await asyncio.gather(*[bounded(req) for req in requests], return_exceptions=True)

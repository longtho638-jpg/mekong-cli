"""
Tunnel Connection and Cache Management.
"""
import time
from typing import Any, Dict, Optional

import aiohttp
import httpx


class ConnectionPool:
    def __init__(self, base_url: str, max_connections: int):
        self.base_url = base_url.rstrip("/")
        self.httpx_client = httpx.AsyncClient(base_url=base_url, limits=httpx.Limits(max_connections=max_connections, max_keepalive_connections=20), timeout=httpx.Timeout(10.0, connect=2.0), http2=True)
        self.aiohttp_connector = aiohttp.TCPConnector(limit=max_connections, limit_per_host=max_connections, keepalive_timeout=30.0, enable_cleanup_closed=True)

    async def close(self):
        await self.httpx_client.aclose()

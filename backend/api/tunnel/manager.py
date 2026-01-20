"""
Tunnel instance management and helper functions.
"""

from typing import Any, Dict, Optional

from .optimizer import TunnelOptimizer

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

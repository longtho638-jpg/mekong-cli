"""
Redis Backend for Distributed Queue (Proxy).
=========================================
This file is now a proxy for the modularized version in ./redis/
Please import from antigravity.infrastructure.distributed_queue.backends.redis instead.
"""
import warnings

from .redis import RedisBackend

# Issue a deprecation warning
warnings.warn(
    "antigravity.infrastructure.distributed_queue.backends.redis_backend is deprecated. "
    "Use antigravity.infrastructure.distributed_queue.backends.redis instead.",
    DeprecationWarning,
    stacklevel=2
)

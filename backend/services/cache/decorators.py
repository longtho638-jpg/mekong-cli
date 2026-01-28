import hashlib
import inspect
import json
from functools import wraps
from typing import Any, Callable, Optional

from starlette.concurrency import run_in_threadpool

from backend.services.cache import cache_factory


def cache(
    ttl: int = 300,
    prefix: str = "cache",
    key_func: Optional[Callable] = None,
    tags: Optional[list] = None
):
    """
    Decorator to cache function results using the new CacheFactory infrastructure.
    Handles both async and sync functions.
    Sync functions are executed in a threadpool to avoid blocking the event loop.

    Args:
        ttl (int): Time to live in seconds.
        prefix (str): Prefix for the cache key.
        key_func (Callable): Custom function to generate cache key from args/kwargs.
        tags (list): List of tags for invalidation.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate key
            if key_func:
                key_suffix = key_func(*args, **kwargs)
            else:
                # Create a simple deterministic key from args/kwargs
                # Note: This requires args/kwargs to be serializable or convertible to string appropriately
                key_parts = [func.__name__]
                if args:
                    key_parts.append(str(args))
                if kwargs:
                    try:
                        # Sort kwargs for stability
                        key_parts.append(json.dumps(kwargs, sort_keys=True, default=str))
                    except Exception:
                        key_parts.append(str(kwargs))

                key_string = "|".join(key_parts)
                key_suffix = hashlib.md5(key_string.encode()).hexdigest()

            full_key = f"{prefix}:{key_suffix}"

            # Get QueryCache instance
            query_cache = await cache_factory.get_query_cache()

            # Define the query function to run on miss
            async def run_query():
                if inspect.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return await run_in_threadpool(func, *args, **kwargs)

            # Use cached_query wrapper
            return await query_cache.cached_query(
                key=full_key,
                query_func=run_query,
                ttl=ttl,
                tags=tags or []
            )

        return wrapper
    return decorator

"""
Self-Improvement Decorators.
"""
import time
from typing import Callable

from .engine import get_self_improve_engine


def self_improving(name: str = None):
    """Decorator to enable self-improvement for a function."""

    def decorator(func: Callable):
        func_name = name or func.__name__

        def wrapper(*args, **kwargs):
            engine = get_self_improve_engine()
            start = time.time()
            success = True

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                engine.learn_from_error(e, {"function": func_name})
                raise
            finally:
                execution_time = time.time() - start
                engine.profile_function(func_name, execution_time, success)

        return wrapper

    return decorator

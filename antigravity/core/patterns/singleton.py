"""
Singleton Factory Pattern - Centralized singleton management.

Reduces boilerplate for the common pattern of lazy-initialized module singletons.
"""

from typing import Callable, Optional, TypeVar

T = TypeVar("T")


def singleton_factory(factory: Callable[[], T]) -> Callable[[], T]:
    """
    Decorator for singleton factory functions.

    Converts a factory function into a lazy-initialized singleton.
    The first call creates the instance, subsequent calls return
    the cached instance.

    Example:
        @singleton_factory
        def get_my_engine() -> MyEngine:
            return MyEngine()

        # First call creates instance
        engine1 = get_my_engine()
        # Subsequent calls return same instance
        engine2 = get_my_engine()
        assert engine1 is engine2  # True
    """
    _instance: Optional[T] = None

    def get_instance() -> T:
        nonlocal _instance
        if _instance is None:
            _instance = factory()
        return _instance

    # Preserve function metadata
    get_instance.__name__ = factory.__name__
    get_instance.__doc__ = factory.__doc__

    return get_instance

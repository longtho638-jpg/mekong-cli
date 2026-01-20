"""
Tracing Decorators.
"""
import functools
from typing import Callable

from .core import _tracer
from .enums import SpanStatus


def trace_function(name: str = None):
    """
    Decorator to automatically trace a function.

    Usage:
        @trace_function("my_operation")
        def my_function():
            ...
    """

    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            span = _tracer.start_span(span_name)
            span.set_attribute("function", func.__name__)

            try:
                result = func(*args, **kwargs)
                _tracer.end_span(span, SpanStatus.OK)
                return result
            except Exception as e:
                span.set_attribute("error.message", str(e))
                span.set_attribute("error.type", type(e).__name__)
                _tracer.end_span(span, SpanStatus.ERROR)
                raise

        return wrapper

    return decorator

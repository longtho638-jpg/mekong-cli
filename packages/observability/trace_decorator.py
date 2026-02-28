"""
Trace decorator — @traced(name="step_name") for auto-instrumentation.

Uses contextvars to propagate the active Langfuse trace through the call
stack without requiring explicit argument passing.

If no active trace is present the decorator is a transparent no-op so
decorated functions work correctly even without Langfuse configured.
"""

import functools
import logging
import time
from contextvars import ContextVar
from typing import Any, Callable, Optional, TypeVar

logger = logging.getLogger(__name__)

# Thread-safe context variable holding the current active Langfuse trace
_active_trace: ContextVar[Optional[Any]] = ContextVar("_active_trace", default=None)

F = TypeVar("F", bound=Callable[..., Any])


def set_active_trace(trace: Optional[Any]) -> None:
    """Store a Langfuse trace object in the current context."""
    _active_trace.set(trace)


def get_active_trace() -> Optional[Any]:
    """Retrieve the current context's active Langfuse trace, or None."""
    return _active_trace.get()


def traced(name: Optional[str] = None) -> Callable[[F], F]:
    """
    Decorator that wraps a function in a Langfuse span.

    Automatically measures wall-clock duration and captures exceptions.
    Falls back to a no-op when no active trace is available.

    Args:
        name: Span label. Defaults to the decorated function's __name__.

    Example::

        @traced(name="install-deps")
        def install_dependencies(recipe):
            ...
    """

    def decorator(fn: F) -> F:
        span_name = name or fn.__name__

        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            trace = get_active_trace()
            span: Optional[Any] = None

            # Lazy import to avoid hard dependency at module load time
            try:
                from packages.observability.langfuse_provider import LangfuseProvider  # noqa: F401

                if trace is not None:
                    try:
                        span = trace.span(name=span_name)
                    except Exception as exc:
                        logger.debug("span creation failed: %s", exc)
            except ImportError:
                pass

            start = time.perf_counter()
            error_msg: Optional[str] = None

            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                error_msg = str(exc)
                raise
            finally:
                duration = round(time.perf_counter() - start, 3)
                if span is not None:
                    try:
                        status = "error" if error_msg else "success"
                        metadata: dict = {"duration_seconds": duration}
                        if error_msg:
                            metadata["error"] = error_msg
                        span.end(status=status, metadata=metadata)
                    except Exception as exc:
                        logger.debug("span.end failed: %s", exc)

        return wrapper  # type: ignore[return-value]

    return decorator

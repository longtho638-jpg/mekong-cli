import time
from antigravity.core.self_improve.decorators import self_improving
from antigravity.core.self_improve.engine import get_self_improve_engine

import pytest


def test_self_improving_decorator_success():
    engine = get_self_improve_engine()

    @self_improving(name="test_func")
    def test_func(x):
        return x * 2

    result = test_func(5)
    assert result == 10

    # Verify profiling was called
    assert "test_func" in engine.profiles
    assert engine.profiles["test_func"].call_count >= 1

def test_self_improving_decorator_error():
    engine = get_self_improve_engine()

    @self_improving()
    def failing_func():
        raise ValueError("Intentional failure")

    with pytest.raises(ValueError, match="Intentional failure"):
        failing_func()

    # Verify error was learned
    status = engine.get_status()
    assert status["error_patterns"] >= 1
    # Note: engine might have had previous errors from other tests,
    # but we know this one was processed.

def test_self_improving_no_name():
    engine = get_self_improve_engine()

    @self_improving()
    def anonymous_func():
        return True

    anonymous_func()
    assert "anonymous_func" in engine.profiles

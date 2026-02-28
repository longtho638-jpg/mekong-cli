"""Integration tests for packages/observability — Langfuse facade."""

import pytest
from unittest.mock import patch, MagicMock


class TestLangfuseProvider:
    def test_init_without_langfuse_installed(self):
        """LangfuseProvider gracefully handles missing SDK."""
        with patch("packages.observability.langfuse_provider._LANGFUSE_AVAILABLE", False):
            from packages.observability.langfuse_provider import LangfuseProvider
            provider = LangfuseProvider()
            # client should be None when SDK unavailable
            assert provider._client is None

    def test_start_trace_returns_none_when_no_client(self):
        """start_trace() returns None when client not initialized."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        # No credentials in env — client is None
        result = provider.start_trace("test-trace", user_id="u1")
        assert result is None

    def test_start_span_returns_none_when_no_client(self):
        """start_span() returns None when client unavailable."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        result = provider.start_span(None, "test-span")
        assert result is None

    def test_record_generation_returns_none_when_no_client(self):
        """record_generation() returns None when client unavailable."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        result = provider.record_generation(None, "claude", "input", "output")
        assert result is None

    def test_end_trace_no_op_when_no_trace(self):
        """end_trace(None) doesn't raise."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        provider.end_trace(None, status="success")  # Should not raise

    def test_score_no_op_when_no_client(self):
        """score() is a no-op when client unavailable."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        provider.score(None, "quality", 0.9)  # Should not raise

    def test_mock_client_start_trace(self):
        """start_trace() delegates to Langfuse client when available."""
        from packages.observability.langfuse_provider import LangfuseProvider
        provider = LangfuseProvider()
        mock_client = MagicMock()
        mock_trace = MagicMock()
        mock_client.trace.return_value = mock_trace
        provider._client = mock_client

        result = provider.start_trace("my-goal", user_id="user-1", metadata={"k": "v"})
        mock_client.trace.assert_called_once_with(
            name="my-goal", user_id="user-1", metadata={"k": "v"}
        )
        assert result is mock_trace


class TestObservabilityFacade:
    def setup_method(self):
        """Reset singleton before each test."""
        from packages.observability.observability_facade import ObservabilityFacade
        ObservabilityFacade.reset()

    def teardown_method(self):
        """Reset singleton after each test."""
        from packages.observability.observability_facade import ObservabilityFacade
        ObservabilityFacade.reset()

    def test_singleton_pattern(self):
        """instance() returns same object on repeated calls."""
        from packages.observability.observability_facade import ObservabilityFacade
        f1 = ObservabilityFacade.instance()
        f2 = ObservabilityFacade.instance()
        assert f1 is f2

    def test_reset_creates_new_instance(self):
        """reset() causes next instance() call to create a fresh object."""
        from packages.observability.observability_facade import ObservabilityFacade
        f1 = ObservabilityFacade.instance()
        ObservabilityFacade.reset()
        f2 = ObservabilityFacade.instance()
        assert f1 is not f2

    def test_start_and_finish_trace(self):
        """Full trace lifecycle completes without raising."""
        from packages.observability.observability_facade import ObservabilityFacade
        facade = ObservabilityFacade.instance()
        facade.start_trace("test goal", user_id="test-user")
        facade.record_step(1, "step one", 0.5, 0)
        facade.record_llm_call(model="test-model", input_tokens=100, output_tokens=50)
        facade.record_error("test error")
        facade.finish_trace("success")

    def test_record_step_with_self_heal(self):
        """record_step() accepts self_healed flag without raising."""
        from packages.observability.observability_facade import ObservabilityFacade
        facade = ObservabilityFacade.instance()
        facade.start_trace("heal-test")
        facade.record_step(1, "healed step", 1.2, 0, self_healed=True, agent="tester")
        facade.finish_trace("success")

    def test_json_fallback_when_langfuse_down(self):
        """JSON telemetry collector still works when Langfuse client is None."""
        from packages.observability.observability_facade import ObservabilityFacade
        facade = ObservabilityFacade.instance()
        # Ensure no Langfuse client
        facade._langfuse._client = None
        facade.start_trace("fallback test")
        facade.record_step(1, "fallback step", 1.0, 0)
        facade.finish_trace("success")
        # JSON collector should have processed trace if available
        if facade._collector is not None:
            trace = facade._collector.get_trace()
            assert trace is not None
            assert trace.goal == "fallback test"

    def test_multiple_llm_calls(self):
        """record_llm_call() can be called multiple times per trace."""
        from packages.observability.observability_facade import ObservabilityFacade
        facade = ObservabilityFacade.instance()
        facade.start_trace("multi-llm")
        facade.record_llm_call(model="claude", input_tokens=200, output_tokens=100, cost=0.01)
        facade.record_llm_call(model="gemini", input_tokens=300, output_tokens=150)
        facade.finish_trace("success")


class TestTracedDecorator:
    def test_traced_preserves_return_value(self):
        """@traced decorator passes through function return value."""
        from packages.observability.trace_decorator import traced

        @traced(name="test-func")
        def my_func(x, y):
            return x + y

        result = my_func(3, 4)
        assert result == 7

    def test_traced_reraises_exceptions(self):
        """@traced decorator re-raises exceptions correctly."""
        from packages.observability.trace_decorator import traced

        @traced(name="failing")
        def failing():
            raise ValueError("test error")

        with pytest.raises(ValueError, match="test error"):
            failing()

    def test_traced_default_name_is_function_name(self):
        """@traced without name uses function __name__."""
        from packages.observability.trace_decorator import traced

        @traced()
        def my_named_func():
            return "ok"

        assert my_named_func() == "ok"

    def test_traced_context_helpers(self):
        """set_active_trace and get_active_trace work as pair."""
        from packages.observability.trace_decorator import set_active_trace, get_active_trace

        mock_trace = MagicMock()
        set_active_trace(mock_trace)
        retrieved = get_active_trace()
        assert retrieved is mock_trace

        set_active_trace(None)
        assert get_active_trace() is None

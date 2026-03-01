"""Tests for hooks middleware pipeline — Portkey-inspired request lifecycle."""

import unittest
import time

from src.core.hooks import (
    Hook,
    HookContext,
    HookPhase,
    HookPipeline,
    HookResult,
    InputValidationHook,
    OutputValidationHook,
    TokenCounterHook,
    LatencyMonitorHook,
    ErrorLoggerHook,
    create_default_pipeline,
)


class TestHookContext(unittest.TestCase):
    """Test HookContext dataclass."""

    def test_default_context(self):
        ctx = HookContext()
        self.assertEqual(ctx.messages, [])
        self.assertEqual(ctx.model, "")
        self.assertEqual(ctx.temperature, 0.7)
        self.assertIsNone(ctx.error)

    def test_context_with_values(self):
        ctx = HookContext(
            messages=[{"role": "user", "content": "hello"}],
            model="gemini-2.5-pro",
            provider="vertex",
        )
        self.assertEqual(len(ctx.messages), 1)
        self.assertEqual(ctx.provider, "vertex")


class TestInputValidationHook(unittest.TestCase):
    """Test input validation hook."""

    def test_valid_input(self):
        hook = InputValidationHook()
        ctx = HookContext(messages=[{"role": "user", "content": "hello"}])
        result = hook.execute(ctx)
        self.assertTrue(result.passed)

    def test_empty_messages_fail(self):
        hook = InputValidationHook()
        ctx = HookContext(messages=[])
        result = hook.execute(ctx)
        self.assertFalse(result.passed)
        self.assertIn("Empty", result.error_message)

    def test_too_many_messages_fail(self):
        hook = InputValidationHook({"max_messages": 2})
        ctx = HookContext(messages=[
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
            {"role": "user", "content": "c"},
        ])
        result = hook.execute(ctx)
        self.assertFalse(result.passed)
        self.assertIn("Too many", result.error_message)

    def test_message_too_long_fail(self):
        hook = InputValidationHook({"max_message_length": 10})
        ctx = HookContext(messages=[
            {"role": "user", "content": "x" * 20},
        ])
        result = hook.execute(ctx)
        self.assertFalse(result.passed)
        self.assertIn("too long", result.error_message)

    def test_phase_is_pre_request(self):
        hook = InputValidationHook()
        self.assertEqual(hook.phase, HookPhase.PRE_REQUEST)


class TestOutputValidationHook(unittest.TestCase):
    """Test output validation hook."""

    def test_valid_output(self):
        hook = OutputValidationHook()
        ctx = HookContext(response_content="Hello world")
        result = hook.execute(ctx)
        self.assertTrue(result.passed)

    def test_empty_output_fail(self):
        hook = OutputValidationHook()
        ctx = HookContext(response_content="")
        result = hook.execute(ctx)
        self.assertFalse(result.passed)
        self.assertIn("too short", result.error_message)

    def test_too_long_output_fail(self):
        hook = OutputValidationHook({"max_length": 5})
        ctx = HookContext(response_content="too long string")
        result = hook.execute(ctx)
        self.assertFalse(result.passed)
        self.assertIn("too long", result.error_message)

    def test_phase_is_post_request(self):
        hook = OutputValidationHook()
        self.assertEqual(hook.phase, HookPhase.POST_REQUEST)


class TestTokenCounterHook(unittest.TestCase):
    """Test token counting hook."""

    def test_tracks_tokens(self):
        hook = TokenCounterHook()
        ctx = HookContext(usage={"total_tokens": 150})
        result = hook.execute(ctx)
        self.assertTrue(result.passed)
        self.assertEqual(hook.total_tokens_used, 150)
        self.assertIsNotNone(result.modified_context)

    def test_cumulative_tracking(self):
        hook = TokenCounterHook()
        ctx1 = HookContext(usage={"total_tokens": 100})
        hook.execute(ctx1)
        ctx2 = HookContext(usage={"total_tokens": 200})
        hook.execute(ctx2)
        self.assertEqual(hook.total_tokens_used, 300)


class TestLatencyMonitorHook(unittest.TestCase):
    """Test latency monitoring hook."""

    def test_records_latency(self):
        hook = LatencyMonitorHook()
        ctx = HookContext(start_time=time.time() - 0.1)  # 100ms ago
        result = hook.execute(ctx)
        self.assertTrue(result.passed)
        self.assertIsNotNone(result.modified_context)
        latency = result.modified_context.metadata.get("latency_ms", 0)
        self.assertGreater(latency, 50)  # Should be > 50ms

    def test_no_start_time(self):
        hook = LatencyMonitorHook()
        ctx = HookContext(start_time=0.0)
        result = hook.execute(ctx)
        self.assertTrue(result.passed)


class TestErrorLoggerHook(unittest.TestCase):
    """Test error logger hook."""

    def test_logs_error(self):
        hook = ErrorLoggerHook()
        ctx = HookContext(
            provider="vertex",
            model="gemini",
            error=RuntimeError("test error"),
        )
        result = hook.execute(ctx)
        self.assertTrue(result.passed)

    def test_phase_is_on_error(self):
        hook = ErrorLoggerHook()
        self.assertEqual(hook.phase, HookPhase.ON_ERROR)


class TestHookPipeline(unittest.TestCase):
    """Test hook pipeline orchestration."""

    def test_register_and_list(self):
        pipeline = HookPipeline()
        pipeline.register(InputValidationHook())
        pipeline.register(OutputValidationHook())
        hooks = pipeline.list_hooks()
        self.assertIn("input_validation", hooks["pre_request"])
        self.assertIn("output_validation", hooks["post_request"])

    def test_pre_request_stops_on_failure(self):
        pipeline = HookPipeline()
        pipeline.register(InputValidationHook())
        ctx = HookContext(messages=[])
        results = pipeline.run_phase(HookPhase.PRE_REQUEST, ctx)
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].passed)

    def test_post_request_runs_all(self):
        pipeline = HookPipeline()
        pipeline.register(OutputValidationHook())
        pipeline.register(TokenCounterHook())
        ctx = HookContext(
            response_content="Hello",
            usage={"total_tokens": 50},
        )
        results = pipeline.run_phase(HookPhase.POST_REQUEST, ctx)
        self.assertEqual(len(results), 2)
        self.assertTrue(all(r.passed for r in results))

    def test_disabled_hook_skipped(self):
        pipeline = HookPipeline()
        hook = InputValidationHook()
        hook.enabled = False
        pipeline.register(hook)
        ctx = HookContext(messages=[])
        results = pipeline.run_phase(HookPhase.PRE_REQUEST, ctx)
        self.assertEqual(len(results), 0)

    def test_hook_crash_handled(self):
        """Hook that raises exception returns failed result."""

        class CrashingHook(Hook):
            def __init__(self):
                super().__init__("crasher")

            @property
            def phase(self):
                return HookPhase.PRE_REQUEST

            def execute(self, ctx):
                raise ValueError("boom")

        pipeline = HookPipeline()
        pipeline.register(CrashingHook())
        ctx = HookContext(messages=[{"role": "user", "content": "hi"}])
        results = pipeline.run_phase(HookPhase.PRE_REQUEST, ctx)
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].passed)
        self.assertIn("crashed", results[0].error_message)


class TestCreateDefaultPipeline(unittest.TestCase):
    """Test default pipeline factory."""

    def test_has_all_default_hooks(self):
        pipeline = create_default_pipeline()
        hooks = pipeline.list_hooks()
        self.assertIn("input_validation", hooks["pre_request"])
        self.assertIn("output_validation", hooks["post_request"])
        self.assertIn("token_counter", hooks["post_request"])
        self.assertIn("latency_monitor", hooks["post_request"])
        self.assertIn("error_logger", hooks["on_error"])


if __name__ == "__main__":
    unittest.main()

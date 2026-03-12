"""Tests for ExecutionContext — shared state container for PEV engine."""

from __future__ import annotations

import os
import sys
import threading


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.execution_context import ExecutionContext


class TestExecutionContextBasicStore:
    def test_set_and_get(self):
        ctx = ExecutionContext()
        ctx.set("key", "value")
        assert ctx.get("key") == "value"

    def test_get_default_when_missing(self):
        ctx = ExecutionContext()
        assert ctx.get("missing") is None
        assert ctx.get("missing", "fallback") == "fallback"

    def test_overwrite_existing_key(self):
        ctx = ExecutionContext()
        ctx.set("x", 1)
        ctx.set("x", 2)
        assert ctx.get("x") == 2

    def test_stores_non_string_values(self):
        ctx = ExecutionContext()
        ctx.set("num", 42)
        ctx.set("lst", [1, 2, 3])
        ctx.set("nested", {"a": {"b": True}})
        assert ctx.get("num") == 42
        assert ctx.get("lst") == [1, 2, 3]
        assert ctx.get("nested") == {"a": {"b": True}}


class TestExecutionContextStepOutputs:
    def test_record_and_retrieve_step_output(self):
        ctx = ExecutionContext()
        ctx.record_step_output(0, "hello world")
        assert ctx.get_step_output(0) == "hello world"

    def test_missing_step_output_returns_none(self):
        ctx = ExecutionContext()
        assert ctx.get_step_output(99) is None

    def test_multiple_steps_stored_independently(self):
        ctx = ExecutionContext()
        ctx.record_step_output(0, "step0 output")
        ctx.record_step_output(1, "step1 output")
        ctx.record_step_output(2, "step2 output")
        assert ctx.get_step_output(0) == "step0 output"
        assert ctx.get_step_output(1) == "step1 output"
        assert ctx.get_step_output(2) == "step2 output"

    def test_step_output_truncated_at_10kb(self):
        ctx = ExecutionContext()
        big = "x" * 20_000
        ctx.record_step_output(0, big)
        stored = ctx.get_step_output(0)
        assert stored is not None
        assert len(stored) == 10_240

    def test_step_output_under_limit_not_truncated(self):
        ctx = ExecutionContext()
        small = "y" * 100
        ctx.record_step_output(0, small)
        assert ctx.get_step_output(0) == small


class TestExecutionContextEnvVars:
    def test_set_and_get_env(self):
        ctx = ExecutionContext()
        ctx.set_env("MY_VAR", "my_value")
        assert ctx.get_env("MY_VAR") == "my_value"

    def test_get_env_missing_returns_none(self):
        ctx = ExecutionContext()
        assert ctx.get_env("NONEXISTENT") is None

    def test_overwrite_env_var(self):
        ctx = ExecutionContext()
        ctx.set_env("DB_URL", "old")
        ctx.set_env("DB_URL", "new")
        assert ctx.get_env("DB_URL") == "new"

    def test_env_isolated_from_data_store(self):
        ctx = ExecutionContext()
        ctx.set("KEY", "data-value")
        ctx.set_env("KEY", "env-value")
        assert ctx.get("KEY") == "data-value"
        assert ctx.get_env("KEY") == "env-value"


class TestExecutionContextSnapshot:
    def test_snapshot_contains_all_sections(self):
        ctx = ExecutionContext()
        ctx.set("a", 1)
        ctx.record_step_output(0, "out")
        ctx.set_env("X", "1")
        snap = ctx.snapshot()
        assert "data" in snap
        assert "step_outputs" in snap
        assert "env" in snap

    def test_snapshot_values_match_state(self):
        ctx = ExecutionContext()
        ctx.set("foo", "bar")
        ctx.record_step_output(1, "stdout")
        ctx.set_env("PATH", "/usr/bin")
        snap = ctx.snapshot()
        assert snap["data"]["foo"] == "bar"
        assert snap["step_outputs"][1] == "stdout"
        assert snap["env"]["PATH"] == "/usr/bin"

    def test_snapshot_is_independent_copy(self):
        """Mutations to snapshot must not affect original context."""
        ctx = ExecutionContext()
        ctx.set("list", [1, 2])
        snap = ctx.snapshot()
        snap["data"]["list"].append(3)
        assert ctx.get("list") == [1, 2]

    def test_snapshot_after_mutation_reflects_latest(self):
        ctx = ExecutionContext()
        ctx.set("v", 1)
        snap1 = ctx.snapshot()
        ctx.set("v", 2)
        snap2 = ctx.snapshot()
        assert snap1["data"]["v"] == 1
        assert snap2["data"]["v"] == 2


class TestExecutionContextClear:
    def test_clear_removes_all_state(self):
        ctx = ExecutionContext()
        ctx.set("k", "v")
        ctx.record_step_output(0, "out")
        ctx.set_env("E", "val")
        ctx.clear()
        assert ctx.get("k") is None
        assert ctx.get_step_output(0) is None
        assert ctx.get_env("E") is None

    def test_clear_then_reuse(self):
        ctx = ExecutionContext()
        ctx.set("x", 10)
        ctx.clear()
        ctx.set("x", 20)
        assert ctx.get("x") == 20


class TestExecutionContextThreadSafety:
    def test_concurrent_writes_no_race(self):
        """100 threads each write a unique key; all must be readable after."""
        ctx = ExecutionContext()
        n = 100
        barrier = threading.Barrier(n)

        def worker(i: int) -> None:
            barrier.wait()
            ctx.set(f"key_{i}", i)

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        for i in range(n):
            assert ctx.get(f"key_{i}") == i

    def test_concurrent_step_output_writes(self):
        """Multiple threads recording different step outputs stay consistent."""
        ctx = ExecutionContext()
        n = 50
        barrier = threading.Barrier(n)

        def worker(i: int) -> None:
            barrier.wait()
            ctx.record_step_output(i, f"output_{i}")

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        for i in range(n):
            assert ctx.get_step_output(i) == f"output_{i}"

    def test_snapshot_during_concurrent_writes_does_not_crash(self):
        """Snapshot taken while other threads write should not raise."""
        ctx = ExecutionContext()
        errors: list[Exception] = []

        def writer() -> None:
            for i in range(200):
                ctx.set(f"w_{i}", i)

        def reader() -> None:
            for _ in range(50):
                try:
                    snap = ctx.snapshot()
                    assert isinstance(snap, dict)
                except Exception as exc:  # noqa: BLE001
                    errors.append(exc)

        threads = [threading.Thread(target=writer) for _ in range(5)]
        threads += [threading.Thread(target=reader) for _ in range(3)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert errors == []

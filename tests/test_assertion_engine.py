"""Tests for AssertionEngine module.

Tests cover:
1. Built-in assertions: exit_code_zero, no_stderr, output_not_empty, no_timeout, no_exception
2. Custom assertion registration and override
3. run_assertions() with all/subset of assertions
4. all_passed() logic (only ERROR severity blocks)
5. Exception safety in check_fn
"""

from __future__ import annotations

import unittest

from src.core.assertion_engine import (
    Assertion,
    AssertionEngine,
    AssertionResult,
    AssertionSeverity,
)
from src.core.verifier import ExecutionResult


class TestAssertionSeverity(unittest.TestCase):
    """Test AssertionSeverity enum."""

    def test_values(self):
        self.assertEqual(AssertionSeverity.ERROR.value, "error")
        self.assertEqual(AssertionSeverity.WARNING.value, "warning")


class TestAssertionDataclass(unittest.TestCase):
    """Test Assertion dataclass."""

    def test_defaults(self):
        a = Assertion(name="test", check_fn=lambda r: True, message="ok")
        self.assertEqual(a.severity, AssertionSeverity.ERROR)

    def test_custom_severity(self):
        a = Assertion(
            name="warn", check_fn=lambda r: False,
            message="warn", severity=AssertionSeverity.WARNING,
        )
        self.assertEqual(a.severity, AssertionSeverity.WARNING)


class TestAssertionResultDataclass(unittest.TestCase):
    """Test AssertionResult dataclass."""

    def test_message_defaults_to_assertion_message(self):
        a = Assertion(name="x", check_fn=lambda r: True, message="assertion msg")
        result = AssertionResult(passed=True, assertion=a)
        self.assertEqual(result.message, "assertion msg")

    def test_message_override(self):
        a = Assertion(name="x", check_fn=lambda r: True, message="assertion msg")
        result = AssertionResult(passed=True, assertion=a, message="override")
        self.assertEqual(result.message, "override")


class TestBuiltinAssertions(unittest.TestCase):
    """Test built-in assertions registered at init."""

    def setUp(self):
        self.engine = AssertionEngine()

    def test_builtins_registered(self):
        names = self.engine.registered_names
        for expected in ["exit_code_zero", "no_stderr", "output_not_empty", "no_timeout", "no_exception"]:
            self.assertIn(expected, names)

    def test_exit_code_zero_passes(self):
        result = ExecutionResult(exit_code=0)
        results = self.engine.run_assertions(result, names=["exit_code_zero"])
        self.assertTrue(results[0].passed)

    def test_exit_code_zero_fails(self):
        result = ExecutionResult(exit_code=1)
        results = self.engine.run_assertions(result, names=["exit_code_zero"])
        self.assertFalse(results[0].passed)

    def test_no_stderr_passes_on_empty(self):
        result = ExecutionResult(stderr="")
        results = self.engine.run_assertions(result, names=["no_stderr"])
        self.assertTrue(results[0].passed)

    def test_no_stderr_fails_on_content(self):
        result = ExecutionResult(stderr="some error")
        results = self.engine.run_assertions(result, names=["no_stderr"])
        self.assertFalse(results[0].passed)

    def test_output_not_empty_passes(self):
        result = ExecutionResult(stdout="hello")
        results = self.engine.run_assertions(result, names=["output_not_empty"])
        self.assertTrue(results[0].passed)

    def test_output_not_empty_fails(self):
        result = ExecutionResult(stdout="   ")
        results = self.engine.run_assertions(result, names=["output_not_empty"])
        self.assertFalse(results[0].passed)

    def test_no_timeout_passes_without_error(self):
        result = ExecutionResult(error=None)
        results = self.engine.run_assertions(result, names=["no_timeout"])
        self.assertTrue(results[0].passed)

    def test_no_timeout_fails_on_timeout_error(self):
        result = ExecutionResult(error=TimeoutError("timed out"))
        results = self.engine.run_assertions(result, names=["no_timeout"])
        self.assertFalse(results[0].passed)

    def test_no_exception_passes_without_error(self):
        result = ExecutionResult(error=None)
        results = self.engine.run_assertions(result, names=["no_exception"])
        self.assertTrue(results[0].passed)

    def test_no_exception_fails_with_error(self):
        result = ExecutionResult(error=RuntimeError("boom"))
        results = self.engine.run_assertions(result, names=["no_exception"])
        self.assertFalse(results[0].passed)


class TestCustomAssertionRegistration(unittest.TestCase):
    """Test register_assertion and get_assertion."""

    def setUp(self):
        self.engine = AssertionEngine()

    def test_register_custom(self):
        a = Assertion(name="custom_check", check_fn=lambda r: True, message="custom")
        self.engine.register_assertion(a)
        self.assertIn("custom_check", self.engine.registered_names)

    def test_overwrite_existing(self):
        new_a = Assertion(name="exit_code_zero", check_fn=lambda r: False, message="overridden")
        self.engine.register_assertion(new_a)
        retrieved = self.engine.get_assertion("exit_code_zero")
        self.assertEqual(retrieved.message, "overridden")

    def test_get_unknown_returns_none(self):
        self.assertIsNone(self.engine.get_assertion("does_not_exist"))


class TestRunAssertions(unittest.TestCase):
    """Test run_assertions() method."""

    def setUp(self):
        self.engine = AssertionEngine()

    def test_run_all(self):
        result = ExecutionResult(exit_code=0, stdout="output", stderr="")
        results = self.engine.run_assertions(result)
        self.assertEqual(len(results), len(self.engine.registered_names))

    def test_run_subset(self):
        result = ExecutionResult(exit_code=0)
        results = self.engine.run_assertions(result, names=["exit_code_zero"])
        self.assertEqual(len(results), 1)

    def test_unknown_name_skipped(self):
        result = ExecutionResult()
        results = self.engine.run_assertions(result, names=["unknown_assertion"])
        self.assertEqual(len(results), 0)

    def test_exception_in_check_fn_caught(self):
        def bad_check(r):
            raise ValueError("unexpected")
        self.engine.register_assertion(Assertion(name="bad", check_fn=bad_check, message="bad"))
        result = ExecutionResult()
        results = self.engine.run_assertions(result, names=["bad"])
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].passed)
        self.assertIn("exception", results[0].message.lower())


class TestAllPassed(unittest.TestCase):
    """Test all_passed() logic."""

    def setUp(self):
        self.engine = AssertionEngine()

    def test_all_passed_true(self):
        a = Assertion(name="ok", check_fn=lambda r: True, message="ok")
        results = [AssertionResult(passed=True, assertion=a)]
        self.assertTrue(self.engine.all_passed(results))

    def test_error_failure_blocks(self):
        a = Assertion(name="err", check_fn=lambda r: False, message="fail",
                      severity=AssertionSeverity.ERROR)
        results = [AssertionResult(passed=False, assertion=a)]
        self.assertFalse(self.engine.all_passed(results))

    def test_warning_failure_does_not_block(self):
        a = Assertion(name="warn", check_fn=lambda r: False, message="warn",
                      severity=AssertionSeverity.WARNING)
        results = [AssertionResult(passed=False, assertion=a)]
        self.assertTrue(self.engine.all_passed(results))

    def test_empty_results_passes(self):
        self.assertTrue(self.engine.all_passed([]))


if __name__ == "__main__":
    unittest.main()

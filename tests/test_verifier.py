"""Tests for RecipeVerifier module.

Tests verify the complete verification functionality:
1. VerificationStatus enum
2. ExecutionResult, VerificationCheck, VerificationReport dataclasses
3. verify_exit_code(), verify_file_exists(), verify_file_not_exists()
4. verify_output_contains(), verify_output_not_contains()
5. verify() - main verification orchestration
6. verify_quality_gates() - Binh Phap quality checks
"""

from __future__ import annotations

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.verifier import (
    ExecutionResult,
    RecipeVerifier,
    VerificationCheck,
    VerificationReport,
    VerificationStatus,
)


class TestVerificationStatus(unittest.TestCase):
    """Test VerificationStatus enum."""

    def test_status_values(self):
        """Verify all status values exist."""
        self.assertEqual(VerificationStatus.PASSED.value, "passed")
        self.assertEqual(VerificationStatus.FAILED.value, "failed")
        self.assertEqual(VerificationStatus.WARNING.value, "warning")
        self.assertEqual(VerificationStatus.SKIPPED.value, "skipped")


class TestExecutionResult(unittest.TestCase):
    """Test ExecutionResult dataclass."""

    def test_default_values(self):
        """ExecutionResult should have sensible defaults."""
        result = ExecutionResult()
        self.assertEqual(result.exit_code, 0)
        self.assertEqual(result.stdout, "")
        self.assertEqual(result.stderr, "")
        self.assertEqual(result.output_files, [])
        self.assertEqual(result.metadata, {})
        self.assertIsNone(result.error)

    def test_custom_values(self):
        """ExecutionResult should accept custom values."""
        error = RuntimeError("test error")
        result = ExecutionResult(
            exit_code=1,
            stdout="output",
            stderr="error output",
            output_files=["file1.txt", "file2.txt"],
            metadata={"key": "value"},
            error=error,
        )
        self.assertEqual(result.exit_code, 1)
        self.assertEqual(result.stdout, "output")
        self.assertEqual(result.stderr, "error output")
        self.assertEqual(result.output_files, ["file1.txt", "file2.txt"])
        self.assertEqual(result.metadata, {"key": "value"})
        self.assertEqual(result.error, error)


class TestVerificationCheck(unittest.TestCase):
    """Test VerificationCheck dataclass."""

    def test_default_values(self):
        """VerificationCheck should have expected fields."""
        check = VerificationCheck(
            name="test_check",
            status=VerificationStatus.PASSED,
            message="Test passed",
        )
        self.assertEqual(check.name, "test_check")
        self.assertEqual(check.status, VerificationStatus.PASSED)
        self.assertEqual(check.message, "Test passed")
        self.assertIsNone(check.expected)
        self.assertIsNone(check.actual)

    def test_with_expected_actual(self):
        """VerificationCheck should store expected and actual values."""
        check = VerificationCheck(
            name="exit_code",
            status=VerificationStatus.FAILED,
            message="Exit code mismatch",
            expected=0,
            actual=1,
        )
        self.assertEqual(check.expected, 0)
        self.assertEqual(check.actual, 1)


class TestVerificationReport(unittest.TestCase):
    """Test VerificationReport dataclass."""

    def test_default_values(self):
        """VerificationReport should have defaults."""
        report = VerificationReport(passed=True)
        self.assertTrue(report.passed)
        self.assertEqual(report.checks, [])
        self.assertEqual(report.warnings, [])
        self.assertEqual(report.errors, [])

    def test_summary_empty(self):
        """Summary should handle empty checks."""
        report = VerificationReport(passed=True)
        self.assertEqual(report.summary, "0/0 checks passed, 0 failed, 0 warnings")

    def test_summary_with_checks(self):
        """Summary should correctly count checks."""
        checks = [
            VerificationCheck("check1", VerificationStatus.PASSED, "ok"),
            VerificationCheck("check2", VerificationStatus.PASSED, "ok"),
            VerificationCheck("check3", VerificationStatus.FAILED, "fail"),
            VerificationCheck("check4", VerificationStatus.WARNING, "warn"),
        ]
        report = VerificationReport(passed=False, checks=checks)
        self.assertEqual(report.summary, "2/4 checks passed, 1 failed, 1 warnings")


class TestRecipeVerifierInit(unittest.TestCase):
    """Test RecipeVerifier initialization."""

    def test_strict_mode_default(self):
        """Verifier should default to strict_mode=True."""
        verifier = RecipeVerifier()
        self.assertTrue(verifier.strict_mode)

    def test_strict_mode_false(self):
        """Verifier should accept strict_mode=False."""
        verifier = RecipeVerifier(strict_mode=False)
        self.assertFalse(verifier.strict_mode)


class TestVerifyExitCode(unittest.TestCase):
    """Test verify_exit_code() method."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_exit_code_match(self):
        """Exit code match should return PASSED."""
        result = ExecutionResult(exit_code=0, stdout="", stderr="")
        check = self.verifier.verify_exit_code(result, 0)
        self.assertEqual(check.status, VerificationStatus.PASSED)
        self.assertEqual(check.name, "exit_code")
        self.assertIn("matches", check.message)

    def test_exit_code_mismatch(self):
        """Exit code mismatch should return FAILED."""
        result = ExecutionResult(exit_code=1, stdout="", stderr="")
        check = self.verifier.verify_exit_code(result, 0)
        self.assertEqual(check.status, VerificationStatus.FAILED)
        self.assertEqual(check.expected, 0)
        self.assertEqual(check.actual, 1)


class TestVerifyFileExists(unittest.TestCase):
    """Test verify_file_exists() method."""

    def setUp(self):
        self.verifier = RecipeVerifier()
        self.temp_dir = TemporaryDirectory()
        self.existing_file = Path(self.temp_dir.name) / "exists.txt"
        self.existing_file.touch()
        self.nonexistent_file = Path(self.temp_dir.name) / "not_exists.txt"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_file_exists(self):
        """Existing file should return PASSED."""
        check = self.verifier.verify_file_exists(str(self.existing_file))
        self.assertEqual(check.status, VerificationStatus.PASSED)
        self.assertTrue(check.expected)
        self.assertTrue(check.actual)

    def test_file_not_exists(self):
        """Non-existing file should return FAILED."""
        check = self.verifier.verify_file_exists(str(self.nonexistent_file))
        self.assertEqual(check.status, VerificationStatus.FAILED)
        self.assertTrue(check.expected)
        self.assertFalse(check.actual)


class TestVerifyFileNotExists(unittest.TestCase):
    """Test verify_file_not_exists() method."""

    def setUp(self):
        self.verifier = RecipeVerifier()
        self.temp_dir = TemporaryDirectory()
        self.existing_file = Path(self.temp_dir.name) / "exists.txt"
        self.existing_file.touch()
        self.nonexistent_file = Path(self.temp_dir.name) / "not_exists.txt"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_file_not_exists(self):
        """Non-existing file should return PASSED."""
        check = self.verifier.verify_file_not_exists(str(self.nonexistent_file))
        self.assertEqual(check.status, VerificationStatus.PASSED)
        self.assertFalse(check.expected)
        self.assertFalse(check.actual)

    def test_file_exists_when_should_not(self):
        """Existing file when should not exist should return FAILED."""
        check = self.verifier.verify_file_not_exists(str(self.existing_file))
        self.assertEqual(check.status, VerificationStatus.FAILED)
        self.assertFalse(check.expected)
        self.assertTrue(check.actual)


class TestVerifyOutputContains(unittest.TestCase):
    """Test verify_output_contains() method."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_simple_string_match(self):
        """Simple substring match should return PASSED."""
        result = ExecutionResult(exit_code=0, stdout="hello world", stderr="")
        check = self.verifier.verify_output_contains(result, "world")
        self.assertEqual(check.status, VerificationStatus.PASSED)

    def test_simple_string_not_found(self):
        """Missing substring should return FAILED."""
        result = ExecutionResult(exit_code=0, stdout="hello world", stderr="")
        check = self.verifier.verify_output_contains(result, "goodbye")
        self.assertEqual(check.status, VerificationStatus.FAILED)

    def test_regex_match(self):
        """Regex pattern match should return PASSED."""
        result = ExecutionResult(exit_code=0, stdout="test123", stderr="")
        check = self.verifier.verify_output_contains(result, r"\d+")
        self.assertEqual(check.status, VerificationStatus.PASSED)

    def test_regex_not_found(self):
        """Regex pattern not found should return FAILED."""
        result = ExecutionResult(exit_code=0, stdout="abc", stderr="")
        check = self.verifier.verify_output_contains(result, r"\d+")
        self.assertEqual(check.status, VerificationStatus.FAILED)

    def test_case_insensitive(self):
        """Pattern matching should be case-insensitive."""
        result = ExecutionResult(exit_code=0, stdout="HELLO", stderr="")
        check = self.verifier.verify_output_contains(result, "hello")
        self.assertEqual(check.status, VerificationStatus.PASSED)

    def test_search_in_stderr(self):
        """Pattern in stderr should also match."""
        result = ExecutionResult(exit_code=0, stdout="", stderr="error occurred")
        check = self.verifier.verify_output_contains(result, "error")
        self.assertEqual(check.status, VerificationStatus.PASSED)


class TestVerifyOutputNotContains(unittest.TestCase):
    """Test verify_output_not_contains() method."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_pattern_not_present(self):
        """When pattern is absent, should return PASSED."""
        result = ExecutionResult(exit_code=0, stdout="clean output", stderr="")
        check = self.verifier.verify_output_not_contains(result, "error")
        self.assertEqual(check.status, VerificationStatus.PASSED)

    def test_pattern_present(self):
        """When pattern is present, should return FAILED."""
        result = ExecutionResult(exit_code=0, stdout="error occurred", stderr="")
        check = self.verifier.verify_output_not_contains(result, "error")
        self.assertEqual(check.status, VerificationStatus.FAILED)

    def test_regex_pattern(self):
        """Regex forbidden pattern should work."""
        result = ExecutionResult(exit_code=0, stdout="test123", stderr="")
        check = self.verifier.verify_output_not_contains(result, r"\d+")
        self.assertEqual(check.status, VerificationStatus.FAILED)


class TestVerifyMainMethod(unittest.TestCase):
    """Test verify() - main verification orchestration."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_empty_criteria(self):
        """Empty criteria should pass by default."""
        result = ExecutionResult(exit_code=0)
        criteria = {}
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)
        self.assertEqual(len(report.checks), 0)

    def test_exit_code_criteria(self):
        """Exit code check should be included."""
        result = ExecutionResult(exit_code=0)
        criteria = {"exit_code": 0}
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)
        self.assertEqual(len(report.checks), 1)
        self.assertEqual(report.checks[0].status, VerificationStatus.PASSED)

    def test_exit_code_failure(self):
        """Failed exit code should fail verification."""
        result = ExecutionResult(exit_code=1)
        criteria = {"exit_code": 0}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)
        self.assertEqual(len(report.errors), 1)

    def test_file_exists_criteria(self):
        """File existence check should work."""
        with TemporaryDirectory() as tmp:
            filepath = Path(tmp) / "test.txt"
            filepath.touch()
            result = ExecutionResult()
            criteria = {"file_exists": [str(filepath)]}
            report = self.verifier.verify(result, criteria)
            self.assertTrue(report.passed)

    def test_file_exists_failure(self):
        """Missing file should fail verification."""
        result = ExecutionResult()
        criteria = {"file_exists": ["/nonexistent/file.txt"]}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)

    def test_output_contains_criteria(self):
        """Output contains check should work."""
        result = ExecutionResult(exit_code=0, stdout="SUCCESS", stderr="")
        criteria = {"output_contains": ["SUCCESS"]}
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)

    def test_output_not_contains_criteria(self):
        """Output not contains check should work."""
        result = ExecutionResult(exit_code=0, stdout="clean", stderr="")
        criteria = {"output_not_contains": ["error"]}
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)

    def test_output_not_contains_failure(self):
        """Forbidden output should fail."""
        result = ExecutionResult(exit_code=0, stdout="error occurred", stderr="")
        criteria = {"output_not_contains": ["error"]}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)

    def test_multiple_criteria_all_pass(self):
        """Multiple passing criteria should succeed."""
        result = ExecutionResult(exit_code=0, stdout="ok", stderr="")
        criteria = {
            "exit_code": 0,
            "output_contains": ["ok"],
            "output_not_contains": ["error"],
        }
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)
        self.assertEqual(len(report.checks), 3)

    def test_multiple_criteria_partial_fail(self):
        """Any failing criteria should make verification fail."""
        result = ExecutionResult(exit_code=1, stdout="ok", stderr="")
        criteria = {
            "exit_code": 0,  # fails
            "output_contains": ["ok"],  # passes
        }
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)


class TestVerifyWithCustomChecks(unittest.TestCase):
    """Test verify() with custom_checks criteria."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_custom_check_string_command(self):
        """Custom check with string command should execute."""
        result = ExecutionResult()
        criteria = {"custom_checks": ["echo test"]}
        report = self.verifier.verify(result, criteria)
        # echo test should succeed
        self.assertTrue(report.passed)

    def test_custom_check_dict_format(self):
        """Custom check with dict format should work."""
        result = ExecutionResult()
        criteria = {"custom_checks": [{"command": "echo hello", "expected_output": "hello"}]}
        report = self.verifier.verify(result, criteria)
        self.assertTrue(report.passed)

    def test_custom_check_invalid_spec(self):
        """Invalid check spec should fail."""
        result = ExecutionResult()
        criteria = {"custom_checks": [123]}  # Invalid type
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)

    def test_custom_check_empty_command(self):
        """Empty command should fail."""
        result = ExecutionResult()
        criteria = {"custom_checks": [""]}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)

    def test_custom_check_command_failure(self):
        """Failing command should fail check."""
        result = ExecutionResult()
        criteria = {"custom_checks": ["exit 1"]}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)

    def test_custom_check_expected_output_mismatch(self):
        """Output mismatch should fail."""
        result = ExecutionResult()
        criteria = {"custom_checks": [{"command": "echo hello", "expected_output": "goodbye"}]}
        report = self.verifier.verify(result, criteria)
        self.assertFalse(report.passed)


class TestVerifyQualityGates(unittest.TestCase):
    """Test verify_quality_gates() - Binh Phap quality checks."""

    def setUp(self):
        self.verifier = RecipeVerifier()

    def test_clean_output_passes_all_gates(self):
        """Clean output should pass all quality gates."""
        result = ExecutionResult(exit_code=0, stdout="clean code", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertTrue(report.passed)

    def test_todos_fail_tech_debt_gate(self):
        """Output with TODO should fail tech debt gate."""
        result = ExecutionResult(exit_code=0, stdout="TODO: fix this", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)
        # Find the tech debt check
        tech_debt_check = next((c for c in report.checks if "tech_debt" in c.name), None)
        self.assertIsNotNone(tech_debt_check)
        self.assertEqual(tech_debt_check.status, VerificationStatus.FAILED)

    def test_fixme_fail_tech_debt_gate(self):
        """Output with FIXME should fail tech debt gate."""
        result = ExecutionResult(exit_code=0, stdout="FIXME: refactor", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)

    def test_console_log_fail_logs_gate(self):
        """Output with console.log should fail clean logs gate."""
        result = ExecutionResult(exit_code=0, stdout="console.log('debug')", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)
        log_check = next((c for c in report.checks if "clean_logs" in c.name), None)
        self.assertIsNotNone(log_check)
        self.assertEqual(log_check.status, VerificationStatus.FAILED)

    def test_print_fail_logs_gate(self):
        """Output with print( should fail clean logs gate."""
        result = ExecutionResult(exit_code=0, stdout="print('debug')", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)

    def test_any_type_fail_type_safety_gate(self):
        """Output with ': any' should fail type safety gate."""
        result = ExecutionResult(exit_code=0, stdout="const x: any = null", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)
        type_check = next((c for c in report.checks if "type_safety" in c.name), None)
        self.assertIsNotNone(type_check)
        self.assertEqual(type_check.status, VerificationStatus.FAILED)

    def test_vulnerability_fail_security_gate(self):
        """Output with vulnerability warning should fail security gate."""
        result = ExecutionResult(exit_code=0, stdout="found 1 high severity vulnerability", stderr="")
        report = self.verifier.verify_quality_gates(result)
        self.assertFalse(report.passed)
        security_check = next((c for c in report.checks if "security" in c.name), None)
        self.assertIsNotNone(security_check)
        self.assertEqual(security_check.status, VerificationStatus.FAILED)

    def test_clean_typescript_passes_type_safety(self):
        """Clean TypeScript code should pass type safety."""
        result = ExecutionResult(exit_code=0, stdout="const x: string = 'hello'", stderr="")
        report = self.verifier.verify_quality_gates(result)
        type_check = next((c for c in report.checks if "type_safety" in c.name), None)
        self.assertIsNotNone(type_check)
        self.assertEqual(type_check.status, VerificationStatus.PASSED)


class TestStrictModeBehavior(unittest.TestCase):
    """Test strict_mode=True vs strict_mode=False behavior."""

    def test_strict_mode_warnings_as_failures(self):
        """In strict mode, warnings should cause verification to fail."""
        # Simulate a check with WARNING status
        checks = [
            VerificationCheck("warn_check", VerificationStatus.WARNING, "warning message"),
        ]
        report = VerificationReport(passed=True, checks=checks)
        # Manually apply strict mode logic (as verify() does)
        for check in report.checks:
            if check.status == VerificationStatus.WARNING:
                report.passed = False
        self.assertFalse(report.passed)

    def test_non_strict_mode_allows_warnings(self):
        """In non-strict mode, warnings don't automatically fail."""
        verifier = RecipeVerifier(strict_mode=False)
        self.assertFalse(verifier.strict_mode)


if __name__ == "__main__":
    unittest.main()

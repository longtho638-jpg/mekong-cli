"""
Tests for RỪNG Test Runner.

Verify parallel execution, retry logic, and fast fail.
"""

import subprocess
import sys
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from scripts.test_runner import TestRunner


class TestTestRunner:
    """Test the test runner itself."""

    def test_init_defaults(self):
        """Test runner initializes with defaults."""
        runner = TestRunner()
        assert runner.verbose is False
        assert runner.fail_fast is False

    def test_init_custom(self):
        """Test runner initializes with custom values."""
        runner = TestRunner(verbose=True, fail_fast=True)
        assert runner.verbose is True
        assert runner.fail_fast is True

    @patch("subprocess.run")
    def test_run_success(self, mock_run):
        """Test successful test run."""
        mock_run.return_value = Mock(returncode=0)
        runner = TestRunner()

        result = runner.run(parallel=False, max_retries=0)

        assert result == 0
        mock_run.assert_called_once()

    @patch("subprocess.run")
    def test_run_failure_with_retry(self, mock_run):
        """Test failed run with retry."""
        mock_run.side_effect = [
            Mock(returncode=1),
            Mock(returncode=0),
        ]
        runner = TestRunner()

        result = runner.run(parallel=False, max_retries=2)

        assert result == 0
        assert mock_run.call_count == 2

    @patch("subprocess.run")
    def test_run_all_retries_fail(self, mock_run):
        """Test all retries failing."""
        mock_run.return_value = Mock(returncode=1)
        runner = TestRunner()

        result = runner.run(parallel=False, max_retries=2)

        assert result == 1
        assert mock_run.call_count == 3  # initial + 2 retries

    @patch("subprocess.run")
    def test_run_fail_fast_no_retry(self, mock_run):
        """Test fail fast skips retry."""
        mock_run.return_value = Mock(returncode=1)
        runner = TestRunner(fail_fast=True)

        result = runner.run(parallel=False, max_retries=2)

        assert result == 1
        mock_run.assert_called_once()  # No retry with fail-fast

    @patch("subprocess.run")
    def test_run_parallel_args(self, mock_run):
        """Test parallel execution args."""
        mock_run.return_value = Mock(returncode=0)
        runner = TestRunner()

        runner.run(parallel=True, max_retries=0)

        call_args = mock_run.call_args[0][0]
        assert "-n" in call_args
        assert "auto" in call_args

    @patch("subprocess.run")
    def test_run_verbose_args(self, mock_run):
        """Test verbose output args."""
        mock_run.return_value = Mock(returncode=0)
        runner = TestRunner(verbose=True)

        runner.run(parallel=False, max_retries=0)

        call_args = mock_run.call_args[0][0]
        assert "-v" in call_args
        assert "--tb=short" in call_args


class TestTestRunnerCLI:
    """Test test runner CLI."""

    def test_cli_help(self):
        """Test CLI shows help."""
        result = subprocess.run(
            [sys.executable, "-m", "scripts.test_runner", "--help"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent,
        )
        assert result.returncode == 0
        assert "RỪNG Test Runner" in result.stdout

    def test_cli_version_flag(self):
        """Test CLI accepts verbose flag."""
        result = subprocess.run(
            [sys.executable, "-m", "scripts.test_runner", "-v", "--help"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent,
        )
        # Help should work even with -v before --help
        assert "RỪNG Test Runner" in result.stdout


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

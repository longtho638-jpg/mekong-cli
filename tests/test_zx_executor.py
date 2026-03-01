"""Tests for zx_executor module — zx-inspired shell execution patterns."""

import os
import time
import pytest
from unittest.mock import patch
from src.core.zx_executor import (
    ProcessOutput,
    cd,
    within,
    shell,
    quote,
    retry,
    retry_shell,
    pipe,
)


class TestProcessOutput:
    """Tests for ProcessOutput dataclass."""

    def test_ok_returns_true_on_zero_exit(self) -> None:
        out = ProcessOutput(exit_code=0)
        assert out.ok is True
        assert out.failed is False

    def test_failed_returns_true_on_nonzero(self) -> None:
        out = ProcessOutput(exit_code=1)
        assert out.ok is False
        assert out.failed is True

    def test_lines_splits_stdout(self) -> None:
        out = ProcessOutput(stdout="line1\nline2\nline3\n")
        assert out.lines == ["line1", "line2", "line3"]

    def test_lines_empty_stdout(self) -> None:
        out = ProcessOutput(stdout="")
        assert out.lines == []

    def test_str_returns_stripped_stdout(self) -> None:
        out = ProcessOutput(stdout="  hello world  \n")
        assert str(out) == "hello world"

    def test_bool_true_on_success(self) -> None:
        out = ProcessOutput(exit_code=0)
        assert bool(out) is True

    def test_bool_false_on_failure(self) -> None:
        out = ProcessOutput(exit_code=1)
        assert bool(out) is False


class TestQuote:
    """Tests for shell-safe quoting."""

    def test_simple_string(self) -> None:
        assert quote("hello") == "hello"

    def test_string_with_spaces(self) -> None:
        result = quote("hello world")
        assert "hello world" in result
        # Should be quoted
        assert result.startswith("'") or result.startswith('"')

    def test_string_with_special_chars(self) -> None:
        result = quote("test; rm -rf /")
        # Must not allow command injection
        assert ";" not in result or result.startswith("'")


class TestCd:
    """Tests for context-managed cd()."""

    def test_changes_and_restores_directory(self, tmp_path) -> None:
        original = os.getcwd()
        with cd(str(tmp_path)) as target:
            assert os.getcwd() == str(tmp_path)
            assert target == str(tmp_path)
        assert os.getcwd() == original

    def test_restores_on_exception(self, tmp_path) -> None:
        original = os.getcwd()
        with pytest.raises(ValueError):
            with cd(str(tmp_path)):
                raise ValueError("test error")
        assert os.getcwd() == original

    def test_raises_on_nonexistent_dir(self) -> None:
        with pytest.raises(FileNotFoundError):
            with cd("/nonexistent/path/xyz"):
                pass


class TestWithin:
    """Tests for within() context preservation."""

    def test_preserves_cwd_across_chdir(self, tmp_path) -> None:
        original = os.getcwd()
        with within():
            os.chdir(tmp_path)
            assert os.getcwd() == str(tmp_path)
        assert os.getcwd() == original

    def test_preserves_on_exception(self, tmp_path) -> None:
        original = os.getcwd()
        with pytest.raises(RuntimeError):
            with within():
                os.chdir(tmp_path)
                raise RuntimeError("test")
        assert os.getcwd() == original


class TestShell:
    """Tests for enhanced shell execution."""

    def test_echo_command(self) -> None:
        result = shell("echo hello", nothrow=True)
        assert result.ok
        assert "hello" in result.stdout

    def test_exit_code_capture(self) -> None:
        result = shell("exit 0", nothrow=True)
        assert result.exit_code == 0

    def test_failed_command_nothrow(self) -> None:
        result = shell("exit 42", nothrow=True)
        assert result.exit_code == 42
        assert result.failed

    def test_failed_command_raises(self) -> None:
        with pytest.raises(RuntimeError, match="Command failed"):
            shell("exit 1")

    def test_quiet_suppresses_stderr_in_error(self) -> None:
        with pytest.raises(RuntimeError) as exc_info:
            shell("echo err >&2 && exit 1", quiet=True)
        assert "err" not in str(exc_info.value)

    def test_duration_tracked(self) -> None:
        result = shell("echo fast", nothrow=True)
        assert result.duration_ms >= 0

    def test_command_stored(self) -> None:
        result = shell("echo stored", nothrow=True)
        assert result.command == "echo stored"

    def test_cwd_parameter(self, tmp_path) -> None:
        result = shell("pwd", cwd=str(tmp_path), nothrow=True)
        assert str(tmp_path) in result.stdout

    def test_env_parameter(self) -> None:
        result = shell(
            "echo $TEST_ZX_VAR",
            env={"TEST_ZX_VAR": "zx_value"},
            nothrow=True,
        )
        assert "zx_value" in result.stdout

    def test_timeout_nothrow(self) -> None:
        result = shell("sleep 10", timeout=1, nothrow=True)
        assert result.exit_code == 124
        assert "Timed out" in result.stderr

    def test_timeout_raises(self) -> None:
        with pytest.raises(subprocess.TimeoutExpired):
            shell("sleep 10", timeout=1)


class TestRetry:
    """Tests for retry decorator."""

    def test_succeeds_first_try(self) -> None:
        call_count = 0

        @retry(count=3, delay=0.01)
        def succeed():
            nonlocal call_count
            call_count += 1
            return "ok"

        assert succeed() == "ok"
        assert call_count == 1

    def test_retries_on_failure(self) -> None:
        call_count = 0

        @retry(count=3, delay=0.01)
        def fail_twice():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("not yet")
            return "ok"

        assert fail_twice() == "ok"
        assert call_count == 3

    def test_raises_after_max_retries(self) -> None:
        @retry(count=2, delay=0.01)
        def always_fail():
            raise ValueError("always")

        with pytest.raises(ValueError, match="always"):
            always_fail()

    def test_on_retry_callback(self) -> None:
        retries_seen = []

        def tracker(attempt, exc):
            retries_seen.append(attempt)

        call_count = 0

        @retry(count=3, delay=0.01, on_retry=tracker)
        def fail_once():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ValueError("first fail")
            return "ok"

        fail_once()
        assert retries_seen == [1]


class TestRetryShell:
    """Tests for retry_shell convenience function."""

    def test_succeeds_immediately(self) -> None:
        result = retry_shell("echo ok", count=2, delay=0.01)
        assert result.ok
        assert "ok" in result.stdout

    def test_retries_failing_command(self) -> None:
        # Command always fails — should exhaust retries then return nothrow result
        result = retry_shell("exit 1", count=2, delay=0.01)
        assert result.exit_code == 1


class TestPipe:
    """Tests for pipe() multi-command chaining."""

    def test_simple_pipe(self) -> None:
        result = pipe("echo hello world", "tr ' ' '\\n'")
        assert result.ok
        assert "hello" in result.stdout

    def test_pipe_with_grep(self) -> None:
        result = pipe("echo -e 'foo\\nbar\\nbaz'", "grep bar")
        assert result.ok
        assert "bar" in result.stdout

    def test_pipe_three_commands(self) -> None:
        result = pipe("echo abc", "tr 'a' 'x'", "tr 'b' 'y'")
        assert result.ok
        assert "xyc" in result.stdout


# Need subprocess import for TestShell.test_timeout_raises
import subprocess

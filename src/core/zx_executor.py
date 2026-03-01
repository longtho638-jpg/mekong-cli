"""
Mekong CLI - ZX-Inspired Shell Executor

Enhanced shell execution inspired by google/zx patterns:
- cd()/within() context-managed working directory
- retry() with configurable attempts and exponential backoff
- nothrow()/quiet() error suppression wrappers
- ProcessOutput with pipe-aware stdout/stderr/exitCode
- Safe quoting and escaping

Binh Phap Ch.4 軍形: Defense through safe, structured shell execution.
"""

import os
import subprocess
import shlex
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Generator, List, Optional


@dataclass
class ProcessOutput:
    """Enhanced execution result inspired by zx's ProcessOutput.

    Provides structured access to command results with
    string conversion, exit code, and combined output.
    """

    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    command: str = ""
    duration_ms: float = 0.0

    @property
    def ok(self) -> bool:
        """True if command succeeded (exit code 0)."""
        return self.exit_code == 0

    @property
    def failed(self) -> bool:
        """True if command failed (non-zero exit code)."""
        return self.exit_code != 0

    @property
    def lines(self) -> List[str]:
        """Split stdout into lines, stripping trailing empty line."""
        text = self.stdout.rstrip("\n")
        return text.split("\n") if text else []

    def __str__(self) -> str:
        """String representation returns stdout content."""
        return self.stdout.strip()

    def __bool__(self) -> bool:
        """Boolean conversion returns True if command succeeded."""
        return self.ok


def quote(arg: str) -> str:
    """Shell-safe quoting for a single argument.

    Uses shlex.quote for POSIX-safe escaping, preventing
    command injection from user-supplied strings.

    Args:
        arg: Raw string to quote for shell use.

    Returns:
        Shell-safe quoted string.
    """
    return shlex.quote(arg)


@contextmanager
def cd(directory: str) -> Generator[str, None, None]:
    """Context manager that changes working directory and restores on exit.

    Inspired by zx's cd() — provides safe directory switching
    with guaranteed restoration even on exceptions.

    Args:
        directory: Target directory path (absolute or relative).

    Yields:
        Resolved absolute path of the target directory.

    Raises:
        FileNotFoundError: If directory does not exist.
    """
    target = Path(directory).resolve()
    if not target.is_dir():
        raise FileNotFoundError(f"Directory not found: {directory}")

    previous = os.getcwd()
    try:
        os.chdir(target)
        yield str(target)
    finally:
        os.chdir(previous)


@contextmanager
def within() -> Generator[None, None, None]:
    """Context manager preserving current directory across operations.

    Inspired by zx's within() — any cd() calls inside the block
    are automatically reverted when the block exits.

    Yields:
        None — directory is automatically restored on exit.
    """
    saved = os.getcwd()
    try:
        yield
    finally:
        os.chdir(saved)


def shell(
    command: str,
    cwd: Optional[str] = None,
    timeout: int = 120,
    env: Optional[dict] = None,
    quiet: bool = False,
    nothrow: bool = False,
) -> ProcessOutput:
    """Execute a shell command with enhanced safety and output handling.

    Core execution function inspired by zx's $ template literal.
    Provides structured output, timing, and error control.

    Args:
        command: Shell command string to execute.
        cwd: Working directory (None = current directory).
        timeout: Maximum seconds before timeout (default 120).
        env: Additional environment variables to merge.
        quiet: If True, suppress stderr in error messages.
        nothrow: If True, don't raise on non-zero exit code.

    Returns:
        ProcessOutput with stdout, stderr, exit_code, timing.

    Raises:
        subprocess.TimeoutExpired: If command exceeds timeout.
        RuntimeError: If command fails and nothrow=False.
    """
    merged_env = None
    if env:
        merged_env = {**os.environ, **env}

    start = time.monotonic()
    try:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=merged_env,
        )

        duration = (time.monotonic() - start) * 1000

        output = ProcessOutput(
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            exit_code=proc.returncode,
            command=command,
            duration_ms=duration,
        )

        if output.failed and not nothrow:
            err_detail = "" if quiet else f": {output.stderr.strip()[:200]}"
            raise RuntimeError(
                f"Command failed (exit {output.exit_code}){err_detail}"
            )

        return output

    except subprocess.TimeoutExpired:
        duration = (time.monotonic() - start) * 1000
        if nothrow:
            return ProcessOutput(
                stdout="",
                stderr=f"Timed out after {timeout}s",
                exit_code=124,
                command=command,
                duration_ms=duration,
            )
        raise


def retry(
    count: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    on_retry: Optional[Callable[[int, Exception], None]] = None,
) -> Callable:
    """Decorator for retrying functions with exponential backoff.

    Inspired by zx's retry() — wraps any callable with automatic
    retry logic on failure.

    Args:
        count: Maximum number of retry attempts (default 3).
        delay: Initial delay between retries in seconds (default 1.0).
        backoff: Multiplier for delay after each attempt (default 2.0).
        on_retry: Optional callback(attempt, exception) on each retry.

    Returns:
        Decorator function that wraps the target callable.
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):  # type: ignore[no-untyped-def]
            last_error: Optional[Exception] = None
            current_delay = delay

            for attempt in range(1, count + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < count:
                        if on_retry:
                            on_retry(attempt, e)
                        time.sleep(current_delay)
                        current_delay *= backoff

            raise last_error  # type: ignore[misc]
        return wrapper
    return decorator


def retry_shell(
    command: str,
    count: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    **shell_kwargs,
) -> ProcessOutput:
    """Execute a shell command with automatic retry on failure.

    Convenience function combining shell() with retry logic.

    Args:
        command: Shell command to execute.
        count: Maximum retry attempts (default 3).
        delay: Initial delay between retries (default 1.0s).
        backoff: Delay multiplier per attempt (default 2.0).
        **shell_kwargs: Additional kwargs passed to shell().

    Returns:
        ProcessOutput from the first successful execution.

    Raises:
        RuntimeError: If all attempts fail (and nothrow=False).
    """
    current_delay = delay

    for attempt in range(1, count + 1):
        try:
            return shell(command, **shell_kwargs)
        except Exception:
            if attempt < count:
                time.sleep(current_delay)
                current_delay *= backoff

    # Final attempt with nothrow to capture output
    return shell(command, nothrow=True, **shell_kwargs)


def pipe(*commands: str, cwd: Optional[str] = None, timeout: int = 120) -> ProcessOutput:
    """Execute multiple commands piped together.

    Chains commands using shell pipe (|) operator for
    streaming data between processes.

    Args:
        *commands: Two or more commands to pipe together.
        cwd: Working directory for execution.
        timeout: Maximum seconds for the entire pipeline.

    Returns:
        ProcessOutput from the final command in the pipeline.
    """
    pipeline = " | ".join(commands)
    return shell(pipeline, cwd=cwd, timeout=timeout, nothrow=True)


__all__ = [
    "ProcessOutput",
    "cd",
    "within",
    "shell",
    "quote",
    "retry",
    "retry_shell",
    "pipe",
]

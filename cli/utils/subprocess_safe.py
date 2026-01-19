"""
🛡️ Subprocess Safety Wrapper
==============================

Secure subprocess execution with input validation, timeout handling, and injection prevention.

Security Features:
- Command must be list (prevents shell injection)
- Input sanitization with shlex.quote
- Timeout enforcement (default 30s)
- Shell=False by default (99% of cases)
- Proper error handling

Usage:
    from cli.utils.subprocess_safe import run_safe

    # ✅ SAFE: Command as list
    result = run_safe(['ls', '-la'])

    # ✅ SAFE: With timeout
    result = run_safe(['pytest'], timeout=300)

    # ❌ DANGEROUS: Never pass strings
    # result = run_safe("ls -la")  # Raises SubprocessError
"""

import logging
import shlex
import subprocess
from typing import List, Optional

logger = logging.getLogger(__name__)


class SubprocessError(Exception):
    """Custom exception for subprocess execution errors."""
    pass


def run_safe(
    command: List[str],
    timeout: int = 30,
    allow_shell: bool = False,
    check: bool = True,
    capture_output: bool = True,
) -> subprocess.CompletedProcess:
    """
    Safe subprocess execution with validation.

    Args:
        command: Command as list (NOT string to prevent injection)
        timeout: Execution timeout in seconds (default 30s)
        allow_shell: DANGEROUS - only if absolutely necessary (default False)
        check: Raise exception on non-zero exit (default True)
        capture_output: Capture stdout/stderr (default True)

    Returns:
        subprocess.CompletedProcess: Completed process result

    Raises:
        SubprocessError: If command format is invalid, times out, or fails

    Examples:
        >>> result = run_safe(['echo', 'hello'])
        >>> result.stdout
        'hello\\n'

        >>> result = run_safe(['git', 'status'], timeout=10)
        >>> result.returncode
        0
    """
    # Validate command is list
    if not isinstance(command, list):
        raise SubprocessError(
            f"Command must be list, not {type(command).__name__}. "
            "This prevents shell injection attacks."
        )

    # Validate command is not empty
    if not command or not command[0]:
        raise SubprocessError("Command list cannot be empty")

    # Validate timeout
    if timeout <= 0:
        raise SubprocessError(f"Timeout must be positive, got {timeout}")

    # Sanitize each argument if shell mode is enabled
    if allow_shell:
        logger.warning(
            f"Shell mode enabled for command: {command[0]}. "
            "This is potentially dangerous. Ensure input is trusted."
        )
        sanitized = [shlex.quote(str(arg)) for arg in command]
    else:
        # Even without shell, convert to strings
        sanitized = [str(arg) for arg in command]

    # Log command execution
    logger.debug(f"Executing: {' '.join(sanitized)}")

    try:
        result = subprocess.run(
            sanitized,
            capture_output=capture_output,
            text=True,
            timeout=timeout,
            check=check,
            shell=allow_shell,  # Should be False in 99% of cases
        )

        logger.debug(f"Command completed: returncode={result.returncode}")
        return result

    except subprocess.TimeoutExpired as e:
        error_msg = f"Command timed out after {timeout}s: {command[0]}"
        logger.error(error_msg)
        raise SubprocessError(error_msg) from e

    except subprocess.CalledProcessError as e:
        error_msg = f"Command failed (exit {e.returncode}): {e.stderr or e.stdout}"
        logger.error(error_msg)
        raise SubprocessError(error_msg) from e

    except FileNotFoundError as e:
        error_msg = f"Command not found: {command[0]}"
        logger.error(error_msg)
        raise SubprocessError(error_msg) from e

    except Exception as e:
        error_msg = f"Unexpected error executing command: {e}"
        logger.error(error_msg)
        raise SubprocessError(error_msg) from e


def run_safe_silent(command: List[str], **kwargs) -> bool:
    """
    Execute command safely without raising exceptions.

    Useful for optional commands that may fail gracefully.

    Args:
        command: Command list to execute
        **kwargs: Additional arguments passed to run_safe

    Returns:
        bool: True if command succeeded (exit code 0), False otherwise

    Examples:
        >>> if run_safe_silent(['which', 'git']):
        ...     print("Git is installed")
    """
    try:
        result = run_safe(command, check=False, **kwargs)
        return result.returncode == 0
    except SubprocessError:
        return False

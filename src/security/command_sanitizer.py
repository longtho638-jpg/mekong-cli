"""
Command Sanitizer - CLI Command Injection Prevention

Protects against command injection attacks by sanitizing shell commands
before execution. Validates and escapes dangerous characters/patterns.
"""

import re
import shlex
from typing import Optional
from dataclasses import dataclass


@dataclass
class SanitizationResult:
    """Result of command sanitization."""
    is_safe: bool
    sanitized_command: str
    warnings: list[str]
    blocked_patterns: list[str]


class CommandSanitizer:
    """Sanitizes shell commands to prevent injection attacks."""

    # Dangerous patterns that indicate potential injection
    DANGEROUS_PATTERNS = {
        "command_substitution": r"\$\(.*?\)|`.*?`",  # $(cmd) or `cmd`
        "pipe_injection": r"\|.*(?:bash|sh|curl|wget|nc|netcat)",  # | bash, | sh
        "redirect_danger": r">\s*/etc/|>\s*/root/|>\s*/var/",  # > /etc/...
        "eval_exec": r"\b(eval|exec|system|os\.system|subprocess)\s*\(",  # eval(), exec()
        "base64_decode": r"base64\s+(-d|--decode)",  # base64 -d
        "curl_pipe_bash": r"curl.*\|\s*(?:bash|sh)",  # curl | bash
        "wget_pipe_bash": r"wget.*\|\s*(?:bash|sh)",  # wget | bash
        "python_eval": r"python.*-c\s+['\"]eval",  # python -c 'eval
        "rm_rf_root": r"rm\s+(-rf|-fr)\s+/",  # rm -rf /
        "chmod_recursive": r"chmod\s+-R\s+777",  # chmod -R 777
        "dd_dangerous": r"\bdd\s+.*if=/dev/zero",  # dd if=/dev/zero
        "mkfs_dangerous": r"\bmkfs\.",  # mkfs.*
        "fork_bomb": r":\(\){:|:&\};:",  # :(){:|:&};:
    }

    # Suspicious but not always malicious
    SUSPICIOUS_PATTERNS = {
        "env_var_read": r"\$\{?[A-Z_]*?(?:KEY|SECRET|PASSWORD|TOKEN|CREDENTIAL)",  # $SECRET
        "process_substitution": r"<\(.*?\)",  # <(cmd)
        "here_doc": r"<<\s*['\"]?(\w+)['\"]?",  # <<EOF
    }

    # Safe shell commands (whitelist for common operations)
    SAFE_COMMANDS = {
        "file_ops": ["ls", "cat", "head", "tail", "grep", "find", "pwd", "which", "whoami"],
        "git": ["git"],
        "python": ["python", "python3", "pip", "pip3", "pytest", "ruff", "mypy"],
        "node": ["node", "npm", "pnpm", "yarn", "npx"],
        "build": ["make", "cmake", "cargo", "go"],
    }

    def __init__(self, strict_mode: bool = True):
        """
        Initialize CommandSanitizer.

        Args:
            strict_mode: If True, block all dangerous patterns.
                        If False, only warn but allow execution.
        """
        self.strict_mode = strict_mode
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Pre-compile regex patterns for performance."""
        self._dangerous_regex = {
            name: re.compile(pattern, re.IGNORECASE)
            for name, pattern in self.DANGEROUS_PATTERNS.items()
        }
        self._suspicious_regex = {
            name: re.compile(pattern, re.IGNORECASE)
            for name, pattern in self.SUSPICIOUS_PATTERNS.items()
        }

    def sanitize(self, command: str) -> SanitizationResult:
        """
        Sanitize a shell command string.

        Args:
            command: The shell command to sanitize

        Returns:
            SanitizationResult with safety assessment
        """
        warnings: list[str] = []
        blocked: list[str] = []

        # Check for dangerous patterns
        for name, regex in self._dangerous_regex.items():
            if regex.search(command):
                blocked.append(name)
                if self.strict_mode:
                    return SanitizationResult(
                        is_safe=False,
                        sanitized_command=command,
                        warnings=warnings,
                        blocked_patterns=blocked,
                    )

        # Check for suspicious patterns (warn only)
        for name, regex in self._suspicious_regex.items():
            if regex.search(command):
                warnings.append(f"Suspicious pattern detected: {name}")

        # Attempt to safely escape the command
        try:
            # Use shlex.quote to escape shell special characters
            parts = shlex.split(command, comments=True)
            sanitized = " ".join(shlex.quote(part) for part in parts if part)
        except ValueError:
            # If shlex.split fails, use original command with warning
            sanitized = command
            warnings.append("Command parsing failed - using original command")

        return SanitizationResult(
            is_safe=len(blocked) == 0,
            sanitized_command=sanitized,
            warnings=warnings,
            blocked_patterns=blocked,
        )

    def is_command_safe(self, command: str) -> bool:
        """
        Quick safety check without full sanitization.

        Args:
            command: The shell command to check

        Returns:
            True if command appears safe, False otherwise
        """
        result = self.sanitize(command)
        return result.is_safe

    def get_safe_command_list(self, commands: list[str]) -> list[str]:
        """
        Filter a list of commands, returning only safe ones.

        Args:
            commands: List of shell commands

        Returns:
            List of commands that passed sanitization
        """
        safe_commands = []
        for cmd in commands:
            if self.is_command_safe(cmd):
                safe_commands.append(cmd)
        return safe_commands


# Pre-compiled sanitizer for module-level use
_default_sanitizer: Optional[CommandSanitizer] = None


def get_sanitizer(strict_mode: bool = True) -> CommandSanitizer:
    """Get or create the default command sanitizer."""
    global _default_sanitizer
    if _default_sanitizer is None:
        _default_sanitizer = CommandSanitizer(strict_mode=strict_mode)
    return _default_sanitizer


def sanitize_command(command: str, strict_mode: bool = True) -> SanitizationResult:
    """
    Convenience function to sanitize a single command.

    Args:
        command: Shell command to sanitize
        strict_mode: Enable strict blocking mode

    Returns:
        SanitizationResult
    """
    return get_sanitizer(strict_mode).sanitize(command)


def is_safe_command(command: str) -> bool:
    """Quick safety check for a command."""
    return get_sanitizer().is_command_safe(command)

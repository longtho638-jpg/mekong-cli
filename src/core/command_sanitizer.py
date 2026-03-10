"""Mekong CLI - Command Sanitizer.

Security utility for sanitizing and validating shell commands
before execution to prevent injection attacks.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class SanitizationResult:
    """Result of command sanitization.

    Attributes:
        is_safe: Whether the command is safe to execute
        sanitized_command: The sanitized command string
        blocked_patterns: List of dangerous patterns found
        warnings: List of warning messages
        blocked_reason: Reason for blocking (if any)
    """

    is_safe: bool = True
    sanitized_command: str = ""
    blocked_patterns: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    blocked_reason: str = ""


class CommandSanitizer:
    """Sanitizes shell commands to prevent injection attacks.

    Usage:
        sanitizer = CommandSanitizer()
        result = sanitizer.sanitize("rm -rf /tmp/cache")
        if result.is_safe:
            execute(result.sanitized_command)
        else:
            log(f"Blocked: {result.blocked_reason}")
    """

    # Dangerous patterns that should be BLOCKED
    DANGEROUS_PATTERNS = [
        # Command injection
        (r";\s*\S+", "command_separator"),  # Semicolon injection
        (r"\|\|", "pipe_or"),  # OR pipe injection
        (r"\|\s*\S+", "pipe_injection"),  # Pipe to another command
        (r"&&\s*\S+", "command_chain"),  # AND chain injection
        (r"`[^`]+`", "backtick_execution"),  # Backtick command substitution
        (r"\$\(.*\)", "dollar_paren_execution"),  # $(command) substitution
        (r"\$\{.*\}", "dollar_brace_execution"),  # ${var} injection
        # Filesystem destruction
        (r"rm\s+(-[rf]+\s+)?/", "rm_root"),  # rm on root directory
        (r"rm\s+(-[rf]+\s+)?\*", "rm_glob"),  # rm with glob wildcard
        (r">\s*/", "redirect_to_root"),  # Redirect to root filesystem
        # Network exfiltration
        (r"curl\s+.*\|\s*(ba)?sh", "curl_pipe_shell"),  # curl | sh
        (r"wget\s+.*\|\s*(ba)?sh", "wget_pipe_shell"),  # wget | sh
        (r"(curl|wget)\s+.*-o\s+~", "download_to_home"),  # Download to home
        # Privilege escalation
        (r"sudo\s+", "sudo_execution"),  # Sudo commands
        (r"su\s+", "su_execution"),  # Su commands
        (r"chmod\s+[0-7]{3,4}\s+", "chmod_execution"),  # Chmod commands
        (r"chown\s+", "chown_execution"),  # Chown commands
        # Process manipulation
        (r"nohup\s+", "nohup_execution"),  # Nohup backgrounding
        (r"(?<![a-z])at\s+", "at_scheduling"),  # At command scheduling
        (r"cron", "cron_manipulation"),  # Cron manipulation
        # Environment manipulation
        (r"export\s+[A-Z_]+=", "export_env"),  # Export environment vars
        (r"unset\s+", "unset_env"),  # Unset environment vars
    ]

    # Suspicious patterns that trigger WARNINGS (not blocked)
    SUSPICIOUS_PATTERNS = [
        (r"eval\s+", "eval_usage"),  # Eval keyword
        (r"exec\s+", "exec_usage"),  # Exec keyword
        (r"python.*-c\s+", "python_exec"),  # Python -c execution
        (r"node.*-e\s+", "node_exec"),  # Node -e execution
        (r"/dev/(tcp|udp)", "dev_tcp"),  # /dev/tcp usage
        (r"nc\s+", "netcat_usage"),  # Netcat usage
        (r"base64\s+-d", "base64_decode"),  # Base64 decode
        (r">\s*\.", "dot_redirect"),  # Redirect to current dir
        (r"\.\./", "parent_dir_access"),  # Parent directory access
    ]

    # Commands that require strict mode to block
    STRICT_MODE_COMMANDS = [
        "rm",
        "mv",
        "cp",
        "dd",
        "mkfs",
        "fdisk",
        "parted",
    ]

    def __init__(
        self,
        strict_mode: bool = False,
        allow_patterns: list[str] | None = None,
        deny_patterns: list[str] | None = None,
    ) -> None:
        """Initialize CommandSanitizer.

        Args:
            strict_mode: If True, block suspicious patterns too
            allow_patterns: Custom patterns to allow (whitelist)
            deny_patterns: Custom patterns to deny (blacklist)

        """
        self.strict_mode = strict_mode
        self.allow_patterns = allow_patterns or []
        self.deny_patterns = deny_patterns or []

        # Compile regex patterns
        self._dangerous_regex = [
            (re.compile(pattern, re.IGNORECASE), name)
            for pattern, name in self.DANGEROUS_PATTERNS
        ]
        self._suspicious_regex = [
            (re.compile(pattern, re.IGNORECASE), name)
            for pattern, name in self.SUSPICIOUS_PATTERNS
        ]

    def sanitize(self, command: str) -> SanitizationResult:
        """Sanitize a shell command.

        Args:
            command: The command string to sanitize

        Returns:
            SanitizationResult with safety status and details

        """
        result = SanitizationResult(
            is_safe=True,
            sanitized_command=command.strip(),
        )

        if not command or not command.strip():
            result.is_safe = False
            result.blocked_reason = "Empty command"
            return result

        # Check deny list patterns first
        for pattern_str in self.deny_patterns:
            try:
                if re.search(pattern_str, command, re.IGNORECASE):
                    result.is_safe = False
                    result.blocked_patterns.append(f"custom_deny:{pattern_str}")
                    result.blocked_reason = f"Matches custom deny pattern: {pattern_str}"
            except re.error:
                pass

        # Check dangerous patterns
        for regex, name in self._dangerous_regex:
            if regex.search(command):
                result.is_safe = False
                result.blocked_patterns.append(name)
                result.warnings.append(f"Dangerous pattern detected: {name}")

        # Set blocked reason if not safe
        if not result.is_safe:
            result.blocked_reason = (
                f"Dangerous patterns detected: {', '.join(result.blocked_patterns)}"
            )
            return result

        # Check suspicious patterns (warnings only, unless strict mode)
        for regex, name in self._suspicious_regex:
            if regex.search(command):
                result.warnings.append(f"Suspicious pattern: {name}")
                if self.strict_mode:
                    result.is_safe = False
                    result.blocked_patterns.append(name)

        # Check allow list patterns (these override blocks)
        for pattern_str in self.allow_patterns:
            try:
                if re.search(pattern_str, command, re.IGNORECASE):
                    result.warnings.append(
                        f"Command matches allow pattern: {pattern_str}",
                    )
            except re.error:
                pass

        # Additional validation for strict mode
        if self.strict_mode:
            self._apply_strict_mode_checks(command, result)

        return result

    def _apply_strict_mode_checks(
        self,
        command: str,
        result: SanitizationResult,
    ) -> None:
        """Apply additional strict mode checks.

        Args:
            command: Original command string
            result: SanitizationResult to update

        """
        # Check for strict mode commands
        cmd_parts = command.split()
        if cmd_parts and cmd_parts[0] in self.STRICT_MODE_COMMANDS:
            result.warnings.append(
                f"Strict mode: '{cmd_parts[0]}' command requires review",
            )

        # Check for multiple commands in one line
        command_separators = len(re.findall(r"[;&|]", command))
        if command_separators > 1:
            result.warnings.append(
                f"Multiple command separators detected: {command_separators}",
            )

        # Check for very long commands (potential obfuscation)
        if len(command) > 500:
            result.warnings.append(
                f"Command unusually long ({len(command)} chars) - potential obfuscation",
            )

    def is_safe_command(self, command: str) -> bool:
        """Quick check if command is safe.

        Args:
            command: Command string to check

        Returns:
            True if safe, False otherwise

        """
        return self.sanitize(command).is_safe

    def get_blocked_reason(self, command: str) -> str:
        """Get reason why command was blocked.

        Args:
            command: Command string that was blocked

        Returns:
            Human-readable reason for blocking

        """
        result = self.sanitize(command)
        return result.blocked_reason or "Command is safe"


# Singleton instance
_sanitizer: CommandSanitizer | None = None


def get_sanitizer(strict_mode: bool = False) -> CommandSanitizer:
    """Get or create global CommandSanitizer instance.

    Args:
        strict_mode: If True, use strict sanitization rules

    Returns:
        CommandSanitizer instance

    """
    global _sanitizer
    if _sanitizer is None:
        _sanitizer = CommandSanitizer(strict_mode=strict_mode)
    return _sanitizer


__all__ = [
    "CommandSanitizer",
    "SanitizationResult",
    "get_sanitizer",
]

"""Mekong CLI - Error Pattern Detector.

Scans command output for known error patterns and classifies them
with severity and remediation suggestions.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ErrorPattern:
    """Defines a named error pattern to scan for.

    Attributes:
        name: Unique identifier for this pattern.
        pattern: Regex pattern string to match against output.
        severity: One of 'critical', 'error', 'warning'.
        category: Logical grouping (e.g. 'runtime', 'network', 'syntax').
        suggestion: Remediation hint shown when pattern is detected.

    """

    name: str
    pattern: str
    severity: str
    category: str
    suggestion: str = ""


@dataclass
class DetectedError:
    """A single match found during output scanning.

    Attributes:
        pattern: The ErrorPattern that triggered.
        match_text: The actual text that matched.
        line_number: 1-based line number of the match (0 if unknown).
        context: Surrounding lines for context.

    """

    pattern: ErrorPattern
    match_text: str
    line_number: int = 0
    context: str = ""


_BUILTIN_PATTERNS: List[ErrorPattern] = [
    ErrorPattern(
        name="stack_trace",
        pattern=r"Traceback \(most recent call last\)|at \w+\.\w+\(",
        severity="error",
        category="runtime",
        suggestion="Check the stack trace above for the root cause.",
    ),
    ErrorPattern(
        name="permission_denied",
        pattern=r"[Pp]ermission denied|EACCES|EPERM",
        severity="error",
        category="filesystem",
        suggestion="Run with elevated permissions or fix file/directory ownership.",
    ),
    ErrorPattern(
        name="connection_refused",
        pattern=r"[Cc]onnection refused|ECONNREFUSED",
        severity="error",
        category="network",
        suggestion="Ensure the target service is running and reachable.",
    ),
    ErrorPattern(
        name="out_of_memory",
        pattern=r"[Oo]ut of [Mm]emory|MemoryError|ENOMEM|Killed",
        severity="critical",
        category="resource",
        suggestion="Reduce memory usage or increase available RAM.",
    ),
    ErrorPattern(
        name="syntax_error",
        pattern=r"SyntaxError|[Ss]yntax error|unexpected token",
        severity="error",
        category="syntax",
        suggestion="Fix the syntax error indicated in the message.",
    ),
    ErrorPattern(
        name="import_error",
        pattern=r"ImportError|ModuleNotFoundError|Cannot find module",
        severity="error",
        category="dependency",
        suggestion="Install the missing module or check your import path.",
    ),
    ErrorPattern(
        name="timeout",
        pattern=r"[Tt]imed? out|ETIMEDOUT|deadline exceeded",
        severity="warning",
        category="performance",
        suggestion="Increase timeout or optimize the slow operation.",
    ),
    ErrorPattern(
        name="file_not_found",
        pattern=r"[Ff]ile not found|No such file or directory|ENOENT",
        severity="error",
        category="filesystem",
        suggestion="Verify the file path exists before executing.",
    ),
    ErrorPattern(
        name="assertion_error",
        pattern=r"AssertionError|assertion failed",
        severity="error",
        category="testing",
        suggestion="Check the assertion condition and the values being compared.",
    ),
]


class ErrorPatternDetector:
    """Scans stdout/stderr for known error patterns.

    Supports built-in patterns and custom registration.
    Results can be filtered by category or severity.
    """

    def __init__(self) -> None:
        """Initialize with built-in patterns pre-registered."""
        self._patterns: dict[str, ErrorPattern] = {}
        for p in _BUILTIN_PATTERNS:
            self.register_pattern(p)

    def register_pattern(self, pattern: ErrorPattern) -> None:
        """Register an error pattern (overwrites existing by name).

        Args:
            pattern: ErrorPattern to register.

        """
        self._patterns[pattern.name] = pattern

    def get_pattern(self, name: str) -> Optional[ErrorPattern]:
        """Retrieve a registered pattern by name.

        Args:
            name: Pattern name.

        Returns:
            ErrorPattern if found, else None.

        """
        return self._patterns.get(name)

    def scan(
        self,
        output: str,
        category: Optional[str] = None,
    ) -> List[DetectedError]:
        """Scan combined output for all registered patterns.

        Args:
            output: Combined stdout + stderr text to scan.
            category: Optional filter — only scan patterns in this category.

        Returns:
            List of DetectedError, one per match found (de-duplicated by pattern name).

        """
        lines = output.splitlines()
        detected: List[DetectedError] = []
        seen_patterns: set[str] = set()

        patterns = [
            p for p in self._patterns.values()
            if category is None or p.category == category
        ]

        for pattern in patterns:
            try:
                compiled = re.compile(pattern.pattern, re.IGNORECASE | re.MULTILINE)
            except re.error:
                continue

            for line_no, line in enumerate(lines, start=1):
                match = compiled.search(line)
                if match and pattern.name not in seen_patterns:
                    seen_patterns.add(pattern.name)
                    context = self._extract_context(lines, line_no - 1)
                    detected.append(DetectedError(
                        pattern=pattern,
                        match_text=match.group(0),
                        line_number=line_no,
                        context=context,
                    ))
                    break  # one match per pattern

        return detected

    def _extract_context(self, lines: List[str], index: int, window: int = 1) -> str:
        """Extract surrounding lines as context string.

        Args:
            lines: All output lines.
            index: 0-based index of the matching line.
            window: Number of lines before/after to include.

        Returns:
            Context string with surrounding lines joined by newline.

        """
        start = max(0, index - window)
        end = min(len(lines), index + window + 1)
        return "\n".join(lines[start:end])

    def filter_by_severity(
        self, detected: List[DetectedError], severity: str,
    ) -> List[DetectedError]:
        """Filter detected errors to only those with matching severity.

        Args:
            detected: Results from scan().
            severity: Severity level to keep ('critical', 'error', 'warning').

        Returns:
            Filtered list.

        """
        return [d for d in detected if d.pattern.severity == severity]

    @property
    def registered_names(self) -> List[str]:
        """Return names of all registered patterns."""
        return list(self._patterns.keys())


__all__ = [
    "DetectedError",
    "ErrorPattern",
    "ErrorPatternDetector",
]

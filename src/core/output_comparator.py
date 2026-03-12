"""Mekong CLI - Output Comparator.

Expected output comparison framework supporting multiple matching modes:
exact, contains, regex, JSON subset, and line-by-line diff.
"""

from __future__ import annotations

import difflib
import json
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any, List


class ComparisonMode(Enum):
    """Mode used when comparing actual vs expected output."""

    EXACT = "exact"
    CONTAINS = "contains"
    REGEX = "regex"
    JSON_SUBSET = "json_subset"
    LINE_BY_LINE = "line_by_line"


@dataclass
class ComparisonResult:
    """Result of a single output comparison.

    Attributes:
        matched: Whether the comparison succeeded.
        mode: ComparisonMode used.
        expected: The expected value (string or dict).
        actual: The actual observed value.
        diff_details: Human-readable diff or mismatch explanation.

    """

    matched: bool
    mode: ComparisonMode
    expected: Any
    actual: Any
    diff_details: str = ""


class OutputComparator:
    """Compares actual command output against expected values.

    Supports: EXACT, CONTAINS, REGEX, JSON_SUBSET, LINE_BY_LINE modes.
    """

    def compare(
        self,
        actual: str,
        expected: Any,
        mode: ComparisonMode = ComparisonMode.CONTAINS,
    ) -> ComparisonResult:
        """Compare actual output against expected using specified mode.

        Args:
            actual: Actual output string from execution.
            expected: Expected value (string, regex pattern, or dict for JSON_SUBSET).
            mode: Comparison mode to use.

        Returns:
            ComparisonResult with match outcome and details.

        """
        if mode == ComparisonMode.EXACT:
            return self._compare_exact(actual, expected)
        if mode == ComparisonMode.CONTAINS:
            return self._compare_contains(actual, expected)
        if mode == ComparisonMode.REGEX:
            return self._compare_regex(actual, expected)
        if mode == ComparisonMode.JSON_SUBSET:
            return self._compare_json_subset(actual, expected)
        if mode == ComparisonMode.LINE_BY_LINE:
            return self._compare_line_by_line(actual, expected)
        return ComparisonResult(
            matched=False,
            mode=mode,
            expected=expected,
            actual=actual,
            diff_details=f"Unknown comparison mode: {mode}",
        )

    def _compare_exact(self, actual: str, expected: str) -> ComparisonResult:
        matched = actual.strip() == str(expected).strip()
        diff = ""
        if not matched:
            diff = f"Expected:\n{expected}\nActual:\n{actual}"
        return ComparisonResult(
            matched=matched,
            mode=ComparisonMode.EXACT,
            expected=expected,
            actual=actual,
            diff_details=diff,
        )

    def _compare_contains(self, actual: str, expected: str) -> ComparisonResult:
        matched = str(expected) in actual
        diff = "" if matched else f"'{expected}' not found in output"
        return ComparisonResult(
            matched=matched,
            mode=ComparisonMode.CONTAINS,
            expected=expected,
            actual=actual,
            diff_details=diff,
        )

    def _compare_regex(self, actual: str, pattern: str) -> ComparisonResult:
        try:
            match = re.search(str(pattern), actual, re.MULTILINE | re.DOTALL | re.IGNORECASE)
            matched = match is not None
            diff = "" if matched else f"Pattern '{pattern}' did not match output"
        except re.error as exc:
            matched = False
            diff = f"Invalid regex pattern '{pattern}': {exc}"
        return ComparisonResult(
            matched=matched,
            mode=ComparisonMode.REGEX,
            expected=pattern,
            actual=actual,
            diff_details=diff,
        )

    def _compare_json_subset(
        self, actual: str, expected: Any,
    ) -> ComparisonResult:
        """Check that actual JSON contains all key/value pairs from expected.

        Args:
            actual: JSON string (or already-parsed dict).
            expected: Dict whose keys/values must all appear in actual.

        Returns:
            ComparisonResult.

        """
        # Parse actual if it is a string
        if isinstance(actual, str):
            try:
                actual_obj = json.loads(actual)
            except json.JSONDecodeError as exc:
                return ComparisonResult(
                    matched=False,
                    mode=ComparisonMode.JSON_SUBSET,
                    expected=expected,
                    actual=actual,
                    diff_details=f"Actual is not valid JSON: {exc}",
                )
        else:
            actual_obj = actual

        if not isinstance(expected, dict):
            return ComparisonResult(
                matched=False,
                mode=ComparisonMode.JSON_SUBSET,
                expected=expected,
                actual=actual,
                diff_details="Expected must be a dict for JSON_SUBSET mode",
            )

        missing: List[str] = []
        mismatched: List[str] = []
        self._check_subset(expected, actual_obj, "", missing, mismatched)

        matched = not missing and not mismatched
        diff_parts: List[str] = []
        if missing:
            diff_parts.append("Missing keys: " + ", ".join(missing))
        if mismatched:
            diff_parts.append("Mismatched values: " + "; ".join(mismatched))

        return ComparisonResult(
            matched=matched,
            mode=ComparisonMode.JSON_SUBSET,
            expected=expected,
            actual=actual_obj,
            diff_details="\n".join(diff_parts),
        )

    def _check_subset(
        self,
        expected: dict,
        actual: Any,
        prefix: str,
        missing: List[str],
        mismatched: List[str],
    ) -> None:
        """Recursively check that expected keys/values exist in actual."""
        if not isinstance(actual, dict):
            mismatched.append(f"{prefix}: expected dict, got {type(actual).__name__}")
            return
        for key, exp_val in expected.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if key not in actual:
                missing.append(full_key)
            elif isinstance(exp_val, dict):
                self._check_subset(exp_val, actual[key], full_key, missing, mismatched)
            elif actual[key] != exp_val:
                mismatched.append(f"{full_key}: expected={exp_val!r}, actual={actual[key]!r}")

    def _compare_line_by_line(
        self, actual: str, expected: str,
    ) -> ComparisonResult:
        actual_lines = actual.splitlines()
        expected_lines = str(expected).splitlines()
        diff_lines = list(
            difflib.unified_diff(
                expected_lines,
                actual_lines,
                fromfile="expected",
                tofile="actual",
                lineterm="",
                n=2,
            ),
        )
        matched = not diff_lines
        return ComparisonResult(
            matched=matched,
            mode=ComparisonMode.LINE_BY_LINE,
            expected=expected,
            actual=actual,
            diff_details="\n".join(diff_lines) if diff_lines else "",
        )


__all__ = [
    "ComparisonMode",
    "ComparisonResult",
    "OutputComparator",
]

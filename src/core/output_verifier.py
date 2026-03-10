"""Jidoka Gate — Output Verification.

Domain-specific quality checks on LLM output before confirming MCU charge.
Inspired by Toyota's Jidoka principle: stop and fix quality issues immediately.
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Universal anti-patterns
APOLOGY_PATTERNS = [
    r"(?i)i('m| am) sorry.{0,20}(can't|cannot|unable)",
    r"(?i)i apologize.{0,20}(can't|cannot|unable)",
    r"(?i)as an ai.{0,20}(can't|cannot|unable|don't)",
    r"(?i)i('m| am) not able to",
]

TRUNCATION_PATTERNS = [
    r"\.\.\.$",
    r"(?i)\[truncated\]",
    r"(?i)\[continued\]",
    r"(?i)output was cut off",
]

PLACEHOLDER_PATTERNS = [
    r"(?i)TODO:?\s",
    r"(?i)FIXME:?\s",
    r"(?i)placeholder",
    r"(?i)implement this",
    r"(?i)fill in here",
    r"(?i)your code here",
]


@dataclass
class VerifyResult:
    """Result of output verification."""

    passed: bool
    checks_run: int = 0
    checks_passed: int = 0
    failures: list[str] = field(default_factory=list)
    retry_count: int = 0
    failure_reason: str = ""
    suggested_fix: str = ""


def check_no_apology_pattern(output: str) -> tuple[bool, str]:
    """Check output doesn't contain refusal/apology patterns."""
    for pattern in APOLOGY_PATTERNS:
        if re.search(pattern, output):
            return False, f"Apology/refusal pattern detected: {pattern}"
    return True, ""


def check_no_truncation(output: str) -> tuple[bool, str]:
    """Check output is not truncated."""
    for pattern in TRUNCATION_PATTERNS:
        if re.search(pattern, output):
            return False, f"Truncation detected: {pattern}"
    return True, ""


def check_no_placeholders(output: str) -> tuple[bool, str]:
    """Check output doesn't contain placeholder text."""
    for pattern in PLACEHOLDER_PATTERNS:
        if re.search(pattern, output):
            return False, f"Placeholder detected: {pattern}"
    return True, ""


def check_code_quality(output: str) -> tuple[bool, str]:
    """Domain-specific check for code output."""
    # Check for common bad patterns in code
    if "import *" in output:
        return False, "Wildcard import detected (import *)"
    # Check minimum length for code
    if len(output.strip()) < 10:
        return False, "Code output too short (< 10 chars)"
    return True, ""


def check_creative_quality(output: str) -> tuple[bool, str]:
    """Domain-specific check for creative/content output."""
    if "lorem ipsum" in output.lower():
        return False, "Lorem ipsum placeholder detected"
    if len(output.strip()) < 50:
        return False, "Creative output too short (< 50 chars)"
    return True, ""


def check_analysis_quality(output: str) -> tuple[bool, str]:
    """Domain-specific check for analysis output."""
    # Analysis should contain some numbers/data
    has_numbers = bool(re.search(r"\d+", output))
    if not has_numbers:
        return False, "Analysis output contains no numerical data"
    if len(output.strip()) < 30:
        return False, "Analysis output too short (< 30 chars)"
    return True, ""


def verify_output(output: str, domain: str = "code", goal: str = "") -> VerifyResult:
    """Run domain-specific verification on LLM output.

    Args:
        output: The LLM-generated output text.
        domain: Task domain (code, creative, analysis, ops, sales, support).
        goal: Original goal for context.

    Returns:
        VerifyResult with pass/fail and failure details.
    """
    if not output or not output.strip():
        return VerifyResult(
            passed=False,
            failure_reason="Empty output",
            suggested_fix="Retry with clearer goal specification",
        )

    checks: list[tuple[bool, str]] = []

    # Universal checks
    checks.append(check_no_apology_pattern(output))
    checks.append(check_no_truncation(output))
    checks.append(check_no_placeholders(output))

    # Domain-specific checks
    if domain == "code":
        checks.append(check_code_quality(output))
    elif domain == "creative":
        checks.append(check_creative_quality(output))
    elif domain == "analysis":
        checks.append(check_analysis_quality(output))

    # Tally results
    failures = [msg for passed, msg in checks if not passed]
    checks_passed = sum(1 for passed, _ in checks if passed)

    if failures:
        return VerifyResult(
            passed=False,
            checks_run=len(checks),
            checks_passed=checks_passed,
            failures=failures,
            failure_reason=failures[0],
            suggested_fix=f"Fix: {failures[0]}. Retry with improved prompt.",
        )

    return VerifyResult(
        passed=True,
        checks_run=len(checks),
        checks_passed=checks_passed,
    )

"""Two-Stage Subagent Review — adapted from Superpowers pattern.

Stage 1 (Spec Compliance): Did the subagent do what was asked?
Stage 2 (Quality Review): Is the output good enough?

Runs after every subagent task completion with status DONE or DONE_WITH_CONCERNS.
Skipped for BLOCKED and NEEDS_CONTEXT (nothing to review).

Usage:
    from src.core.subagent_reviewer import SubagentReviewer
    reviewer = SubagentReviewer(llm_client)
    spec_result = await reviewer.review_spec(task_spec, output)
    if spec_result["compliant"]:
        quality_result = await reviewer.review_quality(output)
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class SpecReviewResult:
    """Result of spec compliance review."""

    compliant: bool
    issues: list[str]
    severity: str  # none, minor, major, critical

    def to_dict(self) -> dict[str, Any]:
        return {"compliant": self.compliant, "issues": self.issues, "severity": self.severity}


@dataclass
class QualityReviewResult:
    """Result of quality review."""

    score: int  # 0-100
    issues: list[str]
    suggestions: list[str]
    passed: bool  # score >= 60

    def to_dict(self) -> dict[str, Any]:
        return {
            "score": self.score, "issues": self.issues,
            "suggestions": self.suggestions, "passed": self.passed,
        }


def _parse_status(output: str) -> tuple[str, str]:
    """Extract status code and remaining content from subagent output.

    Returns:
        (status, content_after_status)
    """
    pattern = r"<status>(DONE|DONE_WITH_CONCERNS|BLOCKED|NEEDS_CONTEXT)</status>"
    match = re.search(pattern, output)
    if not match:
        return "DONE", ""  # Default to DONE if no status tag (backward compat)
    status = match.group(1)
    content_after = output[match.end():].strip()
    return status, content_after


class SubagentReviewer:
    """Two-stage review for subagent outputs."""

    def __init__(self, llm_client: Any) -> None:
        """Initialize with LLM client for review calls.

        Args:
            llm_client: Instance of LLMClient from src.core.llm_client
        """
        self._llm = llm_client

    def review_spec(self, task_spec: str, output: str) -> SpecReviewResult:
        """Stage 1: Check if output matches the task specification.

        Args:
            task_spec: Original task description given to subagent.
            output: Full subagent output.

        Returns:
            SpecReviewResult with compliance assessment.
        """
        prompt = (
            "You are a spec compliance reviewer. Check if this subagent output "
            "fulfills the task specification.\n\n"
            f"TASK SPECIFICATION:\n{task_spec[:2000]}\n\n"
            f"SUBAGENT OUTPUT:\n{output[:3000]}\n\n"
            "Respond ONLY with valid JSON (no markdown, no backticks):\n"
            '{"compliant": true/false, "issues": ["issue1", "issue2"], '
            '"severity": "none|minor|major|critical"}'
        )

        try:
            result = self._llm.generate_json(prompt)
            return SpecReviewResult(
                compliant=bool(result.get("compliant", False)),
                issues=list(result.get("issues", [])),
                severity=str(result.get("severity", "none")),
            )
        except Exception as e:
            logger.warning("[SubagentReviewer] Spec review failed: %s", e)
            return SpecReviewResult(compliant=True, issues=[], severity="none")

    def review_quality(self, output: str) -> QualityReviewResult:
        """Stage 2: Check output quality (code style, tests, error handling).

        Args:
            output: Full subagent output.

        Returns:
            QualityReviewResult with quality score and feedback.
        """
        prompt = (
            "You are a code quality reviewer. Assess this implementation output.\n\n"
            f"OUTPUT:\n{output[:3000]}\n\n"
            "Check: tests present, error handling, no hardcoded secrets, "
            "clean structure, no unnecessary complexity.\n\n"
            "Respond ONLY with valid JSON (no markdown, no backticks):\n"
            '{"score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"]}'
        )

        try:
            result = self._llm.generate_json(prompt)
            score = int(result.get("score", 50))
            return QualityReviewResult(
                score=score,
                issues=list(result.get("issues", [])),
                suggestions=list(result.get("suggestions", [])),
                passed=score >= 60,
            )
        except Exception as e:
            logger.warning("[SubagentReviewer] Quality review failed: %s", e)
            return QualityReviewResult(score=50, issues=[], suggestions=[], passed=True)

    def full_review(self, task_spec: str, output: str) -> dict[str, Any]:
        """Run both stages. Returns combined result.

        Args:
            task_spec: Original task specification.
            output: Full subagent output.

        Returns:
            Dict with status, spec_review, quality_review, and proceed flag.
        """
        status, concerns = _parse_status(output)

        # Skip review for BLOCKED/NEEDS_CONTEXT
        if status in ("BLOCKED", "NEEDS_CONTEXT"):
            return {
                "status": status,
                "details": concerns,
                "proceed": False,
                "action": "escalate" if status == "BLOCKED" else "clarify",
            }

        # Stage 1: Spec compliance
        spec_result = self.review_spec(task_spec, output)

        # Stage 2: Quality (only if spec compliant)
        quality_result = None
        if spec_result.compliant:
            quality_result = self.review_quality(output)

        proceed = (
            spec_result.compliant
            and spec_result.severity != "critical"
            and (quality_result is None or quality_result.passed)
        )

        return {
            "status": status,
            "concerns": concerns if status == "DONE_WITH_CONCERNS" else None,
            "spec_review": spec_result.to_dict(),
            "quality_review": quality_result.to_dict() if quality_result else None,
            "proceed": proceed,
            "action": "continue" if proceed else "fix_and_retry",
        }


__all__ = [
    "SubagentReviewer",
    "SpecReviewResult",
    "QualityReviewResult",
    "_parse_status",
]

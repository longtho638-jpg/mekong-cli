"""
Mekong CLI - Reflection Engine (AGI v2)

Post-task meta-cognition: analyzes execution outcomes, calibrates confidence,
and suggests strategy changes. Enables the AGI to "think about its thinking."

Emits REFLECTION_COMPLETE events via EventBus.
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .event_bus import EventType, get_event_bus

logger = logging.getLogger(__name__)

# Prompt for LLM-powered reflection
_REFLECTION_PROMPT = """You are the meta-cognition engine of Mekong CLI, an AGI agent.
Analyze this task execution and provide structured reflection.

## Task
Goal: {goal}
Status: {status}
Duration: {duration_ms:.0f}ms
Error: {error}

## Previous Reflections (last 3)
{previous_reflections}

## Instructions
Think carefully:
1. What went well in this execution?
2. What went wrong or could be improved?
3. Was the approach optimal? What alternative would work better?
4. How confident should the system be for similar tasks in the future?

Return JSON:
{{
  "strengths": ["what went well"],
  "weaknesses": ["what went wrong"],
  "alternative_approach": "description of a better approach",
  "confidence_adjustment": 0.1,
  "lesson_learned": "one key takeaway",
  "should_change_strategy": false
}}"""


@dataclass
class ReflectionReport:
    """Result of post-task reflection."""

    goal: str
    status: str
    duration_ms: float = 0.0
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    alternative_approach: str = ""
    confidence_adjustment: float = 0.0  # -1.0 to +1.0
    lesson_learned: str = ""
    should_change_strategy: bool = False
    timestamp: float = field(default_factory=time.time)


@dataclass
class StrategyRecord:
    """Track strategy effectiveness over time."""

    strategy_name: str
    uses: int = 0
    successes: int = 0
    failures: int = 0
    avg_duration_ms: float = 0.0

    @property
    def success_rate(self) -> float:
        return self.successes / self.uses if self.uses > 0 else 0.0


class ConfidenceCalibrator:
    """
    Track predicted vs actual outcomes to calibrate confidence.

    Maintains a sliding window of predictions and outcomes to calculate
    how well-calibrated the system's confidence estimates are.
    """

    MAX_HISTORY: int = 100

    def __init__(self) -> None:
        self._predictions: List[Dict[str, float]] = []

    def record(self, predicted_confidence: float, actual_success: bool) -> None:
        """Record a prediction and its outcome."""
        self._predictions.append({
            "predicted": predicted_confidence,
            "actual": 1.0 if actual_success else 0.0,
            "timestamp": time.time(),
        })
        if len(self._predictions) > self.MAX_HISTORY:
            self._predictions = self._predictions[-self.MAX_HISTORY:]

    def get_calibration_error(self) -> float:
        """
        Calculate Expected Calibration Error (ECE).

        Returns average difference between predicted confidence
        and actual success rate, binned by confidence level.
        Lower is better (0.0 = perfectly calibrated).
        """
        if len(self._predictions) < 5:
            return 0.5  # Not enough data

        # Bin predictions into 5 buckets
        bins: Dict[int, List[Dict[str, float]]] = {i: [] for i in range(5)}
        for pred in self._predictions:
            bucket = min(int(pred["predicted"] * 5), 4)
            bins[bucket].append(pred)

        total_error = 0.0
        total_count = 0
        for bucket_preds in bins.values():
            if not bucket_preds:
                continue
            avg_predicted = sum(p["predicted"] for p in bucket_preds) / len(bucket_preds)
            avg_actual = sum(p["actual"] for p in bucket_preds) / len(bucket_preds)
            total_error += abs(avg_predicted - avg_actual) * len(bucket_preds)
            total_count += len(bucket_preds)

        return total_error / total_count if total_count > 0 else 0.5

    def get_adjusted_confidence(self, raw_confidence: float) -> float:
        """
        Adjust raw confidence based on calibration history.

        If the system has been overconfident, reduce confidence.
        If underconfident, increase it.
        """
        if len(self._predictions) < 10:
            return raw_confidence

        # Calculate bias (positive = overconfident)
        bias = sum(
            p["predicted"] - p["actual"] for p in self._predictions[-20:]
        ) / min(len(self._predictions), 20)

        adjusted = raw_confidence - (bias * 0.5)
        return max(0.05, min(0.99, adjusted))

    @property
    def prediction_count(self) -> int:
        return len(self._predictions)


class ReflectionEngine:
    """
    Post-task meta-cognition engine.

    After each task execution, analyzes what happened and produces
    a ReflectionReport with lessons learned. Tracks strategies
    and calibrates confidence over time.
    """

    MAX_REFLECTIONS: int = 50

    def __init__(self, llm_client: Optional[Any] = None) -> None:
        """
        Initialize reflection engine.

        Args:
            llm_client: Optional LLM client for deep reflection analysis.
        """
        self.llm_client = llm_client
        self.calibrator = ConfidenceCalibrator()
        self._reflections: List[ReflectionReport] = []
        self._strategies: Dict[str, StrategyRecord] = {}

    def reflect(
        self,
        goal: str,
        status: str,
        duration_ms: float = 0.0,
        error: str = "",
        predicted_confidence: float = 0.8,
    ) -> ReflectionReport:
        """
        Perform post-task reflection.

        Args:
            goal: Original task goal.
            status: Execution result ("success", "failed", etc.).
            duration_ms: Execution time in milliseconds.
            error: Error message if failed.
            predicted_confidence: Confidence before execution.

        Returns:
            ReflectionReport with analysis and recommendations.
        """
        is_success = status == "success"

        # Update calibrator
        self.calibrator.record(predicted_confidence, is_success)

        # Rule-based reflection (always available)
        report = ReflectionReport(
            goal=goal,
            status=status,
            duration_ms=duration_ms,
        )

        if is_success:
            report.strengths.append("Task completed successfully")
            if duration_ms < 5000:
                report.strengths.append("Fast execution time")
            report.confidence_adjustment = 0.05
        else:
            report.weaknesses.append(f"Task failed: {error or 'unknown error'}")
            report.confidence_adjustment = -0.1

            # Check for repeated failures
            similar_failures = [
                r for r in self._reflections[-10:]
                if r.status != "success" and r.goal == goal
            ]
            if len(similar_failures) >= 2:
                report.should_change_strategy = True
                report.weaknesses.append(
                    f"Repeated failure ({len(similar_failures) + 1} times). "
                    f"Strategy change recommended."
                )
                report.confidence_adjustment = -0.2

        # LLM-powered deep reflection
        if self.llm_client and hasattr(self.llm_client, "generate_json"):
            try:
                llm_report = self._llm_reflect(goal, status, duration_ms, error)
                # Merge LLM insights into report
                report.strengths.extend(llm_report.get("strengths", []))
                report.weaknesses.extend(llm_report.get("weaknesses", []))
                report.alternative_approach = llm_report.get(
                    "alternative_approach", "",
                )
                report.lesson_learned = llm_report.get("lesson_learned", "")
                if "confidence_adjustment" in llm_report:
                    report.confidence_adjustment = float(
                        llm_report["confidence_adjustment"],
                    )
                if llm_report.get("should_change_strategy"):
                    report.should_change_strategy = True
            except Exception as e:
                logger.debug("LLM reflection failed: %s", e)

        # De-duplicate strengths/weaknesses
        report.strengths = list(dict.fromkeys(report.strengths))
        report.weaknesses = list(dict.fromkeys(report.weaknesses))

        # Clamp confidence adjustment
        report.confidence_adjustment = max(
            -1.0, min(1.0, report.confidence_adjustment),
        )

        # Record and emit
        self._reflections.append(report)
        if len(self._reflections) > self.MAX_REFLECTIONS:
            self._reflections = self._reflections[-self.MAX_REFLECTIONS:]

        bus = get_event_bus()
        bus.emit(EventType.AUTONOMOUS_CYCLE, {
            "event": "reflection_complete",
            "goal": goal,
            "status": status,
            "should_change_strategy": report.should_change_strategy,
            "lesson": report.lesson_learned,
        })

        return report

    def get_strategy_suggestion(self, goal: str) -> str:
        """
        Suggest a strategy based on past reflections for similar goals.

        Args:
            goal: The goal to find strategy for.

        Returns:
            Strategy suggestion string.
        """
        goal_lower = goal.lower()
        relevant = [
            r for r in self._reflections
            if goal_lower in r.goal.lower() or r.goal.lower() in goal_lower
        ]

        if not relevant:
            return "No prior data. Using default strategy."

        successes = [r for r in relevant if r.status == "success"]
        failures = [r for r in relevant if r.status != "success"]

        if not failures:
            return "Previous attempts all succeeded. Continue current approach."

        if len(failures) > len(successes):
            alternatives = [
                r.alternative_approach
                for r in failures
                if r.alternative_approach
            ]
            if alternatives:
                return f"Previous approach failed often. Try: {alternatives[-1]}"
            return "Previous approach unreliable. Consider a different strategy."

        return "Mixed results. Current approach works but may need refinement."

    def get_recent(self, limit: int = 10) -> List[ReflectionReport]:
        """Return recent reflections."""
        return self._reflections[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        """Return reflection statistics."""
        if not self._reflections:
            return {
                "total_reflections": 0,
                "calibration_error": 0.5,
                "strategy_changes_suggested": 0,
            }

        return {
            "total_reflections": len(self._reflections),
            "calibration_error": self.calibrator.get_calibration_error(),
            "prediction_count": self.calibrator.prediction_count,
            "strategy_changes_suggested": sum(
                1 for r in self._reflections if r.should_change_strategy
            ),
            "avg_confidence_adjustment": sum(
                r.confidence_adjustment for r in self._reflections
            ) / len(self._reflections),
            "lessons_learned": [
                r.lesson_learned
                for r in self._reflections[-5:]
                if r.lesson_learned
            ],
        }

    def _llm_reflect(
        self, goal: str, status: str, duration_ms: float, error: str,
    ) -> Dict[str, Any]:
        """Use LLM for deep reflection analysis."""
        previous = ""
        for r in self._reflections[-3:]:
            previous += (
                f"- [{r.status}] {r.goal}: {r.lesson_learned or 'no lesson'}\n"
            )

        prompt = _REFLECTION_PROMPT.format(
            goal=goal,
            status=status,
            duration_ms=duration_ms,
            error=error or "none",
            previous_reflections=previous or "None yet.",
        )

        if self.llm_client is None:
            return {}

        try:
            result = self.llm_client.generate_json(prompt)
            if isinstance(result, dict):
                return result
        except Exception:
            pass

        return {}


__all__ = [
    "ReflectionEngine",
    "ReflectionReport",
    "ConfidenceCalibrator",
    "StrategyRecord",
]

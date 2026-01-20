"""
Self-Improvement Engine Logic.
"""
import logging
import threading
import time
from typing import Any, Dict, List, Optional

from .error_learning import (
    create_error_improvement_suggestion,
    create_learning_entry,
    generate_pattern_key,
)
from .persistence import load_learnings, save_learnings
from .profiling import create_performance_suggestion, update_profile
from .suggestions import apply_suggestion_logic, get_filtered_suggestions
from .types import (
    ImprovementSuggestion,
    ImprovementType,
    LearningEntry,
    PerformanceProfile,
)

logger = logging.getLogger(__name__)


class SelfImproveEngine:
    """
    AI Self-Improvement Engine

    Features:
    - Learn from errors and fix patterns
    - Auto-refactor based on metrics
    - Continuous optimization loop
    - Performance profiling and improvement
    """

    def __init__(self, enable_auto_apply: bool = False, min_confidence: float = 0.8):
        self.enable_auto_apply = enable_auto_apply
        self.min_confidence = min_confidence

        self.learnings: Dict[str, LearningEntry] = load_learnings()
        self.suggestions: Dict[str, ImprovementSuggestion] = {}
        self.profiles: Dict[str, PerformanceProfile] = {}

        self._lock = threading.Lock()
        self._error_patterns: Dict[str, int] = {}
        self._optimization_history: List[Dict] = []

        logger.info("SelfImproveEngine initialized")

    def learn_from_error(self, error: Exception, context: Dict[str, Any] = None) -> str:
        """Learn from an error occurrence."""
        error_type = type(error).__name__
        pattern_key = generate_pattern_key(error)

        with self._lock:
            if pattern_key in self._error_patterns:
                self._error_patterns[pattern_key] += 1
                if pattern_key in self.learnings:
                    self.learnings[pattern_key].occurrences += 1
            else:
                self._error_patterns[pattern_key] = 1
                learning = create_learning_entry(pattern_key, error, context)
                self.learnings[pattern_key] = learning

        # Generate improvement if pattern occurs frequently
        if self._error_patterns[pattern_key] >= 3:
            self._suggest_improvement_for_error(pattern_key, error, context)

        logger.info(
            f"Learned from error: {error_type} (count: {self._error_patterns[pattern_key]})"
        )
        return pattern_key

    def _suggest_improvement_for_error(
        self, pattern_key: str, error: Exception, context: Dict[str, Any] = None
    ):
        """Generate improvement suggestion for recurring error."""
        learning = self.learnings.get(pattern_key)
        suggestion = create_error_improvement_suggestion(
            learning=learning,
            error=error,
            context=context,
            enable_auto_apply=self.enable_auto_apply,
            min_confidence=self.min_confidence,
        )

        if suggestion:
            with self._lock:
                self.suggestions[suggestion.id] = suggestion

    def profile_function(self, name: str, execution_time: float, success: bool):
        """Profile a function execution."""
        with self._lock:
            update_profile(self.profiles, name, execution_time, success)

        # Check for performance issues and create suggestion if needed
        suggestion = create_performance_suggestion(name, execution_time)
        if suggestion:
            with self._lock:
                self.suggestions[suggestion.id] = suggestion
            logger.warning(f"Slow function detected: {name} ({execution_time:.2f}s)")

    def get_suggestions(
        self, type_filter: ImprovementType = None, min_confidence: float = 0.0
    ) -> List[ImprovementSuggestion]:
        """Get improvement suggestions."""
        with self._lock:
            return get_filtered_suggestions(
                self.suggestions, type_filter, min_confidence
            )

    def apply_suggestion(self, suggestion_id: str) -> bool:
        """Apply an improvement suggestion."""
        with self._lock:
            entry = apply_suggestion_logic(self.suggestions, suggestion_id)
            if entry is None:
                return False

            self._optimization_history.append(entry)

        suggestion = self.suggestions.get(suggestion_id)
        logger.info(f"Applied improvement: {suggestion.description}")
        return True

    def run_optimization_loop(self, interval_seconds: int = 3600):
        """Run continuous optimization loop."""

        def loop():
            while True:
                try:
                    # Get high-confidence suggestions
                    suggestions = self.get_suggestions(min_confidence=self.min_confidence)

                    for suggestion in suggestions:
                        if suggestion.auto_apply and not suggestion.applied:
                            self.apply_suggestion(suggestion.id)

                    # Save learnings
                    save_learnings(self.learnings)

                except Exception as e:
                    logger.error(f"Optimization loop error: {e}")

                time.sleep(interval_seconds)

        thread = threading.Thread(target=loop, daemon=True)
        thread.start()
        logger.info("Optimization loop started")

    def get_status(self) -> Dict[str, Any]:
        """Get engine status."""
        return {
            "total_learnings": len(self.learnings),
            "total_suggestions": len(self.suggestions),
            "applied_improvements": sum(1 for s in self.suggestions.values() if s.applied),
            "profiles_tracked": len(self.profiles),
            "error_patterns": len(self._error_patterns),
        }


# Global instance
_engine: Optional[SelfImproveEngine] = None


def get_self_improve_engine() -> SelfImproveEngine:
    """Get global self-improve engine."""
    global _engine
    if _engine is None:
        _engine = SelfImproveEngine()
    return _engine

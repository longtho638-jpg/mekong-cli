"""
🧠 Self-Improve Engine - AI Auto-Refactoring
=============================================

Continuous self-improvement through learning from metrics and errors.
Auto-refactors code based on performance data.

Binh Pháp: "Tri kỷ tri bỉ" - Know yourself, know your enemy
"""

import hashlib
import json
import logging
import os
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class ImprovementType(Enum):
    """Types of improvements."""

    PERFORMANCE = "performance"
    SECURITY = "security"
    RELIABILITY = "reliability"
    READABILITY = "readability"
    SCALABILITY = "scalability"


class LearningSource(Enum):
    """Sources of learning data."""

    ERROR_LOGS = "error_logs"
    METRICS = "metrics"
    USER_FEEDBACK = "user_feedback"
    BENCHMARKS = "benchmarks"
    CODE_ANALYSIS = "code_analysis"


@dataclass
class LearningEntry:
    """A learning from experience."""

    id: str
    source: LearningSource
    pattern: str
    solution: str
    confidence: float
    occurrences: int = 1
    created_at: float = field(default_factory=time.time)
    last_applied: Optional[float] = None


@dataclass
class ImprovementSuggestion:
    """Suggested improvement."""

    id: str
    type: ImprovementType
    target: str  # file or function
    description: str
    before_code: Optional[str] = None
    after_code: Optional[str] = None
    confidence: float = 0.0
    impact_score: float = 0.0
    auto_apply: bool = False
    applied: bool = False


@dataclass
class PerformanceProfile:
    """Performance profile for a component."""

    name: str
    avg_execution_time: float = 0.0
    p99_execution_time: float = 0.0
    error_rate: float = 0.0
    call_count: int = 0
    memory_usage: float = 0.0
    cpu_usage: float = 0.0
    last_updated: float = field(default_factory=time.time)


class SelfImproveEngine:
    """
    🧠 AI Self-Improvement Engine

    Features:
    - Learn from errors and fix patterns
    - Auto-refactor based on metrics
    - Continuous optimization loop
    - Performance profiling and improvement
    """

    def __init__(self, enable_auto_apply: bool = False, min_confidence: float = 0.8):
        self.enable_auto_apply = enable_auto_apply
        self.min_confidence = min_confidence

        self.learnings: Dict[str, LearningEntry] = {}
        self.suggestions: Dict[str, ImprovementSuggestion] = {}
        self.profiles: Dict[str, PerformanceProfile] = {}

        self._lock = threading.Lock()
        self._error_patterns: Dict[str, int] = {}
        self._optimization_history: List[Dict] = []

        # Load existing learnings
        self._load_learnings()

        logger.info("🧠 SelfImproveEngine initialized")

    def learn_from_error(self, error: Exception, context: Dict[str, Any] = None) -> str:
        """Learn from an error occurrence."""
        error_type = type(error).__name__
        error_msg = str(error)

        # Create pattern signature
        pattern_key = hashlib.md5(f"{error_type}:{error_msg}".encode()).hexdigest()[:12]

        with self._lock:
            if pattern_key in self._error_patterns:
                self._error_patterns[pattern_key] += 1
                if pattern_key in self.learnings:
                    self.learnings[pattern_key].occurrences += 1
            else:
                self._error_patterns[pattern_key] = 1

                # Create learning entry
                learning = LearningEntry(
                    id=pattern_key,
                    source=LearningSource.ERROR_LOGS,
                    pattern=f"{error_type}: {error_msg[:100]}",
                    solution=self._generate_solution(error, context),
                    confidence=0.5,
                )
                self.learnings[pattern_key] = learning

        # Generate improvement if pattern occurs frequently
        if self._error_patterns[pattern_key] >= 3:
            self._suggest_improvement_for_error(pattern_key, error, context)

        logger.info(
            f"📚 Learned from error: {error_type} (count: {self._error_patterns[pattern_key]})"
        )
        return pattern_key

    def _generate_solution(
        self, error: Exception, context: Dict[str, Any] = None
    ) -> str:
        """Generate solution suggestion for error."""
        error_type = type(error).__name__

        solutions = {
            "KeyError": "Add null check or provide default value",
            "TypeError": "Validate input types before operation",
            "ValueError": "Add input validation",
            "AttributeError": "Check object existence before accessing attribute",
            "IndexError": "Validate list bounds before accessing",
            "ZeroDivisionError": "Add zero check before division",
            "TimeoutError": "Increase timeout or add retry logic",
            "ConnectionError": "Add retry with exponential backoff",
        }

        return solutions.get(error_type, f"Handle {error_type} with try-except")

    def _suggest_improvement_for_error(
        self, pattern_key: str, error: Exception, context: Dict[str, Any] = None
    ):
        """Generate improvement suggestion for recurring error."""
        learning = self.learnings.get(pattern_key)
        if not learning:
            return

        # Calculate confidence based on occurrences
        confidence = min(0.5 + (learning.occurrences * 0.1), 0.95)
        learning.confidence = confidence

        suggestion = ImprovementSuggestion(
            id=f"imp_{pattern_key}",
            type=ImprovementType.RELIABILITY,
            target=context.get("file", "unknown") if context else "unknown",
            description=f"Fix recurring {type(error).__name__}: {learning.solution}",
            confidence=confidence,
            impact_score=learning.occurrences * 0.2,
            auto_apply=self.enable_auto_apply and confidence >= self.min_confidence,
        )

        with self._lock:
            self.suggestions[suggestion.id] = suggestion

        logger.info(f"💡 Improvement suggested: {suggestion.description}")

    def profile_function(self, name: str, execution_time: float, success: bool):
        """Profile a function execution."""
        with self._lock:
            if name not in self.profiles:
                self.profiles[name] = PerformanceProfile(name=name)

            profile = self.profiles[name]
            profile.call_count += 1

            # Update average
            profile.avg_execution_time = (
                profile.avg_execution_time * (profile.call_count - 1) + execution_time
            ) / profile.call_count

            # Update p99 (simplified)
            profile.p99_execution_time = max(profile.p99_execution_time, execution_time)

            # Update error rate
            if not success:
                current_errors = profile.error_rate * (profile.call_count - 1)
                profile.error_rate = (current_errors + 1) / profile.call_count

            profile.last_updated = time.time()

        # Check for performance issues
        if execution_time > 1.0:  # > 1 second
            self._suggest_performance_improvement(name, execution_time)

    def _suggest_performance_improvement(self, name: str, execution_time: float):
        """Suggest performance improvement for slow function."""
        suggestion = ImprovementSuggestion(
            id=f"perf_{name}_{int(time.time())}",
            type=ImprovementType.PERFORMANCE,
            target=name,
            description=f"Optimize slow function {name} ({execution_time:.2f}s)",
            confidence=0.7,
            impact_score=execution_time,
        )

        with self._lock:
            self.suggestions[suggestion.id] = suggestion

        logger.warning(f"🐢 Slow function detected: {name} ({execution_time:.2f}s)")

    def get_suggestions(
        self, type_filter: ImprovementType = None, min_confidence: float = 0.0
    ) -> List[ImprovementSuggestion]:
        """Get improvement suggestions."""
        suggestions = list(self.suggestions.values())

        if type_filter:
            suggestions = [s for s in suggestions if s.type == type_filter]

        suggestions = [s for s in suggestions if s.confidence >= min_confidence]

        return sorted(suggestions, key=lambda s: s.impact_score, reverse=True)

    def apply_suggestion(self, suggestion_id: str) -> bool:
        """Apply an improvement suggestion."""
        suggestion = self.suggestions.get(suggestion_id)
        if not suggestion:
            return False

        # In real implementation, this would modify code
        suggestion.applied = True

        self._optimization_history.append(
            {
                "id": suggestion_id,
                "type": suggestion.type.value,
                "target": suggestion.target,
                "applied_at": time.time(),
            }
        )

        logger.info(f"✨ Applied improvement: {suggestion.description}")
        return True

    def run_optimization_loop(self, interval_seconds: int = 3600):
        """Run continuous optimization loop."""

        def loop():
            while True:
                try:
                    # Get high-confidence suggestions
                    suggestions = self.get_suggestions(
                        min_confidence=self.min_confidence
                    )

                    for suggestion in suggestions:
                        if suggestion.auto_apply and not suggestion.applied:
                            self.apply_suggestion(suggestion.id)

                    # Save learnings
                    self._save_learnings()

                except Exception as e:
                    logger.error(f"Optimization loop error: {e}")

                time.sleep(interval_seconds)

        thread = threading.Thread(target=loop, daemon=True)
        thread.start()
        logger.info("🔄 Optimization loop started")

    def _load_learnings(self):
        """Load learnings from file."""
        path = os.path.expanduser("~/.antigravity/learnings.json")
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    data = json.load(f)
                    for item in data:
                        learning = LearningEntry(**item)
                        self.learnings[learning.id] = learning
                logger.info(f"📖 Loaded {len(self.learnings)} learnings")
            except Exception as e:
                logger.error(f"Failed to load learnings: {e}")

    def _save_learnings(self):
        """Save learnings to file."""
        path = os.path.expanduser("~/.antigravity/learnings.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)

        try:
            data = [
                {
                    "id": l.id,
                    "source": l.source.value,
                    "pattern": l.pattern,
                    "solution": l.solution,
                    "confidence": l.confidence,
                    "occurrences": l.occurrences,
                }
                for l in self.learnings.values()
            ]
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save learnings: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Get engine status."""
        return {
            "total_learnings": len(self.learnings),
            "total_suggestions": len(self.suggestions),
            "applied_improvements": sum(
                1 for s in self.suggestions.values() if s.applied
            ),
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


# Decorator for auto-profiling
def self_improving(name: str = None):
    """Decorator to enable self-improvement for a function."""

    def decorator(func: Callable):
        func_name = name or func.__name__

        def wrapper(*args, **kwargs):
            engine = get_self_improve_engine()
            start = time.time()
            success = True

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                engine.learn_from_error(e, {"function": func_name})
                raise
            finally:
                execution_time = time.time() - start
                engine.profile_function(func_name, execution_time, success)

        return wrapper

    return decorator


__all__ = [
    "SelfImproveEngine",
    "LearningEntry",
    "ImprovementSuggestion",
    "PerformanceProfile",
    "ImprovementType",
    "LearningSource",
    "get_self_improve_engine",
    "self_improving",
]

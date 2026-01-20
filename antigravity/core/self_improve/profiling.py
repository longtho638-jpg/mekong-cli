"""
Profiling Logic - Performance tracking and suggestion generation.

Extracted from engine.py for better modularity.
"""
import time
from typing import Dict, Optional

from .types import ImprovementSuggestion, ImprovementType, PerformanceProfile


def update_profile(
    profiles: Dict[str, PerformanceProfile],
    name: str,
    execution_time: float,
    success: bool,
) -> PerformanceProfile:
    """
    Update or create a performance profile for a function.

    Args:
        profiles: Dictionary of existing profiles (modified in-place).
        name: Function name to profile.
        execution_time: Execution time in seconds.
        success: Whether the execution was successful.

    Returns:
        The updated PerformanceProfile.
    """
    if name not in profiles:
        profiles[name] = PerformanceProfile(name=name)

    profile = profiles[name]
    profile.call_count += 1

    # Update running average
    profile.avg_execution_time = (
        profile.avg_execution_time * (profile.call_count - 1) + execution_time
    ) / profile.call_count

    # Update p99 (simplified - tracks max as proxy)
    profile.p99_execution_time = max(profile.p99_execution_time, execution_time)

    # Update error rate
    if not success:
        current_errors = profile.error_rate * (profile.call_count - 1)
        profile.error_rate = (current_errors + 1) / profile.call_count

    profile.last_updated = time.time()

    return profile


def create_performance_suggestion(
    name: str,
    execution_time: float,
) -> Optional[ImprovementSuggestion]:
    """
    Create a performance improvement suggestion for slow functions.

    Args:
        name: Function name.
        execution_time: Execution time in seconds.

    Returns:
        ImprovementSuggestion if execution_time > 1.0s, else None.
    """
    if execution_time <= 1.0:
        return None

    return ImprovementSuggestion(
        id=f"perf_{name}_{int(time.time())}",
        type=ImprovementType.PERFORMANCE,
        target=name,
        description=f"Optimize slow function {name} ({execution_time:.2f}s)",
        confidence=0.7,
        impact_score=execution_time,
    )

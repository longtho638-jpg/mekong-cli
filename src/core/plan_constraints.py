"""Mekong CLI - Plan Constraint System.

Typed constraint model and enforcement engine for PEV planning.
Constraints are evaluated at plan-time (before execution).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from .parser import Recipe


@dataclass
class ConstraintViolation:
    """A single constraint violation found during plan validation."""

    step_order: int
    constraint_name: str
    message: str


@dataclass
class ResourceLimit:
    """Limit concurrent and total step counts."""

    max_concurrent_steps: int = 0    # 0 = unlimited
    max_total_steps: int = 0         # 0 = unlimited


@dataclass
class TimeBound:
    """Limit step and total plan duration (seconds)."""

    max_step_duration_s: Optional[float] = None
    max_total_duration_s: Optional[float] = None


@dataclass
class OrderingConstraint:
    """Require step matching `before_step` title pattern to precede `after_step`."""

    before_step: str   # substring match against step title
    after_step: str    # substring match against step title


@dataclass
class MutualExclusion:
    """Steps whose titles match any pattern in `step_titles` must not run concurrently."""

    step_titles: List[str] = field(default_factory=list)


@dataclass
class PlanConstraints:
    """Aggregated constraint set for a plan."""

    resource_limit: Optional[ResourceLimit] = None
    time_bound: Optional[TimeBound] = None
    ordering: List[OrderingConstraint] = field(default_factory=list)
    mutual_exclusions: List[MutualExclusion] = field(default_factory=list)


class ConstraintEngine:
    """Validates a Recipe against a PlanConstraints set.

    Usage::

        engine = ConstraintEngine()
        violations = engine.validate(recipe, constraints)
    """

    def validate(
        self, recipe: "Recipe", constraints: PlanConstraints,
    ) -> List[ConstraintViolation]:
        """Check all constraints and return every violation found.

        Args:
            recipe: The Recipe to validate.
            constraints: PlanConstraints to enforce.

        Returns:
            List of ConstraintViolation (empty = valid).

        """
        violations: List[ConstraintViolation] = []

        if constraints.resource_limit:
            violations.extend(
                self._check_resource_limits(recipe, constraints.resource_limit),
            )

        for ordering in constraints.ordering:
            violations.extend(self._check_ordering(recipe, ordering))

        for exclusion in constraints.mutual_exclusions:
            violations.extend(self._check_mutual_exclusion(recipe, exclusion))

        # TimeBound: validate fields only (no runtime data at plan-time)
        if constraints.time_bound:
            violations.extend(
                self._check_time_bound(recipe, constraints.time_bound),
            )

        return violations

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _check_resource_limits(
        self, recipe: "Recipe", limit: ResourceLimit,
    ) -> List[ConstraintViolation]:
        """Enforce max_total_steps and max_concurrent_steps."""
        violations: List[ConstraintViolation] = []

        # Total step count
        if limit.max_total_steps > 0:
            total = len(recipe.steps)
            if total > limit.max_total_steps:
                violations.append(ConstraintViolation(
                    step_order=0,
                    constraint_name="ResourceLimit.max_total_steps",
                    message=(
                        f"Plan has {total} steps, exceeds limit of "
                        f"{limit.max_total_steps}"
                    ),
                ))

        # Concurrent steps = DAG width (steps sharing no dependency path)
        if limit.max_concurrent_steps > 0:
            width = self._dag_width(recipe)
            if width > limit.max_concurrent_steps:
                violations.append(ConstraintViolation(
                    step_order=0,
                    constraint_name="ResourceLimit.max_concurrent_steps",
                    message=(
                        f"Plan has up to {width} concurrent steps, exceeds "
                        f"limit of {limit.max_concurrent_steps}"
                    ),
                ))

        return violations

    def _check_ordering(
        self, recipe: "Recipe", ordering: OrderingConstraint,
    ) -> List[ConstraintViolation]:
        """Verify that before_step always precedes after_step in the dependency graph."""
        violations: List[ConstraintViolation] = []

        before_steps = [
            s for s in recipe.steps
            if ordering.before_step.lower() in s.title.lower()
        ]
        after_steps = [
            s for s in recipe.steps
            if ordering.after_step.lower() in s.title.lower()
        ]

        if not before_steps or not after_steps:
            # Constraint references steps not present — skip silently
            return violations

        # Build reachability: set of step orders reachable FROM each step
        reachable = self._build_reachability(recipe)

        for a_step in after_steps:
            # At least one before_step must be an ancestor of a_step
            has_ancestor = any(
                b_step.order in reachable.get(a_step.order, set())
                for b_step in before_steps
            )
            if not has_ancestor:
                violations.append(ConstraintViolation(
                    step_order=a_step.order,
                    constraint_name="OrderingConstraint",
                    message=(
                        f"Step {a_step.order} ('{a_step.title}') must depend on "
                        f"a step matching '{ordering.before_step}'"
                    ),
                ))

        return violations

    def _check_mutual_exclusion(
        self, recipe: "Recipe", exclusion: MutualExclusion,
    ) -> List[ConstraintViolation]:
        """Verify that mutually exclusive steps are not in the same parallel batch."""
        violations: List[ConstraintViolation] = []

        matched = [
            s for s in recipe.steps
            if any(
                pattern.lower() in s.title.lower()
                for pattern in exclusion.step_titles
            )
        ]

        if len(matched) < 2:
            return violations

        # Two steps can run concurrently if neither is an ancestor of the other
        reachable = self._build_reachability(recipe)

        for i, s1 in enumerate(matched):
            for s2 in matched[i + 1:]:
                s1_reaches_s2 = s1.order in reachable.get(s2.order, set())
                s2_reaches_s1 = s2.order in reachable.get(s1.order, set())
                if not s1_reaches_s2 and not s2_reaches_s1:
                    violations.append(ConstraintViolation(
                        step_order=s1.order,
                        constraint_name="MutualExclusion",
                        message=(
                            f"Steps {s1.order} ('{s1.title}') and "
                            f"{s2.order} ('{s2.title}') may run concurrently "
                            f"but are mutually exclusive"
                        ),
                    ))

        return violations

    def _check_time_bound(
        self, recipe: "Recipe", bound: TimeBound,
    ) -> List[ConstraintViolation]:
        """Validate TimeBound fields are sane (positive values).

        At plan-time there is no actual duration data — we only validate
        that the constraint itself is well-formed.
        """
        violations: List[ConstraintViolation] = []

        if bound.max_step_duration_s is not None and bound.max_step_duration_s <= 0:
            violations.append(ConstraintViolation(
                step_order=0,
                constraint_name="TimeBound.max_step_duration_s",
                message="max_step_duration_s must be positive",
            ))

        if bound.max_total_duration_s is not None and bound.max_total_duration_s <= 0:
            violations.append(ConstraintViolation(
                step_order=0,
                constraint_name="TimeBound.max_total_duration_s",
                message="max_total_duration_s must be positive",
            ))

        return violations

    # ------------------------------------------------------------------
    # Graph utilities
    # ------------------------------------------------------------------

    def _build_reachability(self, recipe: "Recipe") -> dict:
        """Return a dict mapping step.order → set of ancestor step orders.

        An ancestor is any step that can reach the given step through the
        dependency chain.
        """
        # Map order → step for quick lookup
        step_map = {s.order: s for s in recipe.steps}

        # Memoised DFS
        cache: dict = {}

        def ancestors(order: int) -> set:
            if order in cache:
                return cache[order]
            result: set = set()
            step = step_map.get(order)
            if step is None:
                cache[order] = result
                return result
            deps = step.params.get("dependencies", []) or step.dependencies
            for dep in deps:
                result.add(dep)
                result.update(ancestors(dep))
            cache[order] = result
            return result

        return {s.order: ancestors(s.order) for s in recipe.steps}

    def _dag_width(self, recipe: "Recipe") -> int:
        """Compute maximum number of steps that could run concurrently.

        Uses topological level assignment: steps with no unfinished
        predecessors share the same level.
        """
        if not recipe.steps:
            return 0

        # Assign levels via BFS
        order_to_deps = {
            s.order: set(
                s.params.get("dependencies", []) or s.dependencies
            )
            for s in recipe.steps
        }

        levels: dict = {}
        for step in recipe.steps:
            deps = order_to_deps[step.order]
            if not deps:
                levels[step.order] = 0
            else:
                parent_levels = [levels.get(d, 0) for d in deps if d in levels]
                levels[step.order] = (max(parent_levels) + 1) if parent_levels else 0

        # Count how many steps share the same level
        from collections import Counter
        level_counts = Counter(levels.values())
        return max(level_counts.values()) if level_counts else 0


__all__ = [
    "ConstraintEngine",
    "ConstraintViolation",
    "MutualExclusion",
    "OrderingConstraint",
    "PlanConstraints",
    "ResourceLimit",
    "TimeBound",
]

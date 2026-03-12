"""Mekong CLI - Plan Optimizer.

Minimizes critical path by removing transitive dependency edges while
respecting PlanConstraints (OrderingConstraint, MutualExclusion).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from .parser import Recipe, RecipeStep
    from .plan_constraints import PlanConstraints


@dataclass
class OptimizationResult:
    """Metrics from a single optimize() run."""

    critical_path_before: int
    critical_path_after: int
    edges_removed: int
    parallelism_score: float  # 0.0 = sequential, 1.0 = fully parallel


class PlanOptimizer:
    """Minimizes critical path via transitive reduction, respecting constraints.

    Usage::

        optimizer = PlanOptimizer()
        result = optimizer.optimize(recipe, constraints)
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def compute_critical_path(self, steps: List["RecipeStep"]) -> int:
        """Return the length (step count) of the longest dependency chain.

        Uses topological level assignment: each step's level equals
        1 + max(level of its dependencies), with root steps at level 1.

        Args:
            steps: List of RecipeStep objects with .dependencies populated.

        Returns:
            Integer length of the critical path (0 if no steps).

        """
        if not steps:
            return 0

        step_map = {s.order: s for s in steps}
        levels: dict[int, int] = {}

        def level_of(order: int) -> int:
            if order in levels:
                return levels[order]
            step = step_map.get(order)
            if step is None or not step.dependencies:
                levels[order] = 1
                return 1
            parent_max = max(level_of(d) for d in step.dependencies)
            levels[order] = parent_max + 1
            return levels[order]

        for s in steps:
            level_of(s.order)

        return max(levels.values())

    def remove_transitive_edges(
        self,
        steps: List["RecipeStep"],
        constraints: Optional["PlanConstraints"] = None,
    ) -> int:
        """Remove transitive dependency edges (transitive reduction).

        If A -> B -> C exists, the A -> C edge is redundant and removed.
        Edges protected by OrderingConstraint or MutualExclusion are kept.

        Args:
            steps: List of RecipeStep objects (mutated in-place).
            constraints: Optional constraints that protect certain edges.

        Returns:
            Number of edges removed.

        """
        protected = self._build_protected_pairs(steps, constraints)
        removed = 0

        for step in steps:
            if len(step.dependencies) < 2:
                continue

            to_remove = []
            for dep in list(step.dependencies):
                # Check if dep is reachable via another dependency (transitive)
                other_deps = [d for d in step.dependencies if d != dep]
                if self._reachable_from(dep, other_deps, steps):
                    pair = (dep, step.order)
                    if pair not in protected:
                        to_remove.append(dep)

            for dep in to_remove:
                step.dependencies.remove(dep)
                if "dependencies" in step.params:
                    try:
                        step.params["dependencies"].remove(dep)
                    except ValueError:
                        pass
                removed += 1

        return removed

    def compute_parallelism_score(self, steps: List["RecipeStep"]) -> float:
        """Compute how parallel the plan is.

        Score = 1 - (critical_path / total_steps).
        0.0 = fully sequential, 1.0 = fully parallel (all independent).

        Args:
            steps: List of RecipeStep objects.

        Returns:
            Float in [0.0, 1.0].

        """
        n = len(steps)
        if n <= 1:
            return 0.0
        cp = self.compute_critical_path(steps)
        return 1.0 - (cp / n)

    def optimize(
        self,
        recipe: "Recipe",
        constraints: Optional["PlanConstraints"] = None,
    ) -> OptimizationResult:
        """Run transitive reduction on recipe steps and compute metrics.

        Args:
            recipe: Recipe to optimize (steps mutated in-place).
            constraints: Optional constraints protecting certain edges.

        Returns:
            OptimizationResult with before/after metrics.

        """
        steps = recipe.steps
        cp_before = self.compute_critical_path(steps)
        edges_removed = self.remove_transitive_edges(steps, constraints)
        cp_after = self.compute_critical_path(steps)
        score = self.compute_parallelism_score(steps)

        return OptimizationResult(
            critical_path_before=cp_before,
            critical_path_after=cp_after,
            edges_removed=edges_removed,
            parallelism_score=score,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _reachable_from(
        self,
        target: int,
        start_deps: List[int],
        steps: List["RecipeStep"],
    ) -> bool:
        """Return True if target is reachable (transitively) from any node in start_deps."""
        step_map = {s.order: s for s in steps}
        visited: set[int] = set()
        queue = list(start_deps)

        while queue:
            node = queue.pop()
            if node == target:
                return True
            if node in visited:
                continue
            visited.add(node)
            step = step_map.get(node)
            if step:
                queue.extend(step.dependencies)

        return False

    def _build_protected_pairs(
        self,
        steps: List["RecipeStep"],
        constraints: Optional["PlanConstraints"],
    ) -> set[tuple[int, int]]:
        """Build set of (dep_order, step_order) pairs that MUST NOT be removed.

        Pairs are protected when:
        - An OrderingConstraint requires a direct edge between two steps.
        - A MutualExclusion requires one step to depend on another.
        """
        protected: set[tuple[int, int]] = set()
        if not constraints:
            return protected

        # OrderingConstraint: before_step must be ancestor of after_step.
        # We protect the direct edge if both match single steps.
        for oc in constraints.ordering:
            befores = [
                s for s in steps
                if oc.before_step.lower() in s.title.lower()
            ]
            afters = [
                s for s in steps
                if oc.after_step.lower() in s.title.lower()
            ]
            for b in befores:
                for a in afters:
                    protected.add((b.order, a.order))

        # MutualExclusion: ensure serialization edge is not removed
        for me in constraints.mutual_exclusions:
            matched = [
                s for s in steps
                if any(p.lower() in s.title.lower() for p in me.step_titles)
            ]
            for i, s1 in enumerate(matched):
                for s2 in matched[i + 1:]:
                    # Protect whichever direction the dependency runs
                    if s2.order in s1.dependencies:
                        protected.add((s2.order, s1.order))
                    if s1.order in s2.dependencies:
                        protected.add((s1.order, s2.order))

        return protected


__all__ = ["OptimizationResult", "PlanOptimizer"]

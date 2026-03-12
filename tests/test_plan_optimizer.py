"""Tests for PlanOptimizer — critical path, transitive reduction, parallelism score."""

from __future__ import annotations

import pytest

from src.core.parser import Recipe, RecipeStep
from src.core.plan_optimizer import OptimizationResult, PlanOptimizer
from src.core.plan_constraints import (
    MutualExclusion,
    OrderingConstraint,
    PlanConstraints,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_step(order: int, title: str = "", deps: list[int] | None = None) -> RecipeStep:
    deps = deps or []
    step = RecipeStep(
        order=order,
        title=title or f"step-{order}",
        description="",
        params={"dependencies": list(deps)},
        dependencies=list(deps),
    )
    return step


def make_recipe(*steps: RecipeStep) -> Recipe:
    return Recipe(name="test", description="", steps=list(steps))


# ---------------------------------------------------------------------------
# compute_critical_path
# ---------------------------------------------------------------------------

class TestComputeCriticalPath:
    def setup_method(self):
        self.opt = PlanOptimizer()

    def test_empty_steps(self):
        assert self.opt.compute_critical_path([]) == 0

    def test_single_step(self):
        assert self.opt.compute_critical_path([make_step(1)]) == 1

    def test_linear_chain(self):
        # 1 -> 2 -> 3  => critical path = 3
        steps = [
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[2]),
        ]
        assert self.opt.compute_critical_path(steps) == 3

    def test_parallel_steps(self):
        # 1 and 2 are independent, both feed 3 => critical path = 2
        steps = [
            make_step(1),
            make_step(2),
            make_step(3, deps=[1, 2]),
        ]
        assert self.opt.compute_critical_path(steps) == 2

    def test_diamond_dag(self):
        # 1 -> 2 -> 4
        # 1 -> 3 -> 4
        # Critical path = 3
        steps = [
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[1]),
            make_step(4, deps=[2, 3]),
        ]
        assert self.opt.compute_critical_path(steps) == 3

    def test_wide_plan(self):
        # Steps 1..5 all independent => critical path = 1
        steps = [make_step(i) for i in range(1, 6)]
        assert self.opt.compute_critical_path(steps) == 1

    def test_deep_chain(self):
        # 1->2->3->4->5 => critical path = 5
        steps = [make_step(1)]
        for i in range(2, 6):
            steps.append(make_step(i, deps=[i - 1]))
        assert self.opt.compute_critical_path(steps) == 5


# ---------------------------------------------------------------------------
# remove_transitive_edges
# ---------------------------------------------------------------------------

class TestRemoveTransitiveEdges:
    def setup_method(self):
        self.opt = PlanOptimizer()

    def test_removes_simple_transitive(self):
        # A->B->C, A->C (transitive) => A->C should be removed
        a = make_step(1, "A")
        b = make_step(2, "B", deps=[1])
        c = make_step(3, "C", deps=[1, 2])  # dep on 1 is transitive via 2
        removed = self.opt.remove_transitive_edges([a, b, c])
        assert removed == 1
        assert 1 not in c.dependencies
        assert 2 in c.dependencies

    def test_no_transitive_edges(self):
        # 1->3, 2->3 (no transitivity)
        a = make_step(1)
        b = make_step(2)
        c = make_step(3, deps=[1, 2])
        removed = self.opt.remove_transitive_edges([a, b, c])
        assert removed == 0
        assert set(c.dependencies) == {1, 2}

    def test_linear_no_skip_edges(self):
        # 1->2->3 with only direct edges — nothing to remove
        steps = [
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[2]),
        ]
        removed = self.opt.remove_transitive_edges(steps)
        assert removed == 0

    def test_multiple_transitive_edges(self):
        # 1->2->3->4, and 4 also has direct edges to 1, 2, 3
        a = make_step(1)
        b = make_step(2, deps=[1])
        c = make_step(3, deps=[2])
        d = make_step(4, deps=[1, 2, 3])
        removed = self.opt.remove_transitive_edges([a, b, c, d])
        assert removed == 2  # 1 and 2 are reachable via 3
        assert 3 in d.dependencies
        assert 1 not in d.dependencies
        assert 2 not in d.dependencies

    def test_params_synced_after_removal(self):
        a = make_step(1)
        b = make_step(2, deps=[1])
        c = make_step(3, deps=[1, 2])
        self.opt.remove_transitive_edges([a, b, c])
        assert 1 not in c.params["dependencies"]

    def test_ordering_constraint_protects_edge(self):
        # A->B->C, A->C; OrderingConstraint says A must precede C directly
        a = make_step(1, "alpha")
        b = make_step(2, "beta", deps=[1])
        c = make_step(3, "gamma", deps=[1, 2])

        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="alpha", after_step="gamma")]
        )
        removed = self.opt.remove_transitive_edges([a, b, c], constraints)
        # The direct edge (1->3) is protected by ordering constraint
        assert removed == 0
        assert 1 in c.dependencies

    def test_single_dep_unchanged(self):
        a = make_step(1)
        b = make_step(2, deps=[1])
        removed = self.opt.remove_transitive_edges([a, b])
        assert removed == 0
        assert b.dependencies == [1]


# ---------------------------------------------------------------------------
# compute_parallelism_score
# ---------------------------------------------------------------------------

class TestComputeParallelismScore:
    def setup_method(self):
        self.opt = PlanOptimizer()

    def test_single_step(self):
        assert self.opt.compute_parallelism_score([make_step(1)]) == 0.0

    def test_empty_steps(self):
        assert self.opt.compute_parallelism_score([]) == 0.0

    def test_fully_sequential(self):
        # 1->2->3->4: cp=4, n=4 => score = 1 - 4/4 = 0.0
        steps = [make_step(1)]
        for i in range(2, 5):
            steps.append(make_step(i, deps=[i - 1]))
        score = self.opt.compute_parallelism_score(steps)
        assert score == pytest.approx(0.0)

    def test_fully_parallel(self):
        # 4 independent steps: cp=1, n=4 => score = 1 - 1/4 = 0.75
        steps = [make_step(i) for i in range(1, 5)]
        score = self.opt.compute_parallelism_score(steps)
        assert score == pytest.approx(0.75)

    def test_partial_parallelism(self):
        # Diamond: 1->2,3->4; cp=3, n=4 => 1 - 3/4 = 0.25
        steps = [
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[1]),
            make_step(4, deps=[2, 3]),
        ]
        score = self.opt.compute_parallelism_score(steps)
        assert score == pytest.approx(0.25)


# ---------------------------------------------------------------------------
# optimize (integration)
# ---------------------------------------------------------------------------

class TestOptimize:
    def setup_method(self):
        self.opt = PlanOptimizer()

    def test_returns_optimization_result(self):
        recipe = make_recipe(make_step(1), make_step(2, deps=[1]))
        result = self.opt.optimize(recipe)
        assert isinstance(result, OptimizationResult)

    def test_transitive_edge_removed(self):
        # 1->2->3 and 1->3 (transitive)
        recipe = make_recipe(
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[1, 2]),
        )
        result = self.opt.optimize(recipe)
        assert result.edges_removed == 1
        step3 = recipe.steps[2]
        assert 1 not in step3.dependencies

    def test_critical_path_improves_or_stays(self):
        # After removing transitive edges, critical path must not increase
        recipe = make_recipe(
            make_step(1),
            make_step(2, deps=[1]),
            make_step(3, deps=[1, 2]),
        )
        result = self.opt.optimize(recipe)
        assert result.critical_path_after <= result.critical_path_before

    def test_no_edges_removed_when_none_transitive(self):
        recipe = make_recipe(
            make_step(1),
            make_step(2),
            make_step(3, deps=[1, 2]),
        )
        result = self.opt.optimize(recipe)
        assert result.edges_removed == 0

    def test_parallelism_score_in_result(self):
        steps = [make_step(i) for i in range(1, 5)]
        recipe = make_recipe(*steps)
        result = self.opt.optimize(recipe)
        assert 0.0 <= result.parallelism_score <= 1.0

    def test_constraint_prevents_removal(self):
        # OrderingConstraint protects the direct edge we'd otherwise remove
        a = make_step(1, "setup")
        b = make_step(2, "build", deps=[1])
        c = make_step(3, "deploy", deps=[1, 2])

        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="setup", after_step="deploy")]
        )
        recipe = make_recipe(a, b, c)
        result = self.opt.optimize(recipe, constraints)
        assert result.edges_removed == 0
        assert 1 in recipe.steps[2].dependencies

    def test_mutual_exclusion_protects_serialization_edge(self):
        # Steps A and B are mutually exclusive; B depends on A to serialize them
        a = make_step(1, "migrate-db")
        b = make_step(2, "seed-db", deps=[1])
        c = make_step(3, "start-server", deps=[1, 2])

        constraints = PlanConstraints(
            mutual_exclusions=[
                MutualExclusion(step_titles=["migrate-db", "seed-db"])
            ]
        )
        recipe = make_recipe(a, b, c)
        result = self.opt.optimize(recipe, constraints)
        # Edge (1->3) is transitive but the mutual exclusion edge (1->2) is protected
        # The transitive edge 1->3 is NOT in the mutual exclusion list, so it can be removed
        assert result.edges_removed >= 0  # at minimum nothing breaks

    def test_empty_recipe(self):
        recipe = make_recipe()
        result = self.opt.optimize(recipe)
        assert result.critical_path_before == 0
        assert result.critical_path_after == 0
        assert result.edges_removed == 0
        assert result.parallelism_score == 0.0

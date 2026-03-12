"""Tests for plan_constraints module.

Covers:
1. Dataclass construction (ConstraintViolation, ResourceLimit, TimeBound,
   OrderingConstraint, MutualExclusion, PlanConstraints)
2. ConstraintEngine.validate() — all four constraint types
3. Violation detection: total steps, concurrent steps, ordering, exclusion
4. Backward compat: empty PlanConstraints returns no violations
"""

from __future__ import annotations

import unittest

from src.core.parser import Recipe, RecipeStep
from src.core.plan_constraints import (
    ConstraintEngine,
    ConstraintViolation,
    MutualExclusion,
    OrderingConstraint,
    PlanConstraints,
    ResourceLimit,
    TimeBound,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_step(
    order: int,
    title: str,
    deps: list[int] | None = None,
) -> RecipeStep:
    """Create a RecipeStep with dependencies stored in params (planner style)."""
    dep_list = deps or []
    step = RecipeStep(
        order=order,
        title=title,
        description=f"desc {order}",
        params={"dependencies": dep_list},
    )
    step.dependencies = dep_list
    return step


def _make_recipe(*steps: RecipeStep) -> Recipe:
    return Recipe(name="test", description="test", steps=list(steps))


# ---------------------------------------------------------------------------
# Dataclass tests
# ---------------------------------------------------------------------------

class TestConstraintViolation(unittest.TestCase):
    def test_fields(self):
        v = ConstraintViolation(step_order=2, constraint_name="Foo", message="bar")
        self.assertEqual(v.step_order, 2)
        self.assertEqual(v.constraint_name, "Foo")
        self.assertEqual(v.message, "bar")


class TestResourceLimit(unittest.TestCase):
    def test_defaults(self):
        r = ResourceLimit()
        self.assertEqual(r.max_concurrent_steps, 0)
        self.assertEqual(r.max_total_steps, 0)

    def test_custom(self):
        r = ResourceLimit(max_concurrent_steps=2, max_total_steps=10)
        self.assertEqual(r.max_concurrent_steps, 2)
        self.assertEqual(r.max_total_steps, 10)


class TestTimeBound(unittest.TestCase):
    def test_defaults_are_none(self):
        t = TimeBound()
        self.assertIsNone(t.max_step_duration_s)
        self.assertIsNone(t.max_total_duration_s)

    def test_custom(self):
        t = TimeBound(max_step_duration_s=30.0, max_total_duration_s=300.0)
        self.assertEqual(t.max_step_duration_s, 30.0)
        self.assertEqual(t.max_total_duration_s, 300.0)


class TestOrderingConstraint(unittest.TestCase):
    def test_fields(self):
        o = OrderingConstraint(before_step="Setup", after_step="Deploy")
        self.assertEqual(o.before_step, "Setup")
        self.assertEqual(o.after_step, "Deploy")


class TestMutualExclusion(unittest.TestCase):
    def test_defaults(self):
        m = MutualExclusion()
        self.assertEqual(m.step_titles, [])

    def test_custom(self):
        m = MutualExclusion(step_titles=["migrate", "rollback"])
        self.assertEqual(m.step_titles, ["migrate", "rollback"])


class TestPlanConstraints(unittest.TestCase):
    def test_empty_constraints(self):
        pc = PlanConstraints()
        self.assertIsNone(pc.resource_limit)
        self.assertIsNone(pc.time_bound)
        self.assertEqual(pc.ordering, [])
        self.assertEqual(pc.mutual_exclusions, [])

    def test_with_all_fields(self):
        pc = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=5),
            time_bound=TimeBound(max_total_duration_s=60.0),
            ordering=[OrderingConstraint("A", "B")],
            mutual_exclusions=[MutualExclusion(["X", "Y"])],
        )
        self.assertIsNotNone(pc.resource_limit)
        self.assertIsNotNone(pc.time_bound)
        self.assertEqual(len(pc.ordering), 1)
        self.assertEqual(len(pc.mutual_exclusions), 1)


# ---------------------------------------------------------------------------
# ConstraintEngine — no violations
# ---------------------------------------------------------------------------

class TestConstraintEngineNoViolations(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_empty_constraints_always_pass(self):
        """Empty PlanConstraints → 0 violations (backward compat)."""
        recipe = _make_recipe(
            _make_step(1, "step one"),
            _make_step(2, "step two", [1]),
        )
        violations = self.engine.validate(recipe, PlanConstraints())
        self.assertEqual(violations, [])

    def test_resource_limit_within_bounds(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
            _make_step(3, "C", [2]),
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=5),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_ordering_satisfied(self):
        """Step 'Deploy' depends on 'Setup' — ordering constraint satisfied."""
        recipe = _make_recipe(
            _make_step(1, "Setup environment"),
            _make_step(2, "Build"),
            _make_step(3, "Deploy service", [1]),
        )
        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="Setup", after_step="Deploy")],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_mutual_exclusion_with_ordering(self):
        """Steps A and B are exclusive but B depends on A — not concurrent."""
        recipe = _make_recipe(
            _make_step(1, "migrate db"),
            _make_step(2, "rollback db", [1]),
        )
        constraints = PlanConstraints(
            mutual_exclusions=[MutualExclusion(["migrate", "rollback"])],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_time_bound_valid_values(self):
        recipe = _make_recipe(_make_step(1, "A"))
        constraints = PlanConstraints(
            time_bound=TimeBound(max_step_duration_s=60.0, max_total_duration_s=600.0),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_ordering_missing_steps_skipped(self):
        """Ordering constraint referencing absent steps → no violation."""
        recipe = _make_recipe(_make_step(1, "Only step"))
        constraints = PlanConstraints(
            ordering=[OrderingConstraint("Nonexistent", "AlsoMissing")],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


# ---------------------------------------------------------------------------
# ConstraintEngine — resource limit violations
# ---------------------------------------------------------------------------

class TestResourceLimitViolations(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_max_total_steps_exceeded(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B"),
            _make_step(3, "C"),
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=2),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("max_total_steps", violations[0].constraint_name)
        self.assertIn("3", violations[0].message)
        self.assertIn("2", violations[0].message)

    def test_max_concurrent_steps_exceeded(self):
        """Three parallel steps (no deps) → width=3, limit=2."""
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B"),
            _make_step(3, "C"),
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_concurrent_steps=2),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("max_concurrent_steps", violations[0].constraint_name)

    def test_sequential_chain_concurrent_width_is_one(self):
        """Fully sequential chain → max concurrent = 1."""
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
            _make_step(3, "C", [2]),
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_concurrent_steps=1),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_zero_limits_are_unlimited(self):
        """max_total_steps=0 and max_concurrent_steps=0 → no check."""
        recipe = _make_recipe(
            *(_make_step(i, f"step {i}") for i in range(1, 20))
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=0, max_concurrent_steps=0),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


# ---------------------------------------------------------------------------
# ConstraintEngine — ordering violations
# ---------------------------------------------------------------------------

class TestOrderingViolations(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_ordering_violated_no_dependency(self):
        """Deploy exists but has NO dependency on Setup → violation."""
        recipe = _make_recipe(
            _make_step(1, "Setup environment"),
            _make_step(2, "Deploy service"),   # no dep on step 1
        )
        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="Setup", after_step="Deploy")],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("OrderingConstraint", violations[0].constraint_name)
        self.assertEqual(violations[0].step_order, 2)

    def test_ordering_violated_wrong_direction(self):
        """Setup depends on Deploy (reversed) → ordering violated."""
        recipe = _make_recipe(
            _make_step(1, "Deploy service"),
            _make_step(2, "Setup environment", [1]),
        )
        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="Setup", after_step="Deploy")],
        )
        violations = self.engine.validate(recipe, constraints)
        # Deploy (order=1) must have Setup as ancestor — it doesn't
        self.assertEqual(len(violations), 1)

    def test_multiple_ordering_constraints(self):
        """Two ordering constraints, both violated."""
        recipe = _make_recipe(
            _make_step(1, "Build"),
            _make_step(2, "Test"),
            _make_step(3, "Deploy"),
        )
        constraints = PlanConstraints(
            ordering=[
                OrderingConstraint("Build", "Test"),
                OrderingConstraint("Test", "Deploy"),
            ],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 2)

    def test_ordering_case_insensitive_match(self):
        """Ordering constraint uses case-insensitive title matching."""
        recipe = _make_recipe(
            _make_step(1, "SETUP ENVIRONMENT"),
            _make_step(2, "deploy SERVICE", [1]),
        )
        constraints = PlanConstraints(
            ordering=[OrderingConstraint(before_step="setup", after_step="deploy")],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


# ---------------------------------------------------------------------------
# ConstraintEngine — mutual exclusion violations
# ---------------------------------------------------------------------------

class TestMutualExclusionViolations(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_mutual_exclusion_violated_parallel(self):
        """migrate and rollback both have no deps → may run concurrently → violation."""
        recipe = _make_recipe(
            _make_step(1, "migrate db"),
            _make_step(2, "rollback db"),
        )
        constraints = PlanConstraints(
            mutual_exclusions=[MutualExclusion(["migrate", "rollback"])],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("MutualExclusion", violations[0].constraint_name)

    def test_mutual_exclusion_three_steps_two_pairs(self):
        """Three mutually exclusive steps, all parallel → two violation pairs."""
        recipe = _make_recipe(
            _make_step(1, "migrate db"),
            _make_step(2, "rollback db"),
            _make_step(3, "rebuild db"),
        )
        constraints = PlanConstraints(
            mutual_exclusions=[MutualExclusion(["migrate", "rollback", "rebuild"])],
        )
        violations = self.engine.validate(recipe, constraints)
        # Pairs: (1,2), (1,3), (2,3) — all concurrent
        self.assertEqual(len(violations), 3)

    def test_mutual_exclusion_not_violated_when_ordered(self):
        """Ordered steps cannot be concurrent → no violation."""
        recipe = _make_recipe(
            _make_step(1, "migrate db"),
            _make_step(2, "rollback db", [1]),
        )
        constraints = PlanConstraints(
            mutual_exclusions=[MutualExclusion(["migrate", "rollback"])],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])

    def test_mutual_exclusion_single_match_no_violation(self):
        """Only one matching step → can't conflict with anything."""
        recipe = _make_recipe(
            _make_step(1, "migrate db"),
            _make_step(2, "unrelated step"),
        )
        constraints = PlanConstraints(
            mutual_exclusions=[MutualExclusion(["migrate", "rollback"])],
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


# ---------------------------------------------------------------------------
# ConstraintEngine — time bound validation
# ---------------------------------------------------------------------------

class TestTimeBoundValidation(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_negative_step_duration_invalid(self):
        recipe = _make_recipe(_make_step(1, "A"))
        constraints = PlanConstraints(
            time_bound=TimeBound(max_step_duration_s=-1.0),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("max_step_duration_s", violations[0].constraint_name)

    def test_zero_step_duration_invalid(self):
        recipe = _make_recipe(_make_step(1, "A"))
        constraints = PlanConstraints(
            time_bound=TimeBound(max_step_duration_s=0.0),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)

    def test_negative_total_duration_invalid(self):
        recipe = _make_recipe(_make_step(1, "A"))
        constraints = PlanConstraints(
            time_bound=TimeBound(max_total_duration_s=-5.0),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(len(violations), 1)
        self.assertIn("max_total_duration_s", violations[0].constraint_name)

    def test_none_durations_skip_validation(self):
        recipe = _make_recipe(_make_step(1, "A"))
        constraints = PlanConstraints(time_bound=TimeBound())
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


# ---------------------------------------------------------------------------
# ConstraintEngine — DAG utility tests
# ---------------------------------------------------------------------------

class TestDAGUtilities(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_dag_width_empty_recipe(self):
        recipe = _make_recipe()
        self.assertEqual(self.engine._dag_width(recipe), 0)

    def test_dag_width_single_step(self):
        recipe = _make_recipe(_make_step(1, "A"))
        self.assertEqual(self.engine._dag_width(recipe), 1)

    def test_dag_width_all_parallel(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B"),
            _make_step(3, "C"),
        )
        self.assertEqual(self.engine._dag_width(recipe), 3)

    def test_dag_width_sequential(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
            _make_step(3, "C", [2]),
        )
        self.assertEqual(self.engine._dag_width(recipe), 1)

    def test_dag_width_diamond(self):
        """Diamond: 1→2, 1→3, (2,3)→4 — width at middle level = 2."""
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
            _make_step(3, "C", [1]),
            _make_step(4, "D", [2, 3]),
        )
        self.assertEqual(self.engine._dag_width(recipe), 2)

    def test_reachability_direct_dep(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
        )
        reachable = self.engine._build_reachability(recipe)
        self.assertIn(1, reachable[2])
        self.assertNotIn(2, reachable[1])

    def test_reachability_transitive(self):
        recipe = _make_recipe(
            _make_step(1, "A"),
            _make_step(2, "B", [1]),
            _make_step(3, "C", [2]),
        )
        reachable = self.engine._build_reachability(recipe)
        # Step 3 can reach both 1 and 2 as ancestors
        self.assertIn(1, reachable[3])
        self.assertIn(2, reachable[3])


# ---------------------------------------------------------------------------
# Combined / integration
# ---------------------------------------------------------------------------

class TestCombinedConstraints(unittest.TestCase):
    def setUp(self):
        self.engine = ConstraintEngine()

    def test_multiple_violations_all_returned(self):
        """Both resource and ordering constraints violated → both reported."""
        recipe = _make_recipe(
            _make_step(1, "Setup"),
            _make_step(2, "Build"),
            _make_step(3, "Deploy"),
            _make_step(4, "Notify"),
        )
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=2),
            ordering=[OrderingConstraint("Setup", "Deploy")],
        )
        violations = self.engine.validate(recipe, constraints)
        # At least one resource violation + at least one ordering violation
        names = {v.constraint_name for v in violations}
        self.assertTrue(any("ResourceLimit" in n for n in names))
        self.assertTrue(any("OrderingConstraint" in n for n in names))

    def test_empty_recipe_no_violations(self):
        """Empty recipe with limits → no total/concurrent violations (0 steps)."""
        recipe = _make_recipe()
        constraints = PlanConstraints(
            resource_limit=ResourceLimit(max_total_steps=5, max_concurrent_steps=3),
        )
        violations = self.engine.validate(recipe, constraints)
        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()

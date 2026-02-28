"""
Integration tests for the full Plan -> Execute -> Verify flow.

Tests the RecipeOrchestrator end-to-end using real Recipe objects
with simple shell steps (echo) to validate the orchestration pipeline.
"""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from src.core.orchestrator import (
    RecipeOrchestrator,
    OrchestrationResult,
    OrchestrationStatus,
    StepResult,
)
from src.core.parser import Recipe, RecipeStep
from src.core.verifier import ExecutionResult


@pytest.fixture
def orchestrator():
    """Create an orchestrator with no LLM client and rollback disabled."""
    return RecipeOrchestrator(
        llm_client=None,
        strict_verification=True,
        enable_rollback=False,
    )


def _make_recipe(name: str, steps: list) -> Recipe:
    """Helper to build a Recipe from a list of RecipeStep objects."""
    return Recipe(
        name=name,
        description=f"Test recipe: {name}",
        steps=steps,
        metadata={"source": "test"},
    )


# -------------------------------------------------------------------
# 1. test_orchestrator_init
# -------------------------------------------------------------------
def test_orchestrator_init():
    """Verify default settings on a freshly created orchestrator."""
    orch = RecipeOrchestrator(
        llm_client=None,
        strict_verification=True,
        enable_rollback=True,
    )

    assert orch.enable_rollback is True
    assert orch.verifier.strict_mode is True
    assert orch.planner is not None
    assert orch.verifier is not None
    assert orch.console is not None


# -------------------------------------------------------------------
# 2. test_run_from_recipe_success
# -------------------------------------------------------------------
def test_run_from_recipe_success(orchestrator):
    """Run a single-step recipe with exit_code verification; expect SUCCESS."""
    step = RecipeStep(
        order=1,
        title="Echo test",
        description="echo hello_mekong",
        params={"verification": {"exit_code": 0}},
    )
    recipe = _make_recipe("success-recipe", [step])

    result = orchestrator.run_from_recipe(recipe)

    assert result.status == OrchestrationStatus.SUCCESS
    assert result.completed_steps == 1
    assert result.failed_steps == 0
    assert result.total_steps == 1
    assert len(result.step_results) == 1


# -------------------------------------------------------------------
# 3. test_run_from_recipe_empty
# -------------------------------------------------------------------
def test_run_from_recipe_empty(orchestrator):
    """An empty recipe (0 steps) should return SUCCESS with 0 completed."""
    recipe = _make_recipe("empty-recipe", [])

    result = orchestrator.run_from_recipe(recipe)

    assert result.status == OrchestrationStatus.SUCCESS
    assert result.total_steps == 0
    assert result.completed_steps == 0
    assert result.failed_steps == 0
    assert len(result.step_results) == 0


# -------------------------------------------------------------------
# 4. test_orchestration_result_properties
# -------------------------------------------------------------------
def test_orchestration_result_properties():
    """Test success_rate calculation on OrchestrationResult."""
    recipe = _make_recipe("dummy", [])

    # 3 total, 2 completed => 66.67%
    result = OrchestrationResult(
        status=OrchestrationStatus.PARTIAL,
        recipe=recipe,
        total_steps=3,
        completed_steps=2,
        failed_steps=1,
    )
    assert abs(result.success_rate - 66.66666666666667) < 0.01

    # 0 total => 0.0%
    result_empty = OrchestrationResult(
        status=OrchestrationStatus.SUCCESS,
        recipe=recipe,
        total_steps=0,
        completed_steps=0,
    )
    assert result_empty.success_rate == 0.0

    # 5 total, 5 completed => 100%
    result_full = OrchestrationResult(
        status=OrchestrationStatus.SUCCESS,
        recipe=recipe,
        total_steps=5,
        completed_steps=5,
    )
    assert result_full.success_rate == 100.0


# -------------------------------------------------------------------
# 5. test_step_result_structure
# -------------------------------------------------------------------
def test_step_result_structure(orchestrator):
    """Verify StepResult contains step, execution, and verification fields."""
    step = RecipeStep(
        order=1,
        title="Structure check",
        description="echo structure_ok",
        params={"verification": {"exit_code": 0}},
    )
    recipe = _make_recipe("structure-recipe", [step])

    result = orchestrator.run_from_recipe(recipe)

    assert len(result.step_results) == 1
    sr = result.step_results[0]

    # StepResult must carry all three components
    assert isinstance(sr, StepResult)
    assert sr.step is step
    assert isinstance(sr.execution, ExecutionResult)
    assert sr.verification is not None
    assert hasattr(sr.verification, "passed")
    assert hasattr(sr.verification, "checks")
    assert sr.verification.passed is True

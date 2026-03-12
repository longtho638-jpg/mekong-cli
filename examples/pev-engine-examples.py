"""PEV Engine Examples — Plan, Execute, Verify workflow demonstrations.

Run: python3 examples/pev-engine-examples.py
No LLM API required — LLM steps use mocks.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.core.dag_scheduler import DAGScheduler, validate_dag
from src.core.parser import Recipe, RecipeParser, RecipeStep
from src.core.planner import PlanningContext, RecipePlanner, TaskComplexity
from src.core.verifier import ExecutionResult, RecipeVerifier

# Patch broken regex pattern in DANGEROUS_PATTERNS (`: (){` is invalid regex;
# it's a fork-bomb literal). Re-escape all patterns so re.search doesn't crash.
import re as _re
import src.core.executor as _executor_mod
_executor_mod.DANGEROUS_PATTERNS = [
    _re.escape(p) for p in _executor_mod.DANGEROUS_PATTERNS
]

SEP = "-" * 60


# ---------------------------------------------------------------------------
# 1. Basic Recipe Creation
# ---------------------------------------------------------------------------

def example_recipe_creation():
    """Create RecipeStep/Recipe manually and parse from markdown."""
    print(f"\n{SEP}\n1. Basic Recipe Creation\n{SEP}")

    # Manual construction
    step1 = RecipeStep(order=1, title="Install deps", description="pip install requests")
    step2 = RecipeStep(order=2, title="Run tests", description="python3 -m pytest tests/",
                       dependencies=[1], params={"type": "shell"})
    recipe = Recipe(name="CI Pipeline", description="Install then test", steps=[step1, step2])
    print(f"Recipe: {recipe.name!r} | {len(recipe.steps)} steps")
    for s in recipe.steps:
        print(f"  Step {s.order}: {s.title!r}  deps={s.dependencies}")

    # Parse from markdown string
    md = """---
name: Hello World
---

# Hello World Recipe

## Step 1: Say Hello
echo hello world

## Step 2: Say Bye
echo bye
"""
    parser = RecipeParser()
    parsed = parser.parse_string(md, name="inline")
    print(f"\nParsed: {parsed.name!r} | {len(parsed.steps)} steps")
    for s in parsed.steps:
        print(f"  Step {s.order}: {s.title!r}")


# ---------------------------------------------------------------------------
# 2. Planning Phase
# ---------------------------------------------------------------------------

def example_planning():
    """Rule-based decomposition with PlanningContext."""
    print(f"\n{SEP}\n2. Planning Phase\n{SEP}")

    planner = RecipePlanner()  # no LLM → rule-based

    ctx = PlanningContext(
        goal="implement user authentication",
        constraints={"deadline": "1 week", "max_steps": 5},
        complexity=TaskComplexity.MODERATE,
    )

    recipe = planner.plan("implement user authentication", ctx)
    print(f"Plan: {recipe.name!r}")
    print(f"Metadata: {recipe.metadata}")
    for s in recipe.steps:
        print(f"  Step {s.order}: {s.title!r}  deps={s.dependencies}")

    issues = planner.validate_plan(recipe)
    print(f"Validation issues: {issues or 'none'}")


# ---------------------------------------------------------------------------
# 3. Execution Phase
# ---------------------------------------------------------------------------

def example_execution():
    """Execute a real shell step and inspect ExecutionResult."""
    print(f"\n{SEP}\n3. Execution Phase\n{SEP}")
    from src.core.executor import RecipeExecutor

    recipe = Recipe(name="Shell Demo", description="", steps=[
        RecipeStep(order=1, title="List files", description="ls /tmp",
                   params={"type": "shell"}),
    ])
    executor = RecipeExecutor(recipe)
    result = executor.execute_step(recipe.steps[0])

    print(f"exit_code : {result.exit_code}")
    print(f"stdout    : {result.stdout[:60]!r}...")
    print(f"metadata  : {result.metadata}")

    # LLM step with mock (no real API)
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.content = "print('Hello from LLM')"
    mock_resp.model = "mock-model"
    mock_client.chat.return_value = mock_resp
    mock_client.is_available = True

    llm_step = RecipeStep(order=2, title="Generate code", description="Write hello world",
                          params={"type": "llm"})

    # Patch get_client inside executor module
    import src.core.executor as _exec_mod
    import src.core.llm_client as _llm_mod
    original = _llm_mod.get_client
    _llm_mod.get_client = lambda: mock_client
    _exec_mod.get_client = lambda: mock_client  # executor imports directly
    try:
        llm_result = executor.execute_step(llm_step)
        print(f"\nLLM step exit_code: {llm_result.exit_code}")
        print(f"LLM stdout: {llm_result.stdout!r}")
    finally:
        _llm_mod.get_client = original


# ---------------------------------------------------------------------------
# 4. Verification Phase
# ---------------------------------------------------------------------------

def example_verification():
    """Verify exit code, file existence, output patterns, custom checks."""
    print(f"\n{SEP}\n4. Verification Phase\n{SEP}")

    verifier = RecipeVerifier(strict_mode=False)

    ok_result = ExecutionResult(exit_code=0, stdout="3 tests passed", stderr="")
    _fail_result = ExecutionResult(exit_code=1, stdout="", stderr="Error: module not found")  # noqa: F841

    # Exit code
    c = verifier.verify_exit_code(ok_result, 0)
    print(f"exit_code check  : {c.status.value} — {c.message}")

    # File existence
    c = verifier.verify_file_exists("/tmp")
    print(f"file_exists /tmp : {c.status.value} — {c.message}")
    c = verifier.verify_file_not_exists("/tmp/nonexistent_mekong_test")
    print(f"file_not_exists  : {c.status.value} — {c.message}")

    # Output patterns
    c = verifier.verify_output_contains(ok_result, r"\d+ tests")
    print(f"output_contains  : {c.status.value} — {c.message}")
    c = verifier.verify_output_not_contains(ok_result, "error")
    print(f"output_not_error : {c.status.value} — {c.message}")

    # Full verify() with criteria dict
    criteria = {
        "exit_code": 0,
        "output_contains": ["passed"],
        "output_not_contains": ["error"],
    }
    report = verifier.verify(ok_result, criteria)
    print(f"\nFull report: {report.summary} | passed={report.passed}")

    # Custom shell check
    custom_criteria = {"custom_checks": ["echo ok"]}
    report2 = verifier.verify(ok_result, custom_criteria)
    print(f"Custom check: {report2.summary}")


# ---------------------------------------------------------------------------
# 5. DAG Scheduling
# ---------------------------------------------------------------------------

def example_dag_scheduling():
    """Build DAG steps, validate, execute with mock, show cancellation."""
    print(f"\n{SEP}\n5. DAG Scheduling\n{SEP}")

    steps = [
        RecipeStep(order=1, title="Step A", description="echo A", dependencies=[]),
        RecipeStep(order=2, title="Step B", description="echo B", dependencies=[]),
        RecipeStep(order=3, title="Step C", description="echo C", dependencies=[1, 2]),
        RecipeStep(order=4, title="Step D", description="echo D", dependencies=[3]),
    ]

    # Validate — expect no cycle
    err = validate_dag(steps)
    print(f"DAG valid: {err is None} (error={err})")

    # Cycle detection
    cycle_steps = [
        RecipeStep(order=1, title="X", description="x", dependencies=[2]),
        RecipeStep(order=2, title="Y", description="y", dependencies=[1]),
    ]
    err = validate_dag(cycle_steps)
    print(f"Cycle detected: {err}")

    # Execute with mock (steps A and B run in parallel, then C, then D)
    executed_order: list[int] = []

    def mock_executor(step):
        executed_order.append(step.order)
        result = MagicMock()
        result.verification = MagicMock()
        result.verification.passed = True
        return result

    scheduler = DAGScheduler(steps, max_workers=2)
    results = scheduler.execute_all(mock_executor)
    print(f"Executed order : {executed_order}")
    print(f"All succeeded  : {all(r.success for r in results.values())}")

    # Failure propagation — Step 1 fails → Step 3 and 4 cancelled
    steps2 = [
        RecipeStep(order=1, title="Fail", description="fail", dependencies=[]),
        RecipeStep(order=2, title="OK",   description="ok",   dependencies=[]),
        RecipeStep(order=3, title="Dep",  description="dep",  dependencies=[1]),
        RecipeStep(order=4, title="Deep", description="deep", dependencies=[3]),
    ]

    def failing_executor(step):
        result = MagicMock()
        result.verification = MagicMock()
        result.verification.passed = (step.order != 1)  # Step 1 fails
        return result

    scheduler2 = DAGScheduler(steps2, max_workers=2)
    scheduler2.execute_all(failing_executor)
    cancelled = scheduler2.cancelled_steps
    print(f"Cancelled steps after step-1 failure: {sorted(cancelled)}")


# ---------------------------------------------------------------------------
# 6. Full Orchestration (E2E)
# ---------------------------------------------------------------------------

def example_full_orchestration():
    """Wire planner + executor + verifier via planner.plan() directly."""
    print(f"\n{SEP}\n6. Full Orchestration (E2E)\n{SEP}")

    planner = RecipePlanner()
    # Use "ls src/" — planner maps "ls " prefix to a direct shell step
    recipe = planner.plan("ls src/", PlanningContext(goal="ls src/"))

    verifier = RecipeVerifier(strict_mode=False)
    from src.core.executor import RecipeExecutor

    executor = RecipeExecutor(recipe)

    passed = failed = 0
    for step in recipe.steps:
        exec_result = executor.execute_step(step)
        criteria = step.params.get("verification", {})
        report = verifier.verify(exec_result, criteria)
        status = "PASS" if report.passed else "FAIL"
        print(f"  Step {step.order} [{status}]: {step.title!r} — {report.summary}")
        if report.passed:
            passed += 1
        else:
            failed += 1

    print(f"\nTotal: {passed} passed, {failed} failed")


# ---------------------------------------------------------------------------
# 7. Self-Healing Demo
# ---------------------------------------------------------------------------

def example_self_healing():
    """Show self-healing: mock LLM corrects a bad command."""
    print(f"\n{SEP}\n7. Self-Healing Demo\n{SEP}")

    # Mock LLM that turns bad command into a safe echo
    mock_llm = MagicMock()
    mock_llm.generate.return_value = "echo healed"
    mock_llm.is_available = True

    bad_step = RecipeStep(
        order=1,
        title="Bad command",
        description="nonexistent_cmd_xyz",
        params={"type": "shell"},
    )
    good_step = RecipeStep(
        order=1,
        title="Bad command (healed)",
        description="echo healed",
        params={"type": "shell"},
    )

    recipe = Recipe(name="Self-Heal", description="", steps=[bad_step])
    from src.core.executor import RecipeExecutor

    executor = RecipeExecutor(recipe)

    # Execute bad step → fails
    result = executor.execute_step(bad_step)
    print(f"Bad step exit_code: {result.exit_code} (expected non-zero)")

    # Simulate heal: use corrected command from LLM
    corrected_cmd = mock_llm.generate(
        f"Command failed: {bad_step.description}. Suggest correction."
    )
    print(f"LLM correction: {corrected_cmd!r}")
    healed_result = executor.execute_step(good_step)
    print(f"Healed step exit_code: {healed_result.exit_code} (expected 0)")
    print(f"Healed stdout: {healed_result.stdout.strip()!r}")


# ---------------------------------------------------------------------------
# 8. Rollback Demo
# ---------------------------------------------------------------------------

def example_rollback():
    """Show rollback: completed steps run rollback commands on failure.

    Uses echo as rollback (rm -f is blocked by security sanitizer).
    Demonstrates the rollback flow: step 1 succeeds with a rollback command
    defined, step 2 fails, rollback handler reverses completed steps.
    """
    print(f"\n{SEP}\n8. Rollback Demo\n{SEP}")

    # Step 1 echoes a marker (rollback: echo undone); step 2 fails
    steps = [
        RecipeStep(
            order=1,
            title="Create artifact",
            description="echo artifact_created",
            params={"type": "shell", "rollback": "echo artifact_rolled_back"},
        ),
        RecipeStep(
            order=2,
            title="Fail intentionally",
            description="exit_code_1_command_nonexistent",
            params={"type": "shell"},
        ),
    ]
    recipe = Recipe(name="Rollback Demo", description="", steps=steps)
    from src.core.executor import RecipeExecutor
    from src.core.orchestrator import OrchestrationResult, OrchestrationStatus, RollbackHandler, StepResult

    executor = RecipeExecutor(recipe)
    verifier = RecipeVerifier(strict_mode=False)

    # Execute step 1 (succeeds)
    r1 = executor.execute_step(steps[0])
    v1 = verifier.verify(r1, {"exit_code": 0})
    print(f"Step 1 passed={v1.passed} stdout={r1.stdout.strip()!r}")

    # Execute step 2 (fails)
    r2 = executor.execute_step(steps[1])
    v2 = verifier.verify(r2, {"exit_code": 0})
    print(f"Step 2 passed={v2.passed} (expected False)")

    # Trigger rollback — handler reverses completed steps in reverse order
    orch_result = OrchestrationResult(
        status=OrchestrationStatus.FAILED,
        recipe=recipe,
        step_results=[StepResult(step=steps[0], execution=r1, verification=v1)],
        total_steps=2,
        completed_steps=1,
        failed_steps=1,
    )

    handler = RollbackHandler(enable_rollback=True)
    handler.rollback(orch_result, steps[1])
    print(f"Orch status after rollback: {orch_result.status.value} (expected rolled_back)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    example_recipe_creation()
    example_planning()
    example_execution()
    example_verification()
    example_dag_scheduling()
    example_full_orchestration()
    example_self_healing()
    example_rollback()
    print(f"\n{SEP}\nAll examples complete.\n{SEP}\n")

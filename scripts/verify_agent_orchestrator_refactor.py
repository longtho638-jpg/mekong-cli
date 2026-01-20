"""
Verification script for Agent Orchestrator Refactor.
"""
import logging
import os
import sys

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.core.agent_chains import _get_chain_loader
from antigravity.core.chains import AgentStep, Chain

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.agent_orchestrator import AgentOrchestrator, StepStatus, execute_chain


def verify_agent_orchestrator():
    print("Testing Agent Orchestrator Refactor...")

    # Setup: Register a test chain
    loader = _get_chain_loader()

    test_chain = Chain(
        name="test_suite:test_command",
        description="Test Chain",
        agents=[
            AgentStep("planner", "plan", "Planning the test"),
            AgentStep("tester", "test", "Running tests"),
            AgentStep("code-reviewer", "review", "Reviewing results")
        ]
    )

    loader.chains["test_suite:test_command"] = test_chain

    print("   Registered test chain ✅")

    orchestrator = AgentOrchestrator(verbose=True)

    # 1. Test Chain Execution
    print("\n1. Testing Chain Execution...")
    result = orchestrator.run("test_suite", "test_command")

    if not result.success:
        print("❌ Chain execution failed")
        return False

    if len(result.steps) != 3:
        print(f"❌ Expected 3 steps, got {len(result.steps)}")
        return False

    if result.steps[0].agent != "planner":
        print(f"❌ First step agent mismatch: {result.steps[0].agent}")
        return False

    print("   Chain execution passed ✅")

    # 2. Test Quick Execute Wrapper
    print("\n2. Testing Quick Execute Wrapper...")
    res2 = execute_chain("test_suite", "test_command")

    if not res2.success:
        print("❌ Quick execute failed")
        return False

    print("   Quick execute passed ✅")

    # 3. Test Missing Chain Handling
    print("\n3. Testing Missing Chain...")
    res3 = orchestrator.run("ghost_suite", "ghost_command")

    if res3.success:
        print("❌ Missing chain should not succeed")
        return False

    print("   Missing chain handled correctly ✅")

    # 4. Test Stats
    print("\n4. Testing Stats...")
    # We ran orchestrator.run once explicitly. execute_chain created a new instance.
    # So 'orchestrator' has history of 2 runs (test_suite, ghost_suite)

    stats = orchestrator.get_stats()

    if stats["total_runs"] != 2:
        print(f"❌ Stats total_runs mismatch: {stats['total_runs']}")
        return False

    if stats["success_rate"] != 50.0: # 1 success, 1 fail
        print(f"❌ Success rate mismatch: {stats['success_rate']}")
        return False

    print("   Stats verified ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_agent_orchestrator():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

"""
Verification script for Agent Crews Refactor.
"""
import logging
import os
import sys

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.agent_crews import CREWS, CrewStatus, get_crew, list_crews, run_crew


def verify_agent_crews():
    print("Testing Agent Crews Refactor...")

    # 1. Test Registry Loading
    print("\n1. Testing Registry Loading...")
    crews = list_crews()
    if not crews:
        print("❌ No crews found in registry")
        return False

    if "product_launch" not in crews:
        print("❌ 'product_launch' crew missing")
        return False

    print(f"   Registry loaded {len(crews)} crews ✅")

    # 2. Test Crew Retrieval
    print("\n2. Testing Crew Retrieval...")
    crew = get_crew("product_launch")
    if not crew:
        print("❌ Failed to retrieve 'product_launch' crew")
        return False

    if crew.lead.agent != "project-manager":
        print(f"❌ Lead mismatch: {crew.lead.agent}")
        return False

    if len(crew.workers) < 1:
        print("❌ Crew has no workers")
        return False

    print(f"   Crew '{crew.name}' retrieved correctly ✅")

    # 3. Test Execution Simulation
    print("\n3. Testing Execution Simulation...")
    result = run_crew("product_launch")

    if result.status != CrewStatus.COMPLETED:
        print(f"❌ Execution failed with status: {result.status}")
        return False

    if result.steps_completed != result.total_steps:
        print(f"❌ Step count mismatch: {result.steps_completed}/{result.total_steps}")
        return False

    if "Successfully completed mission" not in result.output:
        print("❌ Output message mismatch")
        return False

    print("   Execution simulation passed ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_agent_crews():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

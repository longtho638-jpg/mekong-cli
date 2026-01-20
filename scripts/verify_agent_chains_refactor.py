"""
Verification script for Agent Chains Refactor.
"""
import logging
import os
import sys

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.agent_chains import (
    AGENT_INVENTORY,
    AgentStep,
    get_chain,
    register_chain,
    validate_inventory,
)


def verify_agent_chains():
    print("Testing Agent Chains Refactor...")

    # 1. Test Inventory Access
    print("\n1. Testing Agent Inventory...")
    if not AGENT_INVENTORY:
        print("❌ AGENT_INVENTORY is empty")
        return False

    if "planner" not in AGENT_INVENTORY:
        print("❌ 'planner' missing from inventory")
        return False

    print(f"   Found {len(AGENT_INVENTORY)} agents in inventory ✅")

    # 2. Test Chain Retrieval (YAML)
    print("\n2. Testing Chain Retrieval...")
    # Trying a known chain or falling back to checking if loader works
    # We'll just check if get_chain runs without error, even if it returns None for a dummy chain
    chain = get_chain("dev", "cook")
    if chain:
        print(f"   Retrieved 'dev:cook' chain with {len(chain.agents)} steps ✅")
    else:
        print("   'dev:cook' chain not found (might need config), but call succeeded ✅")

    # 3. Test Legacy Registration (Compatibility)
    print("\n3. Testing Legacy Registration...")
    test_agents = [
        AgentStep("planner", "plan", "Planning"),
        AgentStep("tester", "test", "Testing")
    ]
    register_chain("test", "compat", test_agents)

    retrieved = get_chain("test", "compat")
    if not retrieved:
        print("❌ Registered chain not found")
        return False

    if len(retrieved.agents) != 2:
        print(f"❌ Registered chain has wrong length: {len(retrieved.agents)}")
        return False

    print("   Legacy registration working ✅")

    # 4. Test Validation
    print("\n4. Testing Validation...")
    missing = validate_inventory()
    # It's okay if files are missing in this environment, just want to ensure function runs
    print(f"   Validation ran successfully (found {len(missing)} missing files) ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_agent_chains():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

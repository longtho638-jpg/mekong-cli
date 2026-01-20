"""
Verification script for Agent Memory Refactor.
"""
import logging
import os
import shutil
import sys
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.agent_memory import AgentMemory, get_agent_memory


def verify_agent_memory():
    print("Testing Agent Memory Refactor...")

    test_dir = ".antigravity_test_memory"

    # Clean up previous test run
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

    # 1. Test Singleton and Initialization
    print("\n1. Testing Singleton and Initialization...")
    # Manually initialize with test path for isolation
    memory = AgentMemory(storage_path=test_dir)

    if not os.path.exists(test_dir):
         print(f"❌ Storage directory {test_dir} not created")
         return False
    print("   Initialization verified ✅")

    # 2. Test Remembering
    print("\n2. Testing Remembering...")

    ctx1 = {"task": "test_task", "complexity": "low"}
    mem1 = memory.remember(
        agent="test_agent",
        context=ctx1,
        outcome="Success",
        success=True,
        patterns=["fast_execution"],
        tags=["test", "v1"]
    )

    if len(memory.memories) != 1:
        print(f"❌ Expected 1 memory, got {len(memory.memories)}")
        return False

    if mem1.agent != "test_agent" or mem1.success is not True:
        print("❌ Memory content mismatch")
        return False

    print("   Remembering verified ✅")

    # 3. Test Pattern Learning
    print("\n3. Testing Pattern Learning...")
    # First pattern was added during remember
    patterns = memory.get_patterns("test_agent")
    if len(patterns) != 1 or patterns[0].pattern != "fast_execution":
        print("❌ Pattern not learned automatically")
        return False

    # Explicit learning
    memory.learn_pattern("test_agent", "reliable_output", success=True)
    patterns = memory.get_patterns("test_agent")
    if len(patterns) != 2:
        print(f"❌ Expected 2 patterns, got {len(patterns)}")
        return False

    # Test updating existing pattern
    initial_count = patterns[0].occurrences
    memory.remember(
        agent="test_agent",
        context=ctx1,
        outcome="Another success",
        success=True,
        patterns=["fast_execution"]
    )

    updated_patterns = memory.get_patterns("test_agent")
    target_pattern = next(p for p in updated_patterns if p.pattern == "fast_execution")

    if target_pattern.occurrences != initial_count + 1:
        print(f"❌ Pattern occurrences did not increment. Got {target_pattern.occurrences}")
        return False

    print("   Pattern Learning verified ✅")

    # 4. Test Recall
    print("\n4. Testing Recall...")

    # Add a different agent's memory
    memory.remember(
        agent="other_agent",
        context={"task": "other"},
        outcome="Fail",
        success=False
    )

    recalled = memory.recall("test_agent")
    if len(recalled) != 2: # We added 2 memories for test_agent
        print(f"❌ Expected 2 memories for test_agent, got {len(recalled)}")
        return False

    recalled_query = memory.recall("test_agent", query="v1")
    if len(recalled_query) != 1:
        print("❌ Query filtering failed")
        return False

    print("   Recall verified ✅")

    # 5. Test Persistence (Save/Load)
    print("\n5. Testing Persistence...")

    # Force save is handled in remember(), but let's verify file exists
    memory_file = os.path.join(test_dir, "memories.json")
    if not os.path.exists(memory_file):
        print("❌ Memory file not found on disk")
        return False

    # Create new instance pointing to same dir to test loading
    memory2 = AgentMemory(storage_path=test_dir)

    if len(memory2.memories) != 3: # 2 for test_agent + 1 for other_agent
        print(f"❌ Failed to load memories. Expected 3, got {len(memory2.memories)}")
        return False

    if len(memory2.get_patterns("test_agent")) != 2:
        print("❌ Failed to load patterns")
        return False

    print("   Persistence verified ✅")

    # Cleanup
    shutil.rmtree(test_dir)
    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_agent_memory():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

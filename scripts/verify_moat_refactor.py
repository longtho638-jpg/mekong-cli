"""
Verification script for Moat Engine Refactor.
"""
import sys
import os
import logging
import shutil
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.moat_engine import get_moat_engine, MoatEngine

def verify_moat_engine():
    print("Testing Moat Engine Refactor...")

    test_dir = ".antigravity_test_moat"

    # Clean up previous test run
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

    # 1. Test Initialization
    print("\n1. Testing Initialization...")
    engine = MoatEngine(storage_path=test_dir)

    if len(engine.moats) != 5:
        print(f"❌ Expected 5 moats, got {len(engine.moats)}")
        return False

    if "learning" not in engine.moats:
        print("❌ 'learning' moat missing")
        return False

    print("   Initialization verified ✅")

    # 2. Test Metric Updates & Calculations
    print("\n2. Testing Metric Updates...")

    # Test Data Moat
    engine.add_data_point("projects", 10)
    if engine.moats["data"].metrics["projects"] != 10:
        print("❌ Data point update failed")
        return False
    # Strength = 10 / 5 = 2%
    if engine.moats["data"].strength != 2:
        print(f"❌ Data strength calc failed. Got {engine.moats['data'].strength}")
        return False

    # Test Learning Moat
    # 10 patterns, 1.0 success rate -> strength = min(100, (10/2)*1.0) = 5
    for _ in range(10):
        engine.record_learning(success=True)

    if engine.moats["learning"].metrics["patterns"] != 10:
        print("❌ Learning pattern count failed")
        return False

    # Test Workflow Moat
    engine.add_workflow(4)
    # Strength = 4 * 5 = 20%
    if engine.moats["workflow"].strength != 20:
        print(f"❌ Workflow strength calc failed. Got {engine.moats['workflow'].strength}")
        return False

    print("   Metric updates verified ✅")

    # 3. Test Switching Cost Calculation
    print("\n3. Testing Switching Cost...")
    costs = engine.calculate_switching_cost()

    # Heuristic Time Impact (Hours)
    # Data: 10 projects * 3 = 30
    # Learning: 10 patterns * 0.5 = 5
    # Workflow: 4 workflows * 10 = 40
    # Total = 75 hours

    expected_hours = 75
    if costs["hours"] != expected_hours:
        print(f"❌ Expected {expected_hours} hours, got {costs['hours']}")
        return False

    print(f"   Calculated switching cost: ${costs['financial_usd']} ({costs['hours']} hours)")
    print("   Switching cost verified ✅")

    # 4. Test Persistence
    print("\n4. Testing Persistence...")

    # Create new instance pointing to same dir
    engine2 = MoatEngine(storage_path=test_dir)

    if engine2.moats["data"].metrics["projects"] != 10:
        print("❌ Failed to persist data metrics")
        return False

    if engine2.moats["workflow"].strength != 20:
        print("❌ Failed to persist strength values")
        return False

    print("   Persistence verified ✅")

    # Cleanup
    shutil.rmtree(test_dir)
    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_moat_engine():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

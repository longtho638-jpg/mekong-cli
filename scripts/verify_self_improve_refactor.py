"""
Verification script for Self-Improve Refactor.
"""
import sys
import os
import time
import logging

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.self_improve import (
    get_self_improve_engine,
    self_improving,
    ImprovementType,
    LearningSource
)

def verify_self_improve():
    print("Testing Self-Improve Refactor...")

    engine = get_self_improve_engine()

    # 1. Test Decorator & Profiling
    print("\n1. Testing Decorator & Profiling...")

    @self_improving(name="test_function")
    def test_function(fail=False):
        time.sleep(0.1)
        if fail:
            raise ValueError("Test error")
        return "success"

    # Run success
    test_function()

    # Check profile
    profile = engine.profiles.get("test_function")
    if not profile:
        print("❌ Profile not created")
        return False

    print(f"   Profile created: {profile.name}, calls: {profile.call_count}")
    if profile.call_count != 1:
        print(f"❌ Expected 1 call, got {profile.call_count}")
        return False

    # 2. Test Error Learning
    print("\n2. Testing Error Learning...")

    try:
        test_function(fail=True)
    except ValueError:
        pass

    # Check error patterns
    if len(engine._error_patterns) == 0:
        print("❌ Error pattern not recorded")
        return False

    print(f"   Error patterns recorded: {len(engine._error_patterns)}")

    # Trigger multiple errors to generate suggestion (threshold is 3)
    try:
        test_function(fail=True)
    except ValueError:
        pass

    try:
        test_function(fail=True)
    except ValueError:
        pass

    # Check suggestions
    suggestions = engine.get_suggestions()
    print(f"   Suggestions generated: {len(suggestions)}")

    found_reliability = False
    for s in suggestions:
        print(f"   - {s.type.name}: {s.description}")
        if s.type == ImprovementType.RELIABILITY:
            found_reliability = True

    if not found_reliability:
        print("❌ Reliability suggestion not found after 3 errors")
        return False

    # 3. Test Performance Suggestion (manual trigger)
    print("\n3. Testing Performance Suggestion...")
    engine.profile_function("slow_func", 1.5, True)

    suggestions = engine.get_suggestions(type_filter=ImprovementType.PERFORMANCE)
    if not suggestions:
        print("❌ Performance suggestion not found for slow function")
        return False

    print(f"   Performance suggestion found: {suggestions[0].description}")

    # 4. Test Enums
    print("\n4. Testing Enums...")
    if LearningSource.ERROR_LOGS.value != "error_logs":
        print("❌ Enum value mismatch")
        return False
    print("   Enums valid ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_self_improve():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

"""
Verification script for Viral Defense Refactor.
"""
import sys
import os
import time

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.infrastructure.viral_defense import (
    get_defense,
    check_triggers,
    is_feature_enabled,
    degradable,
    DefenseLevel,
    ScaleAction
)

def test_viral_defense_flow():
    print("Testing Viral Defense Refactor...")

    defense = get_defense()

    # 1. Check initial state
    print("\n1. Checking Initial State...")
    if defense.level != DefenseLevel.NORMAL:
        print(f"❌ Initial level should be NORMAL, got {defense.level}")
        return False
    print("   Initial level: NORMAL ✅")

    # 2. Test Triggers
    print("\n2. Testing Triggers...")
    metrics = {
        "cpu_usage": 85.0,  # Should trigger SCALE_UP
        "requests_per_second": 1200.0 # Should trigger ENABLE_CDN
    }

    actions = check_triggers(metrics)
    print(f"   Actions triggered: {[a.value for a in actions]}")

    if ScaleAction.SCALE_UP not in actions:
        print("❌ Failed to trigger SCALE_UP")
        return False

    if ScaleAction.ENABLE_CDN not in actions:
        print("❌ Failed to trigger ENABLE_CDN")
        return False

    # 3. Test Degradation
    print("\n3. Testing Degradation...")

    # Feature should be enabled at NORMAL
    if not is_feature_enabled("image_generation"):
        print("❌ image_generation should be enabled at NORMAL")
        return False

    # Escalating to ORANGE (disables heavy features)
    defense.set_defense_level(DefenseLevel.ORANGE)
    print("   Defense level set to ORANGE")

    # image_generation disables at ORANGE
    if is_feature_enabled("image_generation"):
        print("❌ image_generation should be disabled at ORANGE")
        return False

    # ai_features disables at YELLOW (so disabled at ORANGE)
    if is_feature_enabled("ai_features"):
        print("❌ ai_features should be disabled at ORANGE")
        return False

    print("   Degradation checks passed ✅")

    # 4. Test Decorator
    print("\n4. Testing Decorator...")

    @degradable("image_generation")
    def generate_image(prompt):
        return f"Image of {prompt}"

    # Should return fallback because we are at ORANGE
    result = generate_image("cat")
    print(f"   Result: {result}")

    if isinstance(result, dict) and "url" in result:
        print("   Decorator returned fallback correctly ✅")
    else:
        print(f"❌ Decorator failed to return fallback. Got: {result}")
        return False

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if test_viral_defense_flow():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

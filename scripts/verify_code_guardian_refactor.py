"""
Verification script for Code Guardian Refactor.
"""
import logging
import os
import sys
import time
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.code_guardian import (
    CodeGuardian,
    GuardianAction,
    SecurityThreat,
    ThreatLevel,
    create_rollback_point,
    get_guardian,
    monitor_metric,
    scan_code,
)


def verify_code_guardian():
    print("Testing Code Guardian Refactor...")

    # 1. Test Initialization and Singleton
    print("\n1. Testing Initialization and Singleton...")
    guardian = get_guardian()
    guardian2 = get_guardian()

    if guardian is not guardian2:
        print("❌ Singleton verification failed")
        return False

    print("   Singleton verified ✅")

    # 2. Test Security Scanning
    print("\n2. Testing Security Scanning...")

    # Test SQL Injection detection
    unsafe_code = "SELECT * FROM users WHERE id = '" + "1' OR '1'='1" + "'"
    threats = scan_code(unsafe_code, source="test_script")

    if not threats:
        print("❌ Failed to detect SQL injection")
        return False

    if threats[0].type != "sql_injection":
        print(f"❌ Expected sql_injection, got {threats[0].type}")
        return False

    if threats[0].action_taken != GuardianAction.BLOCK:
        print(f"❌ Expected BLOCK action, got {threats[0].action_taken}")
        return False

    print("   SQL Injection detection verified ✅")

    # Test Safe Code
    safe_code = "print('Hello World')"
    threats = scan_code(safe_code, source="test_script")

    if threats:
        print(f"❌ False positive detected: {threats[0].type}")
        return False

    print("   Safe code verified ✅")

    # 3. Test Performance Anomaly
    print("\n3. Testing Performance Anomaly Detection...")

    # Establish baseline
    metric_name = "response_time"
    monitor_metric(metric_name, 100.0) # Baseline
    monitor_metric(metric_name, 105.0) # Normal deviation

    # Trigger Anomaly (300% spike)
    # Baseline is approx 100.5 after update
    # 400 vs 100.5 -> ~2.98 deviation > 2.0 threshold
    anomaly = monitor_metric(metric_name, 400.0)

    if not anomaly:
        print("❌ Failed to detect performance anomaly")
        return False

    if anomaly.metric != metric_name:
        print(f"❌ Expected metric {metric_name}, got {anomaly.metric}")
        return False

    if anomaly.deviation_percent < 100:
        print(f"❌ Expected high deviation, got {anomaly.deviation_percent}%")
        return False

    print("   Anomaly detection verified ✅")

    # 4. Test Rollback Points
    print("\n4. Testing Rollback Points...")

    # Create a dummy file to snapshot
    test_file = "test_rollback.txt"
    with open(test_file, "w") as f:
        f.write("Original Content")

    point_id = create_rollback_point("Initial State", [test_file])

    if not point_id:
        print("❌ Failed to create rollback point")
        os.remove(test_file)
        return False

    status = guardian.get_status()
    if status["rollback_points"] < 1:
        print("❌ Rollback point not registered in status")
        os.remove(test_file)
        return False

    print("   Rollback point verified ✅")

    # Cleanup
    if os.path.exists(test_file):
        os.remove(test_file)

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_code_guardian():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

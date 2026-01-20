"""
Verification script for Cashflow Engine Refactor.
"""
import logging
import os
import shutil
import sys
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.cashflow_engine import CashflowEngine, RevenueStream, get_cashflow_engine


def verify_cashflow_engine():
    print("Testing Cashflow Engine Refactor...")

    test_dir = ".antigravity_test_cashflow"

    # Clean up previous test run
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

    # 1. Test Initialization
    print("\n1. Testing Initialization...")
    engine = CashflowEngine(storage_path=test_dir)

    if len(engine.goals) != 5:
        print(f"❌ Expected 5 revenue goals, got {len(engine.goals)}")
        return False

    print("   Initialization verified ✅")

    # 2. Test Adding Revenue
    print("\n2. Testing Revenue Recording...")

    # Add One-time Agency Revenue
    engine.add_revenue(
        stream=RevenueStream.AGENCY,
        amount=5000.0,
        currency="USD",
        recurring=False,
        client="Client A",
        description="Website Project"
    )

    # Add Recurring SaaS Revenue
    engine.add_revenue(
        stream="saas", # Test string input
        amount=100.0,
        currency="USD",
        recurring=True,
        client="User B",
        description="Pro Plan"
    )

    # Add VND Revenue (Exchange Rate 25000)
    # 25,000,000 VND = $1,000 USD
    engine.add_revenue(
        stream=RevenueStream.CONSULTING,
        amount=25_000_000.0,
        currency="VND",
        recurring=False,
        client="Client VN"
    )

    if len(engine.revenues) != 3:
        print(f"❌ Expected 3 revenues, got {len(engine.revenues)}")
        return False

    print("   Revenue recording verified ✅")

    # 3. Test ARR Calculations
    print("\n3. Testing ARR Calculations...")

    # Expected ARR:
    # Agency: $5,000 (One-time counts to ARR in this model? Let's check logic)
    # Logic: if recurring: active only -> * 12. else: amount_usd.
    # SaaS: $100 * 12 = $1,200
    # Consulting: $1,000
    # Total ARR = 5000 + 1200 + 1000 = 7200

    total_arr = engine.get_total_arr()
    if abs(total_arr - 7200.0) > 0.01:
        print(f"❌ Expected ARR $7200.00, got ${total_arr}")
        # Debug breakdown
        for g in engine.goals.values():
            if g.current_arr > 0:
                print(f"   - {g.stream.value}: ${g.current_arr}")
        return False

    print(f"   Total ARR: ${total_arr:,.2f}")
    print("   ARR Calculation verified ✅")

    # 4. Test Persistence
    print("\n4. Testing Persistence...")

    engine2 = CashflowEngine(storage_path=test_dir)

    if len(engine2.revenues) != 3:
        print(f"❌ Persistence failed. Expected 3 revenues, got {len(engine2.revenues)}")
        return False

    if abs(engine2.get_total_arr() - 7200.0) > 0.01:
         print("❌ Persistence ARR mismatch")
         return False

    print("   Persistence verified ✅")

    # Cleanup
    shutil.rmtree(test_dir)
    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_cashflow_engine():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

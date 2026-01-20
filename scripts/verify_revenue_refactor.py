"""
Verification script for Revenue Engine Refactor.
"""
import logging
import os
import sys
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.revenue_engine import RevenueEngine


def verify_revenue_engine():
    print("Testing Revenue Engine Refactor...")

    # Initialize engine (using a temp dir to avoid messing with real data)
    engine = RevenueEngine(data_dir=".antigravity_test")

    # 1. Test Invoice Creation
    print("\n1. Testing Invoice Creation...")
    inv1 = engine.create_invoice("Client A", 1000.0, "USD", "Consulting")
    inv2 = engine.create_invoice("Client B", 2000.0, "USD", "Development")

    # Test VND conversion (standard rate 25000)
    # 25,000,000 VND = $1,000 USD
    inv3 = engine.create_invoice("Client VN", 25000000.0, "VND", "Local Service")

    if len(engine.invoices) != 3:
        print(f"❌ Expected 3 invoices, got {len(engine.invoices)}")
        return False
    print("   Invoices created ✅")

    # 2. Test Status Transitions
    print("\n2. Testing Status Transitions...")
    engine.send_invoice(inv1)
    if inv1.status.value != "sent":
        print(f"❌ Invoice 1 status mismatch: {inv1.status.value}")
        return False

    engine.mark_paid(inv1)
    if inv1.status.value != "paid":
        print(f"❌ Invoice 1 status mismatch: {inv1.status.value}")
        return False

    engine.send_invoice(inv3)
    engine.mark_paid(inv3) # $1000 equivalent

    print("   Status transitions verified ✅")

    # 3. Test Revenue Calculations
    print("\n3. Testing Revenue Calculations...")

    # Total Revenue: inv1 ($1000) + inv3 ($1000) = $2000
    total = engine.get_total_revenue()
    print(f"   Total Revenue: ${total:,.2f}")

    if abs(total - 2000.0) > 0.01:
        print(f"❌ Expected $2000.00, got ${total}")
        return False

    # MRR (inv1 and inv3 are paid today, so they count)
    mrr = engine.get_mrr()
    print(f"   MRR: ${mrr:,.2f}")
    if abs(mrr - 2000.0) > 0.01:
         print(f"❌ Expected MRR $2000.00, got ${mrr}")
         return False

    # ARR
    arr = engine.get_arr()
    print(f"   ARR: ${arr:,.2f}")
    if abs(arr - 24000.0) > 0.01:
        print(f"❌ Expected ARR $24000.00, got ${arr}")
        return False

    # Outstanding (inv2 is draft, let's send it)
    engine.send_invoice(inv2)
    outstanding = engine.get_outstanding_usd()
    print(f"   Outstanding: ${outstanding:,.2f}")

    if abs(outstanding - 2000.0) > 0.01:
        print(f"❌ Expected Outstanding $2000.00, got ${outstanding}")
        return False

    print("   Calculations verified ✅")

    # 4. Test Forecasting
    print("\n4. Testing Forecasting...")
    forecasts = engine.forecast_growth(months=3)
    if len(forecasts) != 3:
        print(f"❌ Expected 3 forecast months, got {len(forecasts)}")
        return False

    print(f"   Month 1 Projection: ${forecasts[0].projected:,.2f}")
    if forecasts[0].projected <= mrr:
        print("❌ Forecast should show growth")
        return False

    print("   Forecasting verified ✅")

    # 5. Test Goal Summary
    print("\n5. Testing Goal Summary...")
    goals = engine.get_goal_summary()
    print(f"   Progress: {goals['progress_percent']}%")
    print(f"   Months to Goal: {goals['months_to_goal']}")

    if goals['current_arr'] != arr:
        print("❌ Goal ARR mismatch")
        return False

    print("   Goal summary verified ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_revenue_engine():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

"""
Verification script for Money Maker Refactor.
"""
import sys
import os
import logging
from decimal import Decimal

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.money_maker import (
    MoneyMaker,
    Quote,
    ServiceTier,
    Win3Result,
    BINH_PHAP_SERVICES
)

def verify_money_maker():
    print("Testing Money Maker Refactor...")

    # Initialize Engine
    mm = MoneyMaker()

    # 1. Test Pricing Catalog
    print("\n1. Testing Pricing Catalog...")
    catalog = mm.get_pricing_catalog()
    if "BINH PHÁP 13-CHAPTER" not in catalog:
        print("❌ Catalog header missing")
        return False

    if "Strategy Assessment" not in catalog:
        print("❌ Service content missing")
        return False

    print("   Catalog verified ✅")

    # 2. Test Quote Generation (Happy Path)
    print("\n2. Testing Quote Generation (Happy Path)...")
    chapters = [1, 2, 5] # Strategy, Runway, Growth (Recurring)

    quote = mm.generate_quote(
        client_name="Test Startup Inc.",
        chapters=chapters,
        tier="warrior"
    )

    # Verify Quote Structure
    if quote.client_name != "Test Startup Inc.":
        print(f"❌ Client name mismatch: {quote.client_name}")
        return False

    if len(quote.services) != 3:
        print(f"❌ Expected 3 services, got {len(quote.services)}")
        return False

    if quote.tier != ServiceTier.WARRIOR:
        print(f"❌ Tier mismatch: {quote.tier}")
        return False

    # Verify Calculations
    # Ch 1: 5000 (One time)
    # Ch 2: 3000 (One time)
    # Ch 5: 5000 (Recurring)
    # Warrior Retainer: 2000

    expected_one_time = Decimal("8000")
    expected_recurring = Decimal("7000") # 5000 + 2000

    if quote.one_time_total != expected_one_time:
        print(f"❌ One-time total mismatch. Expected {expected_one_time}, got {quote.one_time_total}")
        return False

    if quote.monthly_retainer != expected_recurring:
        print(f"❌ Recurring total mismatch. Expected {expected_recurring}, got {quote.monthly_retainer}")
        return False

    print(f"   Quote #{quote.id} verified ✅")

    # 3. Test WIN-WIN-WIN Validation
    print("\n3. Testing WIN-WIN-WIN Validation...")

    if not quote.win3_validated:
        print("❌ Quote should be valid (Score > 65)")
        # It should be valid:
        # Equity: Warrior default is 5-8% -> avg 6.5% (Good)
        # Retainer: 7000 > 2000 (Good)
        # Services: Yes (Good)
        return False

    print(f"   WIN-WIN-WIN verified (Valid: {quote.win3_validated}) ✅")

    # 4. Test Bad Quote (Should fail WIN-WIN-WIN but still generate)
    print("\n4. Testing Bad Quote (Low Value)...")
    bad_quote = mm.generate_quote(
        client_name="Cheap Client",
        chapters=[], # No services
        tier=ServiceTier.WARRIOR,
        custom_equity=0.0
    )

    if bad_quote.win3_validated:
        print("❌ Bad quote should NOT be validated")
        return False

    print("   Bad quote correctly flagged ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_money_maker():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

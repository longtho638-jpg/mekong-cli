"""
Verification script for Client Magnet Refactor.
"""
import sys
import os
import logging
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.client_magnet import (
    client_magnet,
    LeadSource,
    LeadStatus,
    Lead,
    Client
)

def verify_client_magnet():
    print("Testing Client Magnet Refactor...")

    # Reset state for testing (since it's a singleton pattern via module level var in original)
    # The new implementation exposes a singleton getter, but the facade exposes the instance 'client_magnet'
    # We will work with that instance.

    # Clear existing data if any (just in case)
    client_magnet.leads = []
    client_magnet.clients = []

    # 1. Test Lead Creation
    print("\n1. Testing Lead Creation...")
    lead1 = client_magnet.add_lead(
        name="John Doe",
        company="Tech Corp",
        email="john@tech.com",
        source=LeadSource.WEBSITE
    )

    if len(client_magnet.leads) != 1:
        print(f"❌ Expected 1 lead, got {len(client_magnet.leads)}")
        return False

    if lead1.status != LeadStatus.NEW:
        print(f"❌ Expected NEW status, got {lead1.status}")
        return False

    print("   Lead creation verified ✅")

    # 2. Test Lead Qualification
    print("\n2. Testing Lead Qualification...")

    # Qualification with explicit score/budget
    client_magnet.qualify_lead(lead1, budget=5000.0, score=80)

    if lead1.status != LeadStatus.QUALIFIED:
        print(f"❌ Expected QUALIFIED status, got {lead1.status}")
        return False

    if lead1.budget != 5000.0:
        print(f"❌ Expected budget 5000.0, got {lead1.budget}")
        return False

    # Test priority logic
    if not lead1.is_priority():
        print("❌ Lead should be priority (score 80, budget 5000)")
        return False

    print("   Lead qualification verified ✅")

    # 3. Test Lead Conversion
    print("\n3. Testing Lead Conversion...")
    client = client_magnet.convert_to_client(lead1)

    if lead1.status != LeadStatus.WON:
        print(f"❌ Expected WON status for lead, got {lead1.status}")
        return False

    if len(client_magnet.clients) != 1:
        print(f"❌ Expected 1 client, got {len(client_magnet.clients)}")
        return False

    if client.total_ltv != 5000.0:
        print(f"❌ Expected Client LTV 5000.0, got {client.total_ltv}")
        return False

    print("   Lead conversion verified ✅")

    # 4. Test Statistics
    print("\n4. Testing Statistics...")

    # Add another lead that is LOST
    lead2 = client_magnet.add_lead("Jane Doe", source="facebook")
    lead2.status = LeadStatus.LOST

    stats = client_magnet.get_stats()

    if stats["total_leads"] != 2:
        print(f"❌ Expected 2 total leads, got {stats['total_leads']}")
        return False

    if stats["total_clients"] != 1:
        print(f"❌ Expected 1 total client, got {stats['total_clients']}")
        return False

    # Conversion rate: 1 WON / (1 WON + 1 LOST) = 50%
    if stats["conversion_rate"] != 50.0:
        print(f"❌ Expected 50.0% conversion rate, got {stats['conversion_rate']}%")
        return False

    print("   Statistics verified ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_client_magnet():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

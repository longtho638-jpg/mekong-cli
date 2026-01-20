"""
Verification script for Agency DNA Refactor.
"""
import logging
import os
import sys

# Add project root to path
sys.path.insert(0, os.getcwd())

# Configure logging
logging.basicConfig(level=logging.INFO)

from antigravity.core.agency_dna import AgencyDNA, PricingTier, Service, Tone, create_starter_dna


def verify_agency_dna():
    print("Testing Agency DNA Refactor...")

    # 1. Test Factory Method
    print("\n1. Testing Factory Method...")
    dna = create_starter_dna(agency_name="Refactor Agency", niche="Code Cleaning")

    if dna.name != "Refactor Agency":
        print(f"❌ Name mismatch: {dna.name}")
        return False

    if len(dna.services) != 2:
        print(f"❌ Expected 2 default services, got {len(dna.services)}")
        return False

    print(f"   Factory created '{dna.name}' with {len(dna.services)} services ✅")

    # 2. Test Service Addition & Currency Conversion
    print("\n2. Testing Service Logic...")
    new_service = dna.add_service(
        name="Refactor Service",
        description="Deep clean",
        price_usd=100.0
    )

    if new_service.price_vnd != 2500000: # 100 * 25000
        print(f"❌ VND conversion failed. Expected 2,500,000, got {new_service.price_vnd}")
        return False

    print("   Service addition and currency conversion verified ✅")

    # 3. Test Voice Localization
    print("\n3. Testing Voice Localization...")

    # Test Mien Tay
    dna.tone = Tone.MIEN_TAY
    voice = dna.get_localized_voice()
    tagline = dna.get_tagline()

    if "nghen" not in voice:
        print("❌ Mien Tay voice profile incorrect")
        return False

    if "Trọn tình miền Tây" not in tagline:
        print("❌ Mien Tay tagline incorrect")
        return False

    print("   Mien Tay tone verified ✅")

    # Test Professional
    dna.tone = Tone.PROFESSIONAL
    voice = dna.get_localized_voice()

    if "Authoritative" not in voice:
        print("❌ Professional voice profile incorrect")
        return False

    print("   Professional tone verified ✅")

    # 4. Test Serialization
    print("\n4. Testing Serialization...")
    data = dna.to_dict()

    if data["identity"]["name"] != "Refactor Agency":
        print("❌ Serialization name mismatch")
        return False

    if len(data["services"]) != 3:
        print(f"❌ Serialization service count mismatch: {len(data['services'])}")
        return False

    print("   Serialization verified ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_agency_dna():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

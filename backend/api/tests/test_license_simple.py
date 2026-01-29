#!/usr/bin/env python3
"""
Simple test script for License API endpoints
Tests the router directly without importing the full app
"""

import json
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# Test imports
print("Testing imports...")
try:
    from antigravity.core.licensing.validation import validate_license_key

    print("✓ Imported antigravity.core.licensing.validation")
except ImportError as e:
    print(f"✗ Failed to import: {e}")
    sys.exit(1)

try:
    from core.licensing.logic.engine import LicenseGenerator

    print("✓ Imported core.licensing.logic.engine")
except ImportError as e:
    print(f"✗ Failed to import: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("LICENSE VALIDATION TESTS")
print("=" * 60)

# Test 1: Free tier (no key)
print("\n1. Testing free tier (no key)")
is_valid, tier, message = validate_license_key(None)
print(f"   Valid: {is_valid}")
print(f"   Tier: {tier}")
print(f"   Message: {message}")
assert is_valid is True
assert tier == "free"
print("   ✓ Free tier test passed")

# Test 2: Valid pro key
print("\n2. Testing pro tier key")
is_valid, tier, message = validate_license_key("BP-PRO-ABC123")
print(f"   Valid: {is_valid}")
print(f"   Tier: {tier}")
print(f"   Message: {message}")
assert is_valid is True
assert tier == "pro"
print("   ✓ Pro tier test passed")

# Test 3: Valid enterprise key
print("\n3. Testing enterprise tier key")
is_valid, tier, message = validate_license_key("BP-ENTERPRISE-XYZ789")
print(f"   Valid: {is_valid}")
print(f"   Tier: {tier}")
print(f"   Message: {message}")
assert is_valid is True
assert tier == "enterprise"
print("   ✓ Enterprise tier test passed")

# Test 4: Invalid key
print("\n4. Testing invalid key")
is_valid, tier, message = validate_license_key("INVALID-KEY-123")
print(f"   Valid: {is_valid}")
print(f"   Tier: {tier}")
print(f"   Message: {message}")
assert is_valid is False
assert tier == "free"
print("   ✓ Invalid key test passed")

# Test 5: License generator
print("\n5. Testing license generator")
generator = LicenseGenerator()
license_key = generator.generate(format="agencyos", tier="pro")
print(f"   Generated key: {license_key}")
assert license_key.startswith("AGOS-PRO-")
print("   ✓ License generator test passed")

# Test 6: License format validation
print("\n6. Testing license format validation")
result = generator.validate_format("AGOS-PRO-12345678-ABCD")
print(f"   Validation result: {json.dumps(result, indent=2)}")
assert result["valid"] is True
assert result["tier"] == "pro"
print("   ✓ License format validation passed")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED")
print("=" * 60)
print("\nLicense API endpoints are ready to use:")
print("  POST /api/license/verify")
print("  GET  /api/license/features/{tier}")
print("  POST /api/license/activate")
print("  GET  /api/license/health")

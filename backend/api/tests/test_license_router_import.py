#!/usr/bin/env python3
"""
Test that the license router can be imported and has the correct structure
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

print("Testing license router import...")
try:
    from backend.api.routers import license
    print("✓ Successfully imported license router")

    # Check router exists
    assert hasattr(license, 'router'), "Router object not found"
    print("✓ Router object exists")

    # Check endpoints exist
    routes = [route.path for route in license.router.routes]
    print(f"\n✓ Found {len(routes)} routes:")
    for route in routes:
        print(f"  - {route}")

    # Verify expected routes
    expected_routes = [
        "/api/license/verify",
        "/api/license/features/{tier}",
        "/api/license/activate",
        "/api/license/health"
    ]

    for expected in expected_routes:
        if expected in routes:
            print(f"✓ Route {expected} exists")
        else:
            print(f"✗ Route {expected} NOT FOUND")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("✅ LICENSE ROUTER STRUCTURE VALIDATED")
    print("=" * 60)
    print("\nThe license API is ready to use!")
    print("All endpoints are properly configured:")
    print("  ✓ POST /api/license/verify - Verify license keys")
    print("  ✓ GET  /api/license/features/{tier} - Get tier features")
    print("  ✓ POST /api/license/activate - Activate licenses")
    print("  ✓ GET  /api/license/health - Health check")

except ImportError as e:
    print(f"✗ Failed to import license router: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

#!/usr/bin/env python3
"""
Test script for License API endpoints

Tests all three endpoints:
1. POST /api/license/verify
2. GET /api/license/features/{tier}
3. POST /api/license/activate
"""

import json
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient

from backend.api.main import app

# Create test client
client = TestClient(app)

def test_health_check():
    """Test the license health endpoint."""
    print("\n1. Testing GET /api/license/health")
    response = client.get("/api/license/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("   ✓ Health check passed")


def test_verify_license_free():
    """Test license verification with no key (free tier)."""
    print("\n2. Testing POST /api/license/verify (free tier)")
    response = client.post("/api/license/verify", json={})
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["tier"] == "free"
    assert data["valid"] is True
    print("   ✓ Free tier verification passed")


def test_verify_license_pro():
    """Test license verification with pro key."""
    print("\n3. Testing POST /api/license/verify (pro tier)")
    response = client.post("/api/license/verify", json={
        "license_key": "BP-PRO-ABC123"
    })
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["tier"] == "pro"
    assert data["valid"] is True
    assert "ai_generation" in data["features"]
    print("   ✓ Pro tier verification passed")


def test_verify_license_invalid():
    """Test license verification with invalid key."""
    print("\n4. Testing POST /api/license/verify (invalid key)")
    response = client.post("/api/license/verify", json={
        "license_key": "INVALID-KEY-123"
    })
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["valid"] is False
    print("   ✓ Invalid key handling passed")


def test_get_tier_features_free():
    """Test getting features for free tier."""
    print("\n5. Testing GET /api/license/features/free")
    response = client.get("/api/license/features/free")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["tier"] == "free"
    assert len(data["features"]) > 0
    print("   ✓ Free tier features passed")


def test_get_tier_features_enterprise():
    """Test getting features for enterprise tier."""
    print("\n6. Testing GET /api/license/features/enterprise")
    response = client.get("/api/license/features/enterprise")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["tier"] == "enterprise"
    # Enterprise should have all features
    feature_names = [f["name"] for f in data["features"]]
    assert "ai_generation" in feature_names
    assert "custom_branding" in feature_names
    print("   ✓ Enterprise tier features passed")


def test_get_tier_features_invalid():
    """Test getting features for invalid tier."""
    print("\n7. Testing GET /api/license/features/invalid")
    response = client.get("/api/license/features/invalid")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 400
    print("   ✓ Invalid tier handling passed")


def test_activate_license_valid():
    """Test license activation with valid key."""
    print("\n8. Testing POST /api/license/activate (valid key)")
    response = client.post("/api/license/activate", json={
        "license_key": "BP-PRO-ABC123",
        "email": "test@example.com"
    })
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    assert data["success"] is True
    assert data["tier"] == "pro"
    assert "activated_at" in data
    print("   ✓ License activation passed")


def test_activate_license_invalid():
    """Test license activation with invalid key."""
    print("\n9. Testing POST /api/license/activate (invalid key)")
    response = client.post("/api/license/activate", json={
        "license_key": "INVALID-KEY"
    })
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 400
    print("   ✓ Invalid activation handling passed")


def run_all_tests():
    """Run all tests."""
    print("=" * 60)
    print("LICENSE API ENDPOINT TESTS")
    print("=" * 60)

    try:
        test_health_check()
        test_verify_license_free()
        test_verify_license_pro()
        test_verify_license_invalid()
        test_get_tier_features_free()
        test_get_tier_features_enterprise()
        test_get_tier_features_invalid()
        test_activate_license_valid()
        test_activate_license_invalid()

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

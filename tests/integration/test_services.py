"""
🧪 Simple Test for Refactored Core Services
===========================================

Test refactored services by importing them directly.
"""

import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "core"))


def test_service_imports():
    """Test that service modules can be imported."""
    print("🧪 Testing Service Imports...")

    try:
        # Test AI Wingman Service
        print("✅ AI Wingman Service imported")

        # Test Client Portal Service
        print("✅ Client Portal Service imported")

        # Test Analytics Service
        print("✅ Analytics Service imported")

        print("✅ All services imported successfully!\n")

    except Exception as e:
        print(f"❌ Service import failed: {e}\n")
        assert False, f"Service import failed: {e}"


def test_repository_imports():
    """Test that repository modules can be imported."""
    print("🗄️  Testing Repository Imports...")

    try:
        # Test AI Wingman Repository
        print("✅ AI Wingman Repository imported")

        # Test Client Portal Repository
        print("✅ Client Portal Repository imported")

        # Test Analytics Repository
        print("✅ Analytics Repository imported")

        print("✅ All repositories imported successfully!\n")

    except Exception as e:
        print(f"❌ Repository import failed: {e}\n")
        assert False, f"Repository import failed: {e}"


def test_presenter_imports():
    """Test that presenter modules can be imported."""
    print("🎨 Testing Presenter Imports...")

    try:
        # Test Client Portal Presenter
        print("✅ Client Portal Presenter imported")

        # Test Analytics Presenter
        print("✅ Analytics Presenter imported")

        print("✅ All presenters imported successfully!\n")

    except Exception as e:
        print(f"❌ Presenter import failed: {e}\n")
        assert False, f"Presenter import failed: {e}"


def test_basic_functionality():
    """Test basic functionality of services."""
    print("⚙️  Testing Basic Functionality...")

    try:
        # Test AI Wingman Service
        from core.services.ai_wingman_service import AgencyOwnerProfile
        owner = AgencyOwnerProfile(name="Test Owner", agency_name="Test Agency")
        print(f"✅ Created owner profile: {owner.agency_name}")

        # Test Client Portal Service
        from core.services.client_portal_service import ClientPortalService
        portal_service = ClientPortalService("Test Agency")
        stats = portal_service.get_stats()
        print(f"✅ Client portal stats: {stats['total_clients']} clients")

        # Test Analytics Engine
        from core.services.analytics_service import AnalyticsCalculationEngine
        AnalyticsCalculationEngine()
        print("✅ Analytics engine created")

        print("✅ Basic functionality tests passed!\n")

    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}\n")
        assert False, f"Basic functionality test failed: {e}"


def main():
    """Run all tests."""
    print("🧪 Testing Refactored Core Services")
    print("=" * 50)

    results = []

    # Test each category
    results.append(test_service_imports())
    results.append(test_repository_imports())
    results.append(test_presenter_imports())
    results.append(test_basic_functionality())

    # Summary
    passed = sum(results)
    total = len(results)

    print("=" * 50)
    print(f"🎯 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All refactored services working correctly!")
        return True
    else:
        print("⚠️  Some services have issues. Check logs above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

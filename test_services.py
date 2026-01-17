"""
🧪 Simple Test for Refactored Core Services
===========================================

Test refactored services by importing them directly.
"""

import sys
import os
from datetime import datetime

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'core'))

def test_service_imports():
    """Test that service modules can be imported."""
    print("🧪 Testing Service Imports...")
    
    try:
        # Test AI Wingman Service
        from services.ai_wingman_service import AIWingmanService, AgencyOwnerProfile, WingmanMode
        print("✅ AI Wingman Service imported")
        
        # Test Client Portal Service
        from services.client_portal_service import ClientPortalService
        print("✅ Client Portal Service imported")
        
        # Test Analytics Service
        from services.analytics_service import AnalyticsCalculationEngine, MetricPeriod
        print("✅ Analytics Service imported")
        
        print("✅ All services imported successfully!\n")
        return True
        
    except Exception as e:
        print(f"❌ Service import failed: {e}\n")
        return False

def test_repository_imports():
    """Test that repository modules can be imported."""
    print("🗄️  Testing Repository Imports...")
    
    try:
        # Test AI Wingman Repository
        from repositories.ai_wingman_repository import AIWingmanRepository
        print("✅ AI Wingman Repository imported")
        
        # Test Client Portal Repository
        from repositories.client_portal_repository import ClientPortalRepository
        print("✅ Client Portal Repository imported")
        
        # Test Analytics Repository
        from repositories.analytics_repository import AnalyticsRepository
        print("✅ Analytics Repository imported")
        
        print("✅ All repositories imported successfully!\n")
        return True
        
    except Exception as e:
        print(f"❌ Repository import failed: {e}\n")
        return False

def test_presenter_imports():
    """Test that presenter modules can be imported."""
    print("🎨 Testing Presenter Imports...")
    
    try:
        # Test Client Portal Presenter
        from presenters.client_portal_presenter import ClientPortalPresenter
        print("✅ Client Portal Presenter imported")
        
        # Test Analytics Presenter
        from presenters.analytics_presenter import AnalyticsPresenter
        print("✅ Analytics Presenter imported")
        
        print("✅ All presenters imported successfully!\n")
        return True
        
    except Exception as e:
        print(f"❌ Presenter import failed: {e}\n")
        return False

def test_basic_functionality():
    """Test basic functionality of services."""
    print("⚙️  Testing Basic Functionality...")
    
    try:
        # Test AI Wingman Service
        from services.ai_wingman_service import AgencyOwnerProfile, WingmanMode
        
        owner = AgencyOwnerProfile(
            name="Test Owner",
            agency_name="Test Agency"
        )
        
        print(f"✅ Created owner profile: {owner.agency_name}")
        
        # Test Client Portal Service
        from services.client_portal_service import ClientPortalService
        
        portal_service = ClientPortalService("Test Agency")
        stats = portal_service.get_stats()
        print(f"✅ Client portal stats: {stats['total_clients']} clients")
        
        # Test Analytics Engine
        from services.analytics_service import AnalyticsCalculationEngine, RevenueEntry, RevenueType
        
        engine = AnalyticsCalculationEngine()
        print("✅ Analytics engine created")
        
        print("✅ Basic functionality tests passed!\n")
        return True
        
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}\n")
        return False

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
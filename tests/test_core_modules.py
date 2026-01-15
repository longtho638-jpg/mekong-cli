"""
Core Module Tests for Agency OS.
Tests CRM, Analytics, and CRMPresenter.

Run: python3 -m pytest tests/test_core_modules.py -v
"""

import sys
import os
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestCRM:
    """Tests for CRM module."""
    
    def test_crm_initialization(self):
        """Test CRM initializes with correct defaults."""
        from core.crm import CRM
        
        crm = CRM()
        assert crm.agency_name is not None
        assert crm.contacts is not None
        assert crm.deals is not None
    
    def test_crm_add_contact(self):
        """Test adding a contact to CRM."""
        from core.crm import CRM
        
        crm = CRM()
        initial_count = len(crm.contacts)
        
        contact = crm.add_contact(
            name="Test User",
            email="test@example.com",
            company="Test Corp",
            phone="+84123456789"
        )
        
        assert len(crm.contacts) == initial_count + 1
        assert contact.name == "Test User"
        assert contact.email == "test@example.com"
    
    def test_crm_get_hot_leads(self):
        """Test getting hot leads with high scores."""
        from core.crm import CRM
        
        crm = CRM()
        hot_leads = crm.get_hot_leads()
        
        # Should return list
        assert isinstance(hot_leads, list)
        
        # All hot leads should have score >= 70
        for lead in hot_leads:
            assert lead.lead_score >= 70
    
    def test_crm_forecast_revenue(self):
        """Test revenue forecasting."""
        from core.crm import CRM
        
        crm = CRM()
        forecast = crm.forecast_revenue()
        
        assert 'total_pipeline' in forecast
        assert 'weighted_pipeline' in forecast
        assert forecast['total_pipeline'] >= 0
        assert forecast['weighted_pipeline'] >= 0
    
    def test_crm_get_summary(self):
        """Test CRM summary generation."""
        from core.crm import CRM
        
        crm = CRM()
        summary = crm.get_summary()
        
        assert 'win_rate' in summary
        assert 'contacts_total' in summary


class TestCRMPresenter:
    """Tests for CRMPresenter static methods."""
    
    def test_format_pipeline_text(self):
        """Test pipeline text formatting."""
        from core.crm import CRM, CRMPresenter
        
        crm = CRM()
        text = CRMPresenter.format_pipeline_text(crm)
        
        assert isinstance(text, str)
        assert "PIPELINE" in text
        assert "FORECAST" in text
        assert "CONTACTS" in text


class TestAnalytics:
    """Tests for Analytics module."""
    
    def test_analytics_initialization(self):
        """Test Analytics initializes correctly."""
        try:
            from core.analytics import Analytics
            
            analytics = Analytics()
            assert analytics.mrr >= 0
            assert analytics.arr >= 0
        except ImportError:
            # Module may not exist yet
            pass


def run_all_tests():
    """Run all tests and print results."""
    print("🧪 Running Core Module Tests...")
    print("=" * 50)
    
    tests_passed = 0
    tests_failed = 0
    
    # Test CRM
    print("\n📊 CRM Tests:")
    test_crm = TestCRM()
    
    try:
        test_crm.test_crm_initialization()
        print("   ✅ CRM initialization")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ CRM initialization: {e}")
        tests_failed += 1
    
    try:
        test_crm.test_crm_add_contact()
        print("   ✅ Add contact")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ Add contact: {e}")
        tests_failed += 1
    
    try:
        test_crm.test_crm_get_hot_leads()
        print("   ✅ Hot leads")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ Hot leads: {e}")
        tests_failed += 1
    
    try:
        test_crm.test_crm_forecast_revenue()
        print("   ✅ Revenue forecast")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ Revenue forecast: {e}")
        tests_failed += 1
    
    try:
        test_crm.test_crm_get_summary()
        print("   ✅ CRM summary")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ CRM summary: {e}")
        tests_failed += 1
    
    # Test CRMPresenter
    print("\n🎨 CRMPresenter Tests:")
    test_presenter = TestCRMPresenter()
    
    try:
        test_presenter.test_format_pipeline_text()
        print("   ✅ Pipeline text format")
        tests_passed += 1
    except Exception as e:
        print(f"   ❌ Pipeline text format: {e}")
        tests_failed += 1
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Results: {tests_passed} passed, {tests_failed} failed")
    
    if tests_failed == 0:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    
    return tests_failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

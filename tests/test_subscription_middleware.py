"""
Tests for Subscription Middleware.

Run: python3 -m pytest tests/test_subscription_middleware.py -v
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.subscription_middleware import SubscriptionMiddleware, SubscriptionTier, TierLimits

class TestSubscriptionMiddleware:
    
    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_initialization(self, mock_exists, mock_get_db):
        """Test middleware initializes correctly."""
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        assert middleware.usage_tracker is not None
        assert middleware._subscription_cache == {}
    
    def test_tier_limits_config(self):
        """Test TIER_LIMITS configuration."""
        from core.subscription_middleware import TIER_LIMITS
        
        assert SubscriptionTier.FREE in TIER_LIMITS
        assert SubscriptionTier.PRO in TIER_LIMITS
        assert TIER_LIMITS[SubscriptionTier.ENTERPRISE].monthly_api_calls == -1
    
    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_get_subscription_default(self, mock_exists, mock_get_db):
        """Test get_subscription returns default starter tier when DB and local file are missing."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        sub = middleware.get_subscription("test-user")
        assert sub["tier"] == SubscriptionTier.STARTER
        assert sub["user_id"] == "test-user"
    
    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_check_limit_api_call(self, mock_exists, mock_get_db):
        """Test check_limit for API calls."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        # Starter tier has 1000 calls
        result = middleware.check_limit("test-user", "api_call")
        assert result["allowed"] is True
        assert result["limit"] == 1000
    
    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_check_limit_denied(self, mock_exists, mock_get_db):
        """Test check_limit when limit is reached."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        # Force subscription to STARTER
        middleware._subscription_cache["test-user"] = {
            "tier": SubscriptionTier.STARTER,
            "agency_id": "test-user",
            "_cached_at": datetime.now()
        }
        
        # Mock usage to be over limit (Starter limit = 1000)
        middleware.usage_tracker._usage_cache["test-user"] = {"api_calls": 1001}
        middleware.usage_tracker._cache_timestamp["test-user"] = datetime.now()
        
        result = middleware.check_limit("test-user", "api_call")
        assert result["allowed"] is False
        assert "reached" in result["reason"]
    
    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_feature_access(self, mock_exists, mock_get_db):
        """Test feature access checks."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        # Force STARTER tier (does NOT have white_label)
        middleware._subscription_cache["test-user"] = {
            "tier": SubscriptionTier.STARTER,
            "agency_id": "test-user",
            "_cached_at": datetime.now()
        }
        
        result = middleware.check_limit("test-user", "white_label")
        assert result["allowed"] is False
        assert "requires Franchise" in result["reason"]
        
        # Enterprise tier DOES have white_label
        middleware._subscription_cache["ent-user"] = {
            "tier": SubscriptionTier.ENTERPRISE,
            "agency_id": "ent-user",
            "_cached_at": datetime.now()
        }
        result = middleware.check_limit("ent-user", "white_label")
        assert result["allowed"] is True

    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_enforce_decorator(self, mock_exists, mock_get_db):
        """Test enforce decorator."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        # Force STARTER tier
        middleware._subscription_cache["test-user"] = {
            "tier": SubscriptionTier.STARTER,
            "agency_id": "test-user",
            "_cached_at": datetime.now()
        }
        
        @middleware.enforce("api_call")
        def my_api_function(user_id):
            return "success"
            
        # Should work
        assert my_api_function(user_id="test-user") == "success"
        
        # Should fail if limit reached
        middleware.usage_tracker._usage_cache["test-user"] = {"api_calls": 1001}
        middleware.usage_tracker._cache_timestamp["test-user"] = datetime.now()
        
        with pytest.raises(PermissionError):
            my_api_function(user_id="test-user")

    @patch('core.subscription_middleware.get_db')
    @patch('core.subscription_middleware.Path.exists')
    def test_dashboard_format(self, mock_exists, mock_get_db):
        """Test dashboard formatting."""
        mock_get_db.return_value = None
        mock_exists.return_value = False
        middleware = SubscriptionMiddleware()
        
        # Force STARTER tier
        middleware._subscription_cache["test-user"] = {
            "tier": SubscriptionTier.STARTER,
            "agency_id": "test-user",
            "_cached_at": datetime.now()
        }
        
        dashboard = middleware.format_usage_dashboard("test-user")
        assert "USAGE DASHBOARD" in dashboard
        assert "STARTER" in dashboard
        assert "API CALLS" in dashboard

if __name__ == "__main__":
    pytest.main([__file__])
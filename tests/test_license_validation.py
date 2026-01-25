"""
Tests for License Validation Module

Tests license key validation, tier assignment, and feature gating
for the BizPlan Generator licensing system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.bizplan.generator import FEATURE_TIERS, check_license_tier
from antigravity.core.licensing.validation import (
    LICENSE_PREFIXES,
    get_tier_from_key,
    validate_license_key,
)


class TestLicenseValidation:
    """Test suite for license validation functionality."""

    def test_free_tier_default(self):
        """Test that None or empty key defaults to free tier."""
        # Test None key
        is_valid, tier, message = validate_license_key(None)
        assert is_valid is True
        assert tier == "free"
        assert "free tier" in message.lower()

        # Test empty string
        is_valid, tier, message = validate_license_key("")
        assert is_valid is True
        assert tier == "free"
        assert "free tier" in message.lower()

        # Test whitespace only
        is_valid, tier, message = validate_license_key("   ")
        assert is_valid is True
        assert tier == "free"
        assert "free tier" in message.lower()

    def test_pro_tier_with_valid_key(self):
        """Test that valid PRO key returns pro tier."""
        # Test PRO key
        is_valid, tier, message = validate_license_key("BP-PRO-ABC123")
        assert is_valid is True
        assert tier == "pro"
        assert "valid" in message.lower()
        assert "pro" in message.lower()

        # Test case insensitivity
        is_valid, tier, message = validate_license_key("bp-pro-xyz789")
        assert is_valid is True
        assert tier == "pro"

        # Test with whitespace
        is_valid, tier, message = validate_license_key("  BP-PRO-TEST  ")
        assert is_valid is True
        assert tier == "pro"

    def test_enterprise_tier(self):
        """Test that valid ENTERPRISE key returns enterprise tier."""
        is_valid, tier, message = validate_license_key("BP-ENTERPRISE-XYZ789")
        assert is_valid is True
        assert tier == "enterprise"
        assert "valid" in message.lower()
        assert "enterprise" in message.lower()

    def test_starter_tier(self):
        """Test that valid STARTER key returns starter tier."""
        is_valid, tier, message = validate_license_key("BP-STARTER-ABC123")
        assert is_valid is True
        assert tier == "starter"
        assert "valid" in message.lower()
        assert "starter" in message.lower()

    def test_franchise_tier(self):
        """Test that valid FRANCHISE key returns franchise tier."""
        is_valid, tier, message = validate_license_key("BP-FRANCHISE-TEST123")
        assert is_valid is True
        assert tier == "franchise"
        assert "valid" in message.lower()
        assert "franchise" in message.lower()

    def test_invalid_key_format(self):
        """Test that invalid key formats are rejected."""
        # Test invalid prefix
        is_valid, tier, message = validate_license_key("INVALID-KEY-123")
        assert is_valid is False
        assert tier == "free"
        assert "invalid" in message.lower()
        assert "format" in message.lower()

        # Test partial prefix
        is_valid, tier, message = validate_license_key("BP-UNKNOWN-123")
        assert is_valid is False
        assert tier == "free"

        # Test malformed key
        is_valid, tier, message = validate_license_key("RANDOM-STRING")
        assert is_valid is False
        assert tier == "free"

        # Test numeric only
        is_valid, tier, message = validate_license_key("12345678")
        assert is_valid is False
        assert tier == "free"

    def test_get_tier_from_key(self):
        """Test get_tier_from_key helper function."""
        # Valid keys
        assert get_tier_from_key("BP-PRO-ABC123") == "pro"
        assert get_tier_from_key("BP-ENTERPRISE-XYZ") == "enterprise"
        assert get_tier_from_key("BP-STARTER-TEST") == "starter"
        assert get_tier_from_key("BP-FRANCHISE-FOO") == "franchise"

        # Invalid/None keys default to free
        assert get_tier_from_key(None) == "free"
        assert get_tier_from_key("") == "free"
        assert get_tier_from_key("INVALID-KEY") == "free"

    def test_ai_generation_blocked_for_free(self):
        """Test that AI generation is blocked for free tier."""
        # Free tier should NOT have ai_generation access
        assert check_license_tier("ai_generation", "free") is False

        # Starter tier should NOT have ai_generation access
        assert check_license_tier("ai_generation", "starter") is False

        # Verify FEATURE_TIERS configuration
        assert "free" not in FEATURE_TIERS["ai_generation"]
        assert "starter" not in FEATURE_TIERS["ai_generation"]

    def test_ai_generation_allowed_for_pro(self):
        """Test that AI generation is allowed for pro tier and above."""
        # Pro tier should have ai_generation access
        assert check_license_tier("ai_generation", "pro") is True

        # Franchise tier should have ai_generation access
        assert check_license_tier("ai_generation", "franchise") is True

        # Enterprise tier should have ai_generation access
        assert check_license_tier("ai_generation", "enterprise") is True

        # Verify FEATURE_TIERS configuration
        assert "pro" in FEATURE_TIERS["ai_generation"]
        assert "franchise" in FEATURE_TIERS["ai_generation"]
        assert "enterprise" in FEATURE_TIERS["ai_generation"]

    def test_template_generation_all_tiers(self):
        """Test that template generation is available for all tiers."""
        # All tiers should have template_generation access
        for tier in ["free", "starter", "pro", "franchise", "enterprise"]:
            assert check_license_tier("template_generation", tier) is True

        # Verify FEATURE_TIERS includes all tiers
        assert set(FEATURE_TIERS["template_generation"]) == {
            "free",
            "starter",
            "pro",
            "franchise",
            "enterprise",
        }

    def test_export_pdf_franchise_and_above(self):
        """Test that PDF export is only available for franchise and enterprise."""
        # Free, starter, pro should NOT have export_pdf access
        assert check_license_tier("export_pdf", "free") is False
        assert check_license_tier("export_pdf", "starter") is False
        assert check_license_tier("export_pdf", "pro") is False

        # Franchise and enterprise SHOULD have export_pdf access
        assert check_license_tier("export_pdf", "franchise") is True
        assert check_license_tier("export_pdf", "enterprise") is True

    def test_custom_branding_enterprise_only(self):
        """Test that custom branding is only available for enterprise."""
        # All tiers except enterprise should NOT have custom_branding
        assert check_license_tier("custom_branding", "free") is False
        assert check_license_tier("custom_branding", "starter") is False
        assert check_license_tier("custom_branding", "pro") is False
        assert check_license_tier("custom_branding", "franchise") is False

        # Enterprise SHOULD have custom_branding
        assert check_license_tier("custom_branding", "enterprise") is True

    def test_license_prefixes_completeness(self):
        """Test that all expected tier prefixes are defined."""
        expected_prefixes = {
            "BP-FREE",
            "BP-STARTER",
            "BP-PRO",
            "BP-FRANCHISE",
            "BP-ENTERPRISE",
        }
        assert set(LICENSE_PREFIXES.keys()) == expected_prefixes

        # Verify tier names are correct
        assert LICENSE_PREFIXES["BP-FREE"] == "free"
        assert LICENSE_PREFIXES["BP-STARTER"] == "starter"
        assert LICENSE_PREFIXES["BP-PRO"] == "pro"
        assert LICENSE_PREFIXES["BP-FRANCHISE"] == "franchise"
        assert LICENSE_PREFIXES["BP-ENTERPRISE"] == "enterprise"

    def test_bp_free_explicit_key(self):
        """Test that explicit BP-FREE key works correctly."""
        is_valid, tier, message = validate_license_key("BP-FREE-TEST123")
        assert is_valid is True
        assert tier == "free"
        assert "free tier" in message.lower()

    def test_nonexistent_feature(self):
        """Test behavior when checking a non-existent feature."""
        # Non-existent features should return False for all tiers
        assert check_license_tier("nonexistent_feature", "free") is False
        assert check_license_tier("nonexistent_feature", "pro") is False
        assert check_license_tier("nonexistent_feature", "enterprise") is False

    def test_case_sensitivity(self):
        """Test that tier checking is case-insensitive."""
        # Uppercase tier name
        assert check_license_tier("ai_generation", "PRO") is True
        assert check_license_tier("ai_generation", "ENTERPRISE") is True

        # Mixed case tier name
        assert check_license_tier("ai_generation", "Pro") is True
        assert check_license_tier("ai_generation", "EnTeRpRiSe") is True


class TestLicenseIntegration:
    """Integration tests for license validation with real-world scenarios."""

    def test_user_workflow_free_to_pro_upgrade(self):
        """Simulate user upgrading from free to pro tier."""
        # Start with free tier
        tier = get_tier_from_key(None)
        assert tier == "free"
        assert check_license_tier("ai_generation", tier) is False

        # Upgrade to pro
        tier = get_tier_from_key("BP-PRO-UPGRADE123")
        assert tier == "pro"
        assert check_license_tier("ai_generation", tier) is True

    def test_feature_matrix_consistency(self):
        """Test that feature tiers are ordered correctly (more features at higher tiers)."""
        tiers_order = ["free", "starter", "pro", "franchise", "enterprise"]

        for feature, allowed_tiers in FEATURE_TIERS.items():
            # Find minimum tier index that has access
            min_tier_idx = min(
                tiers_order.index(t) for t in allowed_tiers if t in tiers_order
            )

            # All higher tiers should have access if feature follows upgrade pattern
            # (This is a heuristic - not all features must follow this pattern)
            if feature in ["ai_generation", "export_pdf", "custom_branding"]:
                for idx in range(min_tier_idx, len(tiers_order)):
                    tier = tiers_order[idx]
                    if tier in ["free", "starter"]:
                        continue  # Skip lower tiers
                    # Higher tier should have access
                    has_access = check_license_tier(feature, tier)
                    # Custom branding is enterprise-only
                    if feature == "custom_branding":
                        assert has_access == (tier == "enterprise")
                    # Export PDF is franchise+
                    elif feature == "export_pdf":
                        assert has_access == (tier in ["franchise", "enterprise"])

    def test_validation_message_clarity(self):
        """Test that validation messages are clear and informative."""
        # Free tier message
        _, _, message = validate_license_key(None)
        assert message
        assert len(message) > 10  # Message should be meaningful

        # Pro tier message
        _, _, message = validate_license_key("BP-PRO-TEST")
        assert message
        assert "valid" in message.lower()

        # Invalid key message
        _, _, message = validate_license_key("INVALID")
        assert message
        assert "invalid" in message.lower()
        assert "format" in message.lower()

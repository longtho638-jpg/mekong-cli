"""Tests for RAAS License Checker — tier-based feature gating."""

import os
import unittest
from unittest.mock import patch

from src.core.license_checker import (
    LicenseChecker,
    LicenseTier,
    TIER_ALLOWED_PROFILES,
    TIER_FEATURES,
    TIER_MAX_CONCURRENT,
    check_feature,
    check_pipeline_access,
    get_license_checker,
    reset_license_checker,
)


class TestLicenseTierResolution(unittest.TestCase):
    """Test tier resolution from license keys."""

    def test_no_key_returns_free(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("RAAS_LICENSE_KEY", None)
            checker = LicenseChecker()
            assert checker.get_tier() == LicenseTier.FREE

    def test_enterprise_key_raas_ent(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("raas_ent_abc123")
        assert tier == LicenseTier.ENTERPRISE

    def test_enterprise_key_rep(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("REP-mykey-xyz")
        assert tier == LicenseTier.ENTERPRISE

    def test_pro_key_raas_pro(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("raas_pro_abc123")
        assert tier == LicenseTier.PRO

    def test_pro_key_rpp(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("RPP-mykey-xyz")
        assert tier == LicenseTier.PRO

    def test_pro_key_mk(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("mk_abcdefgh")
        assert tier == LicenseTier.PRO

    def test_mk_key_too_short_is_free(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("mk_ab")
        assert tier == LicenseTier.FREE

    def test_unknown_key_returns_free(self):
        checker = LicenseChecker()
        tier = checker._resolve_tier_from_key("random_key_123")
        assert tier == LicenseTier.FREE

    def test_tier_override(self):
        checker = LicenseChecker(tier_override="enterprise")
        assert checker.get_tier() == LicenseTier.ENTERPRISE

    def test_tier_override_invalid_falls_to_free(self):
        checker = LicenseChecker(tier_override="platinum")
        assert checker.get_tier() == LicenseTier.FREE

    def test_env_key_resolves_tier(self):
        with patch.dict(os.environ, {"RAAS_LICENSE_KEY": "raas_pro_test123"}):
            checker = LicenseChecker()
            assert checker.get_tier() == LicenseTier.PRO

    def test_tier_caching(self):
        checker = LicenseChecker(tier_override="pro")
        assert checker.get_tier() == LicenseTier.PRO
        # Second call returns cached
        assert checker.get_tier() == LicenseTier.PRO

    def test_reset_cache(self):
        checker = LicenseChecker(tier_override="pro")
        assert checker.get_tier() == LicenseTier.PRO
        checker._tier_override = "enterprise"
        checker.reset_cache()
        assert checker.get_tier() == LicenseTier.ENTERPRISE


class TestPipelineAccess(unittest.TestCase):
    """Test tier-based pipeline profile access."""

    def test_free_allows_simple(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_pipeline_access("simple")
        assert result.allowed is True
        assert result.tier == LicenseTier.FREE

    def test_free_blocks_parallel(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_pipeline_access("parallel")
        assert result.allowed is False
        assert "higher tier" in result.reason
        assert result.upgrade_hint != ""

    def test_free_blocks_complex(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_pipeline_access("complex")
        assert result.allowed is False

    def test_pro_allows_all_standard_profiles(self):
        checker = LicenseChecker(tier_override="pro")
        for profile in ("simple", "standard", "complex", "parallel", "dag"):
            result = checker.check_pipeline_access(profile)
            assert result.allowed is True, f"Pro should allow '{profile}'"

    def test_pro_blocks_custom_agent(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_pipeline_access("custom_agent")
        assert result.allowed is False

    def test_enterprise_allows_everything(self):
        checker = LicenseChecker(tier_override="enterprise")
        for profile in ("simple", "standard", "complex", "parallel", "dag",
                         "custom_agent", "priority", "swarm"):
            result = checker.check_pipeline_access(profile)
            assert result.allowed is True, f"Enterprise should allow '{profile}'"

    def test_case_insensitive_profile(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_pipeline_access("PARALLEL")
        assert result.allowed is True


class TestFeatureChecks(unittest.TestCase):
    """Test feature flag checks per tier."""

    def test_free_no_parallel(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_feature("parallel_execution")
        assert result.allowed is False

    def test_free_no_self_healing(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_feature("self_healing")
        assert result.allowed is False

    def test_pro_has_parallel(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_feature("parallel_execution")
        assert result.allowed is True

    def test_pro_has_self_healing(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_feature("self_healing")
        assert result.allowed is True

    def test_pro_no_custom_agents(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_feature("custom_agents")
        assert result.allowed is False

    def test_enterprise_has_everything(self):
        checker = LicenseChecker(tier_override="enterprise")
        for feature in TIER_FEATURES[LicenseTier.ENTERPRISE]:
            result = checker.check_feature(feature)
            assert result.allowed is True, f"Enterprise should have '{feature}'"

    def test_unknown_feature_denied(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_feature("nonexistent_feature")
        assert result.allowed is False


class TestMaxConcurrent(unittest.TestCase):
    """Test max concurrent steps per tier."""

    def test_free_max_1(self):
        checker = LicenseChecker(tier_override="free")
        assert checker.get_max_concurrent_steps() == 1

    def test_pro_max_4(self):
        checker = LicenseChecker(tier_override="pro")
        assert checker.get_max_concurrent_steps() == 4

    def test_enterprise_max_16(self):
        checker = LicenseChecker(tier_override="enterprise")
        assert checker.get_max_concurrent_steps() == 16


class TestSingletonAndConvenience(unittest.TestCase):
    """Test singleton and convenience functions."""

    def setUp(self):
        reset_license_checker()

    def tearDown(self):
        reset_license_checker()

    def test_get_singleton(self):
        get_license_checker(tier_override="pro")
        checker2 = get_license_checker()
        # Second call without override returns existing
        assert checker2.get_tier() == LicenseTier.PRO

    def test_convenience_check_pipeline_access(self):
        reset_license_checker()
        get_license_checker(tier_override="free")
        result = check_pipeline_access("simple")
        assert result.allowed is True

    def test_convenience_check_feature(self):
        reset_license_checker()
        get_license_checker(tier_override="enterprise")
        result = check_feature("swarm_mode")
        assert result.allowed is True


class TestTierConstants(unittest.TestCase):
    """Test tier constant integrity."""

    def test_all_tiers_have_profiles(self):
        for tier in LicenseTier:
            assert tier in TIER_ALLOWED_PROFILES

    def test_all_tiers_have_features(self):
        for tier in LicenseTier:
            assert tier in TIER_FEATURES

    def test_all_tiers_have_max_concurrent(self):
        for tier in LicenseTier:
            assert tier in TIER_MAX_CONCURRENT

    def test_higher_tiers_include_lower_profiles(self):
        free_profiles = TIER_ALLOWED_PROFILES[LicenseTier.FREE]
        pro_profiles = TIER_ALLOWED_PROFILES[LicenseTier.PRO]
        ent_profiles = TIER_ALLOWED_PROFILES[LicenseTier.ENTERPRISE]
        assert free_profiles.issubset(pro_profiles)
        assert pro_profiles.issubset(ent_profiles)

    def test_max_concurrent_increases_with_tier(self):
        free = TIER_MAX_CONCURRENT[LicenseTier.FREE]
        pro = TIER_MAX_CONCURRENT[LicenseTier.PRO]
        ent = TIER_MAX_CONCURRENT[LicenseTier.ENTERPRISE]
        assert free < pro < ent


class TestUpgradeHints(unittest.TestCase):
    """Test upgrade hint generation."""

    def test_free_gets_pro_hint(self):
        checker = LicenseChecker(tier_override="free")
        result = checker.check_pipeline_access("parallel")
        assert "Pro" in result.upgrade_hint
        assert "agencyos.network" in result.upgrade_hint

    def test_pro_gets_enterprise_hint(self):
        checker = LicenseChecker(tier_override="pro")
        result = checker.check_pipeline_access("custom_agent")
        assert "Enterprise" in result.upgrade_hint

    def test_enterprise_no_hint(self):
        result = LicenseChecker._get_upgrade_hint(LicenseTier.ENTERPRISE, "anything")
        assert result == ""


if __name__ == "__main__":
    unittest.main()

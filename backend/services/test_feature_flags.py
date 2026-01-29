"""
Tests for Feature Flag Service
"""

import json
import tempfile
from pathlib import Path

import pytest

from backend.services.feature_flags import (
    FeatureFlagConfig,
    FeatureFlagService,
    RolloutStrategy,
    UserContext,
)


@pytest.fixture
def temp_storage():
    """Create temporary storage for tests"""
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json") as f:
        temp_path = f.name
    yield temp_path
    Path(temp_path).unlink(missing_ok=True)


@pytest.fixture
def service(temp_storage):
    """Create feature flag service instance"""
    return FeatureFlagService(storage_path=temp_storage)


@pytest.fixture
def user():
    """Create test user context"""
    return UserContext(
        user_id="user123",
        email="john@company.com",
        tier="pro",
    )


class TestFeatureFlagConfig:
    """Test feature flag configuration"""

    def test_to_dict_from_dict(self):
        """Test serialization/deserialization"""
        config = FeatureFlagConfig(
            name="test_feature",
            enabled=True,
            strategy=RolloutStrategy.PERCENTAGE,
            percentage=50,
            user_ids={"user1", "user2"},
            user_tiers={"pro", "enterprise"},
            email_domains={"company.com"},
        )

        data = config.to_dict()
        restored = FeatureFlagConfig.from_dict(data)

        assert restored.name == config.name
        assert restored.enabled == config.enabled
        assert restored.strategy == config.strategy
        assert restored.percentage == config.percentage
        assert restored.user_ids == config.user_ids
        assert restored.user_tiers == config.user_tiers
        assert restored.email_domains == config.email_domains


class TestUserContext:
    """Test user context"""

    def test_email_domain_extraction(self):
        """Test email domain extraction"""
        user = UserContext(user_id="user1", email="john@example.com")
        assert user.email_domain == "example.com"

    def test_email_domain_none(self):
        """Test email domain when email is None"""
        user = UserContext(user_id="user1")
        assert user.email_domain is None

    def test_email_domain_invalid(self):
        """Test email domain with invalid email"""
        user = UserContext(user_id="user1", email="invalid")
        assert user.email_domain is None


class TestFeatureFlagService:
    """Test feature flag service"""

    def test_create_flag(self, service):
        """Test flag creation"""
        flag = service.create_flag("test_feature", enabled=True)
        assert flag.name == "test_feature"
        assert flag.enabled is True
        assert flag.strategy == RolloutStrategy.NONE

    def test_create_flag_with_options(self, service):
        """Test flag creation with options"""
        flag = service.create_flag(
            "test_feature",
            enabled=True,
            strategy=RolloutStrategy.PERCENTAGE,
            percentage=50,
        )
        assert flag.percentage == 50
        assert flag.strategy == RolloutStrategy.PERCENTAGE

    def test_update_flag(self, service):
        """Test flag update"""
        service.create_flag("test_feature", enabled=False)
        flag = service.create_flag("test_feature", enabled=True, percentage=75)
        assert flag.enabled is True
        assert flag.percentage == 75

    def test_delete_flag(self, service):
        """Test flag deletion"""
        service.create_flag("test_feature")
        assert service.delete_flag("test_feature") is True
        assert service.get_flag("test_feature") is None
        assert service.delete_flag("test_feature") is False

    def test_get_flag(self, service):
        """Test flag retrieval"""
        service.create_flag("test_feature")
        flag = service.get_flag("test_feature")
        assert flag is not None
        assert flag.name == "test_feature"

    def test_list_flags(self, service):
        """Test flag listing"""
        service.create_flag("feature1")
        service.create_flag("feature2")
        flags = service.list_flags()
        assert len(flags) == 2

    def test_persistence(self, temp_storage):
        """Test flag persistence across instances"""
        service1 = FeatureFlagService(storage_path=temp_storage)
        service1.create_flag("test_feature", enabled=True, percentage=50)

        service2 = FeatureFlagService(storage_path=temp_storage)
        flag = service2.get_flag("test_feature")
        assert flag is not None
        assert flag.enabled is True
        assert flag.percentage == 50


class TestRolloutStrategies:
    """Test rollout strategies"""

    def test_strategy_all(self, service, user):
        """Test ALL strategy"""
        service.enable_for_all("test_feature")
        assert service.is_enabled("test_feature", user) is True

    def test_strategy_none(self, service, user):
        """Test NONE strategy"""
        service.disable_for_all("test_feature")
        assert service.is_enabled("test_feature", user) is False

    def test_flag_disabled(self, service, user):
        """Test disabled flag"""
        service.create_flag("test_feature", enabled=False, strategy=RolloutStrategy.ALL)
        assert service.is_enabled("test_feature", user) is False

    def test_strategy_percentage(self, service):
        """Test PERCENTAGE strategy"""
        service.rollout_percentage("test_feature", 50)

        # Test consistency: same user should always get same result
        user = UserContext(user_id="user123")
        result1 = service.is_enabled("test_feature", user)
        result2 = service.is_enabled("test_feature", user)
        assert result1 == result2

        # Test distribution: roughly 50% should be enabled
        enabled_count = sum(
            1
            for i in range(1000)
            if service.is_enabled("test_feature", UserContext(user_id=f"user{i}"))
        )
        # Allow 10% margin (450-550)
        assert 450 <= enabled_count <= 550

    def test_strategy_user_list(self, service):
        """Test USER_LIST strategy"""
        service.enable_for_users("test_feature", ["user1", "user2"])

        assert service.is_enabled("test_feature", UserContext(user_id="user1")) is True
        assert service.is_enabled("test_feature", UserContext(user_id="user2")) is True
        assert service.is_enabled("test_feature", UserContext(user_id="user3")) is False

    def test_strategy_user_tier(self, service):
        """Test USER_TIER strategy"""
        service.enable_for_tiers("test_feature", ["pro", "enterprise"])

        assert service.is_enabled("test_feature", UserContext(user_id="u1", tier="pro")) is True
        assert (
            service.is_enabled("test_feature", UserContext(user_id="u2", tier="enterprise")) is True
        )
        assert service.is_enabled("test_feature", UserContext(user_id="u3", tier="free")) is False
        assert service.is_enabled("test_feature", UserContext(user_id="u4")) is False

    def test_strategy_email_domain(self, service):
        """Test EMAIL_DOMAIN strategy"""
        service.enable_for_domains("test_feature", ["company.com", "partner.com"])

        assert (
            service.is_enabled("test_feature", UserContext(user_id="u1", email="john@company.com"))
            is True
        )
        assert (
            service.is_enabled("test_feature", UserContext(user_id="u2", email="jane@partner.com"))
            is True
        )
        assert (
            service.is_enabled("test_feature", UserContext(user_id="u3", email="bob@other.com"))
            is False
        )
        assert service.is_enabled("test_feature", UserContext(user_id="u4")) is False

    def test_strategy_ab_test(self, service):
        """Test AB_TEST strategy"""
        service.create_ab_test("test_feature", {"A": 50, "B": 50})

        user = UserContext(user_id="user123")
        variant = service.get_variant("test_feature", user)
        assert variant in ["A", "B"]

        # Test consistency: same user should always get same variant
        variant2 = service.get_variant("test_feature", user)
        assert variant == variant2

        # Test distribution: roughly 50/50 split
        variants = {}
        for i in range(1000):
            u = UserContext(user_id=f"user{i}")
            v = service.get_variant("test_feature", u)
            variants[v] = variants.get(v, 0) + 1

        # Allow 10% margin (450-550)
        assert 450 <= variants.get("A", 0) <= 550
        assert 450 <= variants.get("B", 0) <= 550

    def test_ab_test_invalid_allocation(self, service):
        """Test A/B test with invalid allocation"""
        with pytest.raises(ValueError, match="must sum to 100"):
            service.create_ab_test("test_feature", {"A": 60, "B": 60})

    def test_no_user_context(self, service):
        """Test strategies requiring user context without user"""
        service.rollout_percentage("test_feature", 50)
        assert service.is_enabled("test_feature") is False


class TestConvenienceMethods:
    """Test convenience methods"""

    def test_enable_for_all(self, service, user):
        """Test enable_for_all"""
        service.enable_for_all("test_feature")
        assert service.is_enabled("test_feature", user) is True

    def test_disable_for_all(self, service, user):
        """Test disable_for_all"""
        service.disable_for_all("test_feature")
        assert service.is_enabled("test_feature", user) is False

    def test_rollout_percentage(self, service):
        """Test rollout_percentage"""
        service.rollout_percentage("test_feature", 50)
        flag = service.get_flag("test_feature")
        assert flag.percentage == 50

    def test_rollout_percentage_clamp(self, service):
        """Test percentage clamping"""
        service.rollout_percentage("test_feature", 150)
        flag = service.get_flag("test_feature")
        assert flag.percentage == 100

        service.rollout_percentage("test_feature", -10)
        flag = service.get_flag("test_feature")
        assert flag.percentage == 0

    def test_enable_for_users(self, service):
        """Test enable_for_users"""
        service.enable_for_users("test_feature", ["user1", "user2"])
        flag = service.get_flag("test_feature")
        assert flag.user_ids == {"user1", "user2"}

    def test_enable_for_tiers(self, service):
        """Test enable_for_tiers"""
        service.enable_for_tiers("test_feature", ["pro"])
        flag = service.get_flag("test_feature")
        assert flag.user_tiers == {"pro"}

    def test_enable_for_domains(self, service):
        """Test enable_for_domains"""
        service.enable_for_domains("test_feature", ["company.com"])
        flag = service.get_flag("test_feature")
        assert flag.email_domains == {"company.com"}


class TestEdgeCases:
    """Test edge cases"""

    def test_nonexistent_flag(self, service, user):
        """Test checking nonexistent flag"""
        assert service.is_enabled("nonexistent", user) is False

    def test_empty_storage_file(self, temp_storage):
        """Test loading from empty storage"""
        Path(temp_storage).write_text("{}")
        service = FeatureFlagService(storage_path=temp_storage)
        assert len(service.list_flags()) == 0

    def test_corrupted_storage_file(self, temp_storage):
        """Test loading from corrupted storage"""
        Path(temp_storage).write_text("invalid json")
        service = FeatureFlagService(storage_path=temp_storage)
        assert len(service.list_flags()) == 0

    def test_percentage_consistency(self, service):
        """Test percentage rollout consistency across different percentages"""
        # User should remain in rollout as percentage increases
        user = UserContext(user_id="user123")

        service.rollout_percentage("test_feature", 10)
        result_10 = service.is_enabled("test_feature", user)

        service.rollout_percentage("test_feature", 50)
        result_50 = service.is_enabled("test_feature", user)

        service.rollout_percentage("test_feature", 100)
        result_100 = service.is_enabled("test_feature", user)

        # If enabled at 10%, should be enabled at 50% and 100%
        if result_10:
            assert result_50
            assert result_100

        # If enabled at 50%, should be enabled at 100%
        if result_50:
            assert result_100

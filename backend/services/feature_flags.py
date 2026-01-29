"""
Feature Flag Service

Provides feature flag management with:
- Enable/disable features without deployment
- Percentage rollout (gradual feature releases)
- User-based targeting (by tier, email domain)
- A/B testing support
- Real-time feature state evaluation
"""

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set


class RolloutStrategy(str, Enum):
    """Feature flag rollout strategies"""

    ALL = "all"  # Enable for all users
    NONE = "none"  # Disable for all users
    PERCENTAGE = "percentage"  # Gradual rollout by percentage
    USER_LIST = "user_list"  # Specific user IDs
    USER_TIER = "user_tier"  # By user tier (free, pro, enterprise)
    EMAIL_DOMAIN = "email_domain"  # By email domain
    AB_TEST = "ab_test"  # A/B testing variant assignment


@dataclass
class FeatureFlagConfig:
    """Feature flag configuration"""

    name: str
    enabled: bool = False
    strategy: RolloutStrategy = RolloutStrategy.NONE
    percentage: int = 0  # 0-100 for percentage rollout
    user_ids: Set[str] = field(default_factory=set)
    user_tiers: Set[str] = field(default_factory=set)  # e.g., {"pro", "enterprise"}
    email_domains: Set[str] = field(default_factory=set)  # e.g., {"company.com"}
    ab_test_variant: Optional[str] = None  # e.g., "A", "B", "control"
    ab_test_allocation: Dict[str, int] = field(default_factory=dict)  # {"A": 50, "B": 50}
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "name": self.name,
            "enabled": self.enabled,
            "strategy": self.strategy.value,
            "percentage": self.percentage,
            "user_ids": list(self.user_ids),
            "user_tiers": list(self.user_tiers),
            "email_domains": list(self.email_domains),
            "ab_test_variant": self.ab_test_variant,
            "ab_test_allocation": self.ab_test_allocation,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FeatureFlagConfig":
        """Create from dictionary"""
        return cls(
            name=data["name"],
            enabled=data.get("enabled", False),
            strategy=RolloutStrategy(data.get("strategy", "none")),
            percentage=data.get("percentage", 0),
            user_ids=set(data.get("user_ids", [])),
            user_tiers=set(data.get("user_tiers", [])),
            email_domains=set(data.get("email_domains", [])),
            ab_test_variant=data.get("ab_test_variant"),
            ab_test_allocation=data.get("ab_test_allocation", {}),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(
                data.get("created_at", datetime.utcnow().isoformat())
            ),
            updated_at=datetime.fromisoformat(
                data.get("updated_at", datetime.utcnow().isoformat())
            ),
        )


@dataclass
class UserContext:
    """User context for feature flag evaluation"""

    user_id: str
    email: Optional[str] = None
    tier: Optional[str] = None  # e.g., "free", "pro", "enterprise"
    custom_attributes: Dict[str, Any] = field(default_factory=dict)

    @property
    def email_domain(self) -> Optional[str]:
        """Extract email domain"""
        if self.email and "@" in self.email:
            return self.email.split("@")[1].lower()
        return None


class FeatureFlagService:
    """
    Feature flag service for safe feature releases

    Usage:
        service = FeatureFlagService()

        # Create feature flag
        service.create_flag("new_dashboard", enabled=True, strategy=RolloutStrategy.PERCENTAGE, percentage=50)

        # Check if enabled for user
        user = UserContext(user_id="user123", email="john@company.com", tier="pro")
        if service.is_enabled("new_dashboard", user):
            # Show new dashboard
            pass
    """

    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize feature flag service

        Args:
            storage_path: Path to store feature flag configurations (JSON file)
        """
        self.storage_path = Path(storage_path or "backend/data/feature_flags.json")
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.flags: Dict[str, FeatureFlagConfig] = {}
        self._load_flags()

    def _load_flags(self) -> None:
        """Load feature flags from storage"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, "r") as f:
                    data = json.load(f)
                    self.flags = {
                        name: FeatureFlagConfig.from_dict(config) for name, config in data.items()
                    }
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error loading feature flags: {e}")
                self.flags = {}

    def _save_flags(self) -> None:
        """Save feature flags to storage"""
        data = {name: config.to_dict() for name, config in self.flags.items()}
        with open(self.storage_path, "w") as f:
            json.dump(data, f, indent=2)

    def create_flag(
        self,
        name: str,
        enabled: bool = False,
        strategy: RolloutStrategy = RolloutStrategy.NONE,
        **kwargs,
    ) -> FeatureFlagConfig:
        """
        Create or update a feature flag

        Args:
            name: Feature flag name
            enabled: Whether flag is enabled
            strategy: Rollout strategy
            **kwargs: Additional configuration (percentage, user_ids, etc.)

        Returns:
            Created or updated feature flag configuration
        """
        if name in self.flags:
            flag = self.flags[name]
            flag.enabled = enabled
            flag.strategy = strategy
            flag.updated_at = datetime.utcnow()
        else:
            flag = FeatureFlagConfig(name=name, enabled=enabled, strategy=strategy)

        # Update configuration
        for key, value in kwargs.items():
            if hasattr(flag, key):
                if key in ["user_ids", "user_tiers", "email_domains"]:
                    setattr(flag, key, set(value) if isinstance(value, list) else value)
                else:
                    setattr(flag, key, value)

        self.flags[name] = flag
        self._save_flags()
        return flag

    def delete_flag(self, name: str) -> bool:
        """
        Delete a feature flag

        Args:
            name: Feature flag name

        Returns:
            True if deleted, False if not found
        """
        if name in self.flags:
            del self.flags[name]
            self._save_flags()
            return True
        return False

    def get_flag(self, name: str) -> Optional[FeatureFlagConfig]:
        """Get feature flag configuration"""
        return self.flags.get(name)

    def list_flags(self) -> List[FeatureFlagConfig]:
        """List all feature flags"""
        return list(self.flags.values())

    def is_enabled(
        self,
        feature_name: str,
        user: Optional[UserContext] = None,
    ) -> bool:
        """
        Check if feature is enabled for user

        Args:
            feature_name: Feature flag name
            user: User context (optional for non-user-specific flags)

        Returns:
            True if feature is enabled for this user, False otherwise
        """
        flag = self.flags.get(feature_name)
        if not flag or not flag.enabled:
            return False

        # Strategy evaluation
        if flag.strategy == RolloutStrategy.ALL:
            return True

        if flag.strategy == RolloutStrategy.NONE:
            return False

        if not user:
            # Cannot evaluate user-specific strategies without user context
            return False

        if flag.strategy == RolloutStrategy.PERCENTAGE:
            return self._check_percentage_rollout(flag, user)

        if flag.strategy == RolloutStrategy.USER_LIST:
            return user.user_id in flag.user_ids

        if flag.strategy == RolloutStrategy.USER_TIER:
            return user.tier in flag.user_tiers if user.tier else False

        if flag.strategy == RolloutStrategy.EMAIL_DOMAIN:
            return user.email_domain in flag.email_domains if user.email_domain else False

        if flag.strategy == RolloutStrategy.AB_TEST:
            return self._check_ab_test(flag, user)

        return False

    def _check_percentage_rollout(self, flag: FeatureFlagConfig, user: UserContext) -> bool:
        """
        Check percentage rollout using consistent hashing

        Args:
            flag: Feature flag configuration
            user: User context

        Returns:
            True if user falls within rollout percentage
        """
        # Use consistent hashing to ensure same user always gets same result
        hash_input = f"{flag.name}:{user.user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        user_percentage = hash_value % 100
        return user_percentage < flag.percentage

    def _check_ab_test(self, flag: FeatureFlagConfig, user: UserContext) -> bool:
        """
        Check A/B test variant assignment

        Args:
            flag: Feature flag configuration
            user: User context

        Returns:
            True if user is assigned to a variant (stores variant in user context)
        """
        if not flag.ab_test_allocation:
            return False

        # Use consistent hashing for variant assignment
        hash_input = f"{flag.name}:ab_test:{user.user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        user_percentage = hash_value % 100

        # Determine variant based on allocation
        cumulative = 0
        for variant, allocation in sorted(flag.ab_test_allocation.items()):
            cumulative += allocation
            if user_percentage < cumulative:
                # Store assigned variant in user context for tracking
                user.custom_attributes["ab_test_variant"] = variant
                return True

        return False

    def get_variant(self, feature_name: str, user: UserContext) -> Optional[str]:
        """
        Get A/B test variant for user

        Args:
            feature_name: Feature flag name
            user: User context

        Returns:
            Variant name if assigned, None otherwise
        """
        flag = self.flags.get(feature_name)
        if not flag or flag.strategy != RolloutStrategy.AB_TEST:
            return None

        if self._check_ab_test(flag, user):
            return user.custom_attributes.get("ab_test_variant")

        return None

    # Convenience methods for common operations

    def enable_for_all(self, feature_name: str) -> FeatureFlagConfig:
        """Enable feature for all users"""
        return self.create_flag(feature_name, enabled=True, strategy=RolloutStrategy.ALL)

    def disable_for_all(self, feature_name: str) -> FeatureFlagConfig:
        """Disable feature for all users"""
        return self.create_flag(feature_name, enabled=True, strategy=RolloutStrategy.NONE)

    def rollout_percentage(self, feature_name: str, percentage: int) -> FeatureFlagConfig:
        """Enable feature for percentage of users"""
        return self.create_flag(
            feature_name,
            enabled=True,
            strategy=RolloutStrategy.PERCENTAGE,
            percentage=min(max(percentage, 0), 100),
        )

    def enable_for_users(self, feature_name: str, user_ids: List[str]) -> FeatureFlagConfig:
        """Enable feature for specific users"""
        return self.create_flag(
            feature_name,
            enabled=True,
            strategy=RolloutStrategy.USER_LIST,
            user_ids=user_ids,
        )

    def enable_for_tiers(self, feature_name: str, tiers: List[str]) -> FeatureFlagConfig:
        """Enable feature for user tiers"""
        return self.create_flag(
            feature_name,
            enabled=True,
            strategy=RolloutStrategy.USER_TIER,
            user_tiers=tiers,
        )

    def enable_for_domains(self, feature_name: str, domains: List[str]) -> FeatureFlagConfig:
        """Enable feature for email domains"""
        return self.create_flag(
            feature_name,
            enabled=True,
            strategy=RolloutStrategy.EMAIL_DOMAIN,
            email_domains=domains,
        )

    def create_ab_test(
        self,
        feature_name: str,
        variants: Dict[str, int],
    ) -> FeatureFlagConfig:
        """
        Create A/B test

        Args:
            feature_name: Feature flag name
            variants: Variant allocation, e.g., {"A": 50, "B": 50}

        Returns:
            Created feature flag configuration
        """
        # Validate allocation sums to 100
        total = sum(variants.values())
        if total != 100:
            raise ValueError(f"A/B test allocation must sum to 100, got {total}")

        return self.create_flag(
            feature_name,
            enabled=True,
            strategy=RolloutStrategy.AB_TEST,
            ab_test_allocation=variants,
        )

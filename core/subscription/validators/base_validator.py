"""
☁️ Base Validator - Validation Interface
======================================

Abstract base class for subscription validators.
Strategy pattern implementation for different validation methods.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional

from ..models.subscription import Subscription, SubscriptionTier


class BaseValidator(ABC):
    """Abstract base validator for subscription validation."""

    @abstractmethod
    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get subscription details for user."""
        pass

    @abstractmethod
    def validate_license(self, license_key: str, email: Optional[str] = None) -> Dict:
        """Validate license key."""
        pass

    @abstractmethod
    def check_tier_access(self, tier: SubscriptionTier, feature: str) -> bool:
        """Check if tier has access to feature."""
        pass
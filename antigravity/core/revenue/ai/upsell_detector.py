"""
Revenue AI - Upsell Detector.
=============================

Upsell opportunity detection.
"""

import logging
import time
from typing import Dict, List, Optional

from ..models import (
    CustomerProfile,
    UpsellOpportunity,
    UpsellRecommendation,
)

logger = logging.getLogger(__name__)


class UpsellDetector:
    """Upsell opportunity detection engine."""

    # Tier configuration
    TIERS: Dict[str, Dict[str, int]] = {
        "warrior": {"price": 2000, "features": 10},
        "general": {"price": 5000, "features": 25},
        "tuong_quan": {"price": 15000, "features": 50},
    }

    def detect(self, customer: CustomerProfile) -> List[UpsellRecommendation]:
        """Detect upsell opportunities for a customer."""
        recommendations = []

        # Tier upgrade opportunity
        if customer.usage_percent > 80:
            rec = self._check_tier_upgrade(customer)
            if rec:
                recommendations.append(rec)

        # Annual plan opportunity
        annual_rec = self._check_annual_plan(customer)
        if annual_rec:
            recommendations.append(annual_rec)

        # Feature-based upsell
        feature_rec = self._check_feature_addon(customer)
        if feature_rec:
            recommendations.append(feature_rec)

        logger.info(
            f"Found {len(recommendations)} upsell opportunities for {customer.name}"
        )
        return recommendations

    def _check_tier_upgrade(
        self, customer: CustomerProfile
    ) -> Optional[UpsellRecommendation]:
        """Check for tier upgrade opportunity."""
        current_tier = customer.tier
        upgrade_options = {"warrior": "general", "general": "tuong_quan"}

        if current_tier in upgrade_options:
            next_tier = upgrade_options[current_tier]
            price_increase = (
                self.TIERS[next_tier]["price"] - self.TIERS[current_tier]["price"]
            )

            return UpsellRecommendation(
                customer_id=customer.id,
                opportunity=UpsellOpportunity.TIER_UPGRADE,
                potential_mrr_increase=price_increase,
                confidence=0.7,
                reasoning=f"Usage at {customer.usage_percent:.0f}% - likely needs more capacity",
            )
        return None

    def _check_annual_plan(
        self, customer: CustomerProfile
    ) -> Optional[UpsellRecommendation]:
        """Check for annual plan opportunity."""
        days_since_signup = (time.time() - customer.signup_date) / 86400

        if 90 < days_since_signup < 365:
            return UpsellRecommendation(
                customer_id=customer.id,
                opportunity=UpsellOpportunity.ANNUAL_PLAN,
                potential_mrr_increase=customer.mrr * 0.17,  # 2/12 months
                confidence=0.5,
                reasoning=f"Customer for {days_since_signup:.0f} days - good candidate for annual plan",
            )
        return None

    def _check_feature_addon(
        self, customer: CustomerProfile
    ) -> Optional[UpsellRecommendation]:
        """Check for feature-based upsell."""
        if customer.feature_usage:
            most_used = max(customer.feature_usage.items(), key=lambda x: x[1])[0]
            return UpsellRecommendation(
                customer_id=customer.id,
                opportunity=UpsellOpportunity.ADDON_SERVICE,
                potential_mrr_increase=500,
                confidence=0.4,
                reasoning=f"Heavy usage of {most_used} - offer premium {most_used} addon",
            )
        return None

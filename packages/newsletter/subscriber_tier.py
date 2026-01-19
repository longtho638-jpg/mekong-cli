#!/usr/bin/env python3
"""
📧 Newsletter Subscriber Tier Logic
Handles tier limits, upgrades, and Supabase sync.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class SubscriberTier(Enum):
    """Newsletter subscription tiers."""

    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    SCALE = "scale"


@dataclass
class TierConfig:
    """Configuration for each tier."""

    name: str
    subscriber_limit: int
    price_monthly: float
    newsletters_limit: int
    features: list


TIER_CONFIGS = {
    SubscriberTier.FREE: TierConfig(
        name="Free",
        subscriber_limit=100,
        price_monthly=0,
        newsletters_limit=1,
        features=["Basic analytics", "Mekong branding"],
    ),
    SubscriberTier.STARTER: TierConfig(
        name="Starter",
        subscriber_limit=1000,
        price_monthly=9,
        newsletters_limit=-1,  # Unlimited
        features=["Advanced analytics", "Remove branding", "Custom domain"],
    ),
    SubscriberTier.PRO: TierConfig(
        name="Pro",
        subscriber_limit=5000,
        price_monthly=29,
        newsletters_limit=-1,
        features=["AgencyOS integration", "A/B testing", "API access", "Priority support"],
    ),
    SubscriberTier.SCALE: TierConfig(
        name="Scale",
        subscriber_limit=-1,  # Unlimited
        price_monthly=99,
        newsletters_limit=-1,
        features=["White-label", "Multi-team", "Dedicated support", "SLA guarantee"],
    ),
}


@dataclass
class Subscriber:
    """Newsletter subscriber data."""

    id: str
    email: str
    tier: SubscriberTier
    subscriber_count: int
    newsletters_count: int
    created_at: str
    upgraded_at: Optional[str] = None


def check_tier_limit(subscriber: Subscriber) -> dict:
    """
    Check if subscriber has hit their tier limit.
    Returns status and upgrade recommendation.
    """
    config = TIER_CONFIGS[subscriber.tier]

    # Unlimited check
    if config.subscriber_limit == -1:
        return {"at_limit": False, "usage_percent": 0, "message": "Unlimited subscribers"}

    usage_percent = (subscriber.subscriber_count / config.subscriber_limit) * 100
    at_limit = subscriber.subscriber_count >= config.subscriber_limit

    result = {
        "at_limit": at_limit,
        "usage_percent": round(usage_percent, 1),
        "current_count": subscriber.subscriber_count,
        "limit": config.subscriber_limit,
        "tier": subscriber.tier.value,
    }

    if at_limit:
        # Find next tier
        tiers = list(SubscriberTier)
        current_idx = tiers.index(subscriber.tier)
        if current_idx < len(tiers) - 1:
            next_tier = tiers[current_idx + 1]
            next_config = TIER_CONFIGS[next_tier]
            result["upgrade_to"] = next_tier.value
            result["upgrade_price"] = next_config.price_monthly
            result["upgrade_limit"] = next_config.subscriber_limit
            result["message"] = (
                f"Upgrade to {next_config.name} for {next_config.subscriber_limit} subscribers"
            )
        else:
            result["message"] = "You're on the highest tier!"
    else:
        remaining = config.subscriber_limit - subscriber.subscriber_count
        result["message"] = f"{remaining} subscribers remaining"

    return result


def get_upgrade_path(current_tier: SubscriberTier) -> list:
    """Get available upgrade options from current tier."""
    tiers = list(SubscriberTier)
    current_idx = tiers.index(current_tier)

    upgrades = []
    for tier in tiers[current_idx + 1 :]:
        config = TIER_CONFIGS[tier]
        upgrades.append(
            {
                "tier": tier.value,
                "name": config.name,
                "price": config.price_monthly,
                "subscriber_limit": config.subscriber_limit,
                "features": config.features,
            }
        )

    return upgrades


def calculate_upgrade_value(current: SubscriberTier, target: SubscriberTier) -> dict:
    """Calculate the value proposition of upgrading."""
    current_config = TIER_CONFIGS[current]
    target_config = TIER_CONFIGS[target]

    price_diff = target_config.price_monthly - current_config.price_monthly

    if current_config.subscriber_limit == -1 or target_config.subscriber_limit == -1:
        sub_increase = "Unlimited"
    else:
        sub_increase = target_config.subscriber_limit - current_config.subscriber_limit

    new_features = [f for f in target_config.features if f not in current_config.features]

    return {
        "price_increase": price_diff,
        "subscriber_increase": sub_increase,
        "new_features": new_features,
        "cost_per_1k_subs": round(price_diff / (sub_increase / 1000), 2)
        if isinstance(sub_increase, int)
        else 0,
    }


# Example usage
if __name__ == "__main__":
    # Test subscriber
    test_sub = Subscriber(
        id="sub-001",
        email="test@example.com",
        tier=SubscriberTier.FREE,
        subscriber_count=95,
        newsletters_count=1,
        created_at=datetime.now().isoformat(),
    )

    print("📧 NEWSLETTER TIER CHECK")
    print("=" * 40)

    result = check_tier_limit(test_sub)
    print(f"Tier: {result['tier']}")
    print(f"Usage: {result['current_count']}/{result['limit']} ({result['usage_percent']}%)")
    print(f"At limit: {result['at_limit']}")
    print(f"Message: {result['message']}")

    if result.get("upgrade_to"):
        print(f"\n🚀 Upgrade to {result['upgrade_to']} for ${result['upgrade_price']}/mo")

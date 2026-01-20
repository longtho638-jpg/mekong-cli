"""
Pricing logic for Antigravity Algorithm.
"""
from datetime import datetime
from typing import Any, Dict

from .types import PricingContext, PricingStrategy

# Pricing table
PRICING_TABLE = {
    "agencyos_pro": {"base": 197, "enterprise": 497},
    "template": {"base": 27, "premium": 67},
    "retainer": {"ghost_cto": 3000, "advisory": 5000},
    "consulting": {"hourly": 150},
}


def calculate_price_logic(
    base_price: float,
    context: PricingContext = None,
    strategy: PricingStrategy = PricingStrategy.VIRAL_COEFFICIENT,
) -> Dict[str, Any]:
    """
    Calculate dynamic price based on context and strategy.

    Returns:
        {price, original, discount, strategy, breakdown}
    """
    price = base_price
    discount = 0.0
    breakdown = []

    # Apply strategy modifiers
    if strategy == PricingStrategy.PENETRATION:
        discount = 0.20
        breakdown.append("Penetration: -20%")
    elif strategy == PricingStrategy.VIRAL_COEFFICIENT:
        # Viral pricing: lower for sharers
        discount = 0.10
        breakdown.append("Viral coefficient: -10%")
    elif strategy == PricingStrategy.ENTERPRISE:
        # Enterprise: custom negotiation base
        price *= 1.5
        breakdown.append("Enterprise tier: +50%")

    # Apply context modifiers
    if context:
        if context.quantity > 1:
            bulk_discount = min(0.30, context.quantity * 0.05)
            discount += bulk_discount
            breakdown.append(f"Bulk ({context.quantity}): -{int(bulk_discount * 100)}%")

        if context.discount_code:
            discount += 0.10
            breakdown.append(f"Code {context.discount_code}: -10%")

    final_price = price * (1 - discount)

    return {
        "price": round(final_price, 2),
        "original": base_price,
        "discount_percent": round(discount * 100, 1),
        "strategy": strategy.value,
        "breakdown": breakdown,
        "calculated_at": datetime.now().isoformat(),
    }

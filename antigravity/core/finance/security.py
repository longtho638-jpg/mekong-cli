"""
Financial Security Utilities
=============================

Security helpers for financial operations:
- Amount validation
- Input sanitization
- Fraud detection rules
"""

import logging
import re
from decimal import Decimal
from typing import Optional

logger = logging.getLogger(__name__)


def validate_amount(amount: Decimal, min_value: Decimal = Decimal("0"), max_value: Optional[Decimal] = None) -> bool:
    """
    Validate financial amount is within acceptable range.

    Args:
        amount: Amount to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value (None = no limit)

    Returns:
        True if valid, raises ValueError if invalid
    """
    if amount < min_value:
        raise ValueError(f"Amount {amount} is below minimum {min_value}")

    if max_value and amount > max_value:
        raise ValueError(f"Amount {amount} exceeds maximum {max_value}")

    # Check for precision issues
    if abs(amount.as_tuple().exponent) > 2:
        raise ValueError(f"Amount {amount} has invalid precision (max 2 decimals)")

    return True


def sanitize_client_name(name: str) -> str:
    """
    Sanitize client name to prevent injection attacks.

    Args:
        name: Raw client name

    Returns:
        Sanitized name

    Raises:
        ValueError: If name is invalid
    """
    if not name or not name.strip():
        raise ValueError("Client name cannot be empty")

    # Remove potentially dangerous characters
    # Allow: letters, numbers, spaces, and common business characters
    sanitized = re.sub(r'[^a-zA-Z0-9\s\.\-\_\&\,\(\)]', '', name)

    if not sanitized:
        raise ValueError("Client name contains only invalid characters")

    # Limit length
    MAX_LENGTH = 200
    if len(sanitized) > MAX_LENGTH:
        logger.warning(f"Client name truncated from {len(sanitized)} to {MAX_LENGTH} chars")
        sanitized = sanitized[:MAX_LENGTH]

    return sanitized.strip()


def detect_suspicious_pricing(base_price: Decimal, discount_percentage: int, quantity: int) -> list:
    """
    Detect potentially fraudulent or suspicious pricing patterns.

    Args:
        base_price: Base price
        discount_percentage: Discount percentage
        quantity: Quantity

    Returns:
        List of warning messages (empty if no issues)
    """
    warnings = []

    # Check for extreme discounts
    if discount_percentage > 90:
        warnings.append(f"Extreme discount: {discount_percentage}% (potential pricing error)")

    # Check for unrealistic quantities
    if quantity > 10000:
        warnings.append(f"High quantity: {quantity} (verify bulk order legitimacy)")

    # Check for round-number pricing (sometimes indicates manual/fake data)
    if base_price % 100 == 0 and base_price > 1000:
        warnings.append(f"Round number pricing: ${base_price} (verify pricing calculation)")

    # Check for very low prices
    if base_price < Decimal("0.01"):
        warnings.append(f"Unusually low price: ${base_price} (potential pricing error)")

    return warnings


__all__ = ["validate_amount", "sanitize_client_name", "detect_suspicious_pricing"]

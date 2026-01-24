"""
Business rule validation logic.
"""
from typing import Any, Dict, List

from typing_extensions import TypedDict


class ValuedItemDict(TypedDict, total=False):
    """Generic item with a numeric value for validation"""
    amount: float
    price: float
    value: float


def validate_amount(amount: float, allow_zero: bool = False) -> bool:
    return amount > 0 if not allow_zero else amount >= 0


def validate_items_match_total(total: float, items: List[ValuedItemDict], key: str = "amount") -> bool:
    items_total = sum(float(item.get(key, 0)) for item in items)  # type: ignore
    return abs(items_total - total) < 0.01

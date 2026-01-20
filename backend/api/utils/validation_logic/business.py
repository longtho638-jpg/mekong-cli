"""
Business rule validation logic.
"""
from typing import Any, Dict, List


def validate_amount(amount: float, allow_zero: bool = False) -> bool:
    return amount > 0 if not allow_zero else amount >= 0

def validate_items_match_total(total: float, items: List[Dict[str, Any]], key: str = "amount") -> bool:
    items_total = sum(item.get(key, 0) for item in items)
    return abs(items_total - total) < 0.01

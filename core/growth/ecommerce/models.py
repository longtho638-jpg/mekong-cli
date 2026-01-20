"""
E-commerce Sales models and Enums.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class SaleStatus(Enum):
    CART = "cart"
    CHECKOUT = "checkout"
    PAID = "paid"

class CartStatus(Enum):
    ABANDONED = "abandoned"
    RECOVERED = "recovered"

@dataclass
class Sale:
    id: str
    store_id: str
    customer: str
    amount: float
    items_count: int
    status: SaleStatus = SaleStatus.CART
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class AbandonedCart:
    id: str
    store_id: str
    customer_email: str
    cart_value: float
    status: CartStatus = CartStatus.ABANDONED
    abandoned_at: datetime = field(default_factory=datetime.now)

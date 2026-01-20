"""
E-commerce Sales engine logic.
"""
import logging
import uuid
from typing import List

from .models import AbandonedCart, CartStatus, Sale, SaleStatus


class EcommerceEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sales: List[Sale] = []
        self.abandoned_carts: List[AbandonedCart] = []

    def record_sale(self, store_id: str, customer: str, amount: float, items: int) -> Sale:
        s = Sale(id=f"SAL-{uuid.uuid4().hex[:6].upper()}", store_id=store_id, customer=customer, amount=amount, items_count=items, status=SaleStatus.PAID)
        self.sales.append(s)
        return s

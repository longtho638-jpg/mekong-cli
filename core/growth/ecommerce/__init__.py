"""
E-commerce Sales Facade.
"""
from .engine import EcommerceEngine
from .models import AbandonedCart, CartStatus, Sale, SaleStatus


class EcommerceSales(EcommerceEngine):
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def format_dashboard(self) -> str:
        return f"💰 E-commerce Sales Dashboard - {self.agency_name}"

__all__ = ['EcommerceSales', 'SaleStatus', 'CartStatus', 'Sale', 'AbandonedCart']

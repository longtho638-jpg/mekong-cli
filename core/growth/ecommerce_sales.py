"""
💰 E-commerce Sales - Online Sales (Proxy)
====================================
This file is now a proxy for the modularized version in ./ecommerce/
Please import from core.growth.ecommerce instead.
"""
import warnings

from .ecommerce import AbandonedCart, CartStatus, EcommerceSales, Sale, SaleStatus

# Issue a deprecation warning
warnings.warn(
    "core.growth.ecommerce_sales is deprecated. "
    "Use core.growth.ecommerce instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = ['EcommerceSales', 'SaleStatus', 'CartStatus', 'Sale', 'AbandonedCart']

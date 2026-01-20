"""
RevenueEngine - Track and optimize revenue (Proxy).
==============================================
This file is now a proxy for the modularized version in ./revenue/
Please import from packages.antigravity.core.revenue instead.
"""
import warnings

from .revenue import ARR_TARGET_2026, Currency, Invoice, InvoiceStatus, RevenueEngine

# Issue a deprecation warning
warnings.warn(
    "packages.antigravity.core.revenue_engine is deprecated. "
    "Use packages.antigravity.core.revenue instead.",
    DeprecationWarning,
    stacklevel=2
)

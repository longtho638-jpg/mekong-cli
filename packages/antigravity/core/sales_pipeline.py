"""
SalesPipeline - Startup client CRM and deal tracking (Proxy)
======================================================
This file is now a proxy for the modularized version in ./sales_pipeline/
Please import from packages.antigravity.core.sales_pipeline instead.
"""
import warnings

from .sales_pipeline import DealStage, DealTier, SalesPipeline

# Issue a deprecation warning
warnings.warn(
    "packages.antigravity.core.sales_pipeline is deprecated. "
    "Use packages.antigravity.core.sales_pipeline package instead.",
    DeprecationWarning,
    stacklevel=2
)

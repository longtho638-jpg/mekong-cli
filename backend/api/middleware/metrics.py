"""
Prometheus Metrics for Agency OS (Proxy)
=====================================
This file is now a proxy for the modularized version in ./metrics_logic/
Please import from backend.api.middleware.metrics_logic instead.
"""
import warnings

from .metrics_logic import (
    record_gumroad_purchase,
    record_license_validation,
    record_user_registration,
    setup_metrics,
    update_tenant_count,
)

# Issue a deprecation warning
warnings.warn(
    "backend.api.middleware.metrics is deprecated. "
    "Use backend.api.middleware.metrics_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = ["setup_metrics", "record_gumroad_purchase", "record_user_registration", "record_license_validation", "update_tenant_count"]

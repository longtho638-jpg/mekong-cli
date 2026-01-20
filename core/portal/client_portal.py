"""
👥 Refactored Client Portal - Main Interface (Proxy)
============================================

This file is now a proxy for the modularized version in ./client_portal/
Please import from core.portal.client_portal instead.
"""
import warnings

from .client_portal import ClientPortal

# Issue a deprecation warning
warnings.warn(
    "core.portal.client_portal is deprecated. "
    "Use core.portal.client_portal instead.",
    DeprecationWarning,
    stacklevel=2
)

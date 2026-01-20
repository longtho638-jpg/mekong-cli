"""
👥 Client Portal Presentation - UI/Formatting Layer (Proxy)
====================================================

This file is now a proxy for the modularized version in ./portal/
Please import from core.presenters.portal instead.
"""
import warnings

from .portal import ClientPortalPresenter

# Issue a deprecation warning
warnings.warn(
    "core.presenters.client_portal_presenter is deprecated. "
    "Use core.presenters.portal instead.",
    DeprecationWarning,
    stacklevel=2
)

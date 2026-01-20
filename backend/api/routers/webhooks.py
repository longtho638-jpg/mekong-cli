"""
🔗 Webhooks Router - Gumroad Integration (Proxy)
=========================================
This file is now a proxy for the modularized version in ./webhooks/
Please import from backend.api.routers.webhooks instead.
"""
import warnings

from .webhooks import router

# Issue a deprecation warning
warnings.warn(
    "backend.api.routers.webhooks is deprecated. "
    "Use backend.api.routers.webhooks package instead.",
    DeprecationWarning,
    stacklevel=2
)

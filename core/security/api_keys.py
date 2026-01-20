"""
🔐 API Keys Manager (Proxy)
=========================
This file is now a proxy for the modularized version in ./keys_logic/
Please import from core.security.keys_logic instead.
"""
import warnings

from .keys_logic import APIKeysManager, IntegrationType, KeyStatus

# Issue a deprecation warning
warnings.warn(
    "core.security.api_keys is deprecated. "
    "Use core.security.keys_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)

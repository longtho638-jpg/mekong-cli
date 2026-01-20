"""
🎯 Customer Success Manager - Client Success Leadership (Proxy)
=========================================================
This file is now a proxy for the modularized version in ./success/
Please import from core.crm.success instead.
"""
import warnings

from .success import CustomerSuccessManager, EngagementLevel, QBRRecord, SuccessPlan, SuccessStage

# Issue a deprecation warning
warnings.warn(
    "core.crm.csm is deprecated. "
    "Use core.crm.success instead.",
    DeprecationWarning,
    stacklevel=2
)

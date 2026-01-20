"""
📧 Automated Outreach - Smart Email Campaigns (Proxy)
===============================================

This file is now a proxy for the modularized version in ./outreach_opt/
Please import from core.growth.outreach_opt instead.
"""
import warnings

from .outreach_opt import (
    AutomatedOutreach,
    EmailStatus,
    OutreachEmail,
    OutreachSequence,
    OutreachTrigger,
)

# Issue a deprecation warning
warnings.warn(
    "core.growth.automated_outreach is deprecated. "
    "Use core.growth.outreach_opt package instead.",
    DeprecationWarning,
    stacklevel=2
)

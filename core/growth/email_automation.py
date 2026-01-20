"""
📧 Email Automation - Nurture Clients on Autopilot (Proxy)
===================================================

This file is now a proxy for the modularized version in ./email_opt/
Please import from core.growth.email_opt instead.
"""
import warnings

from .email_opt import EmailAutomation, EmailSequence, EmailStatus, EmailTemplate, SequenceType

# Issue a deprecation warning
warnings.warn(
    "core.growth.email_automation is deprecated. "
    "Use core.growth.email_opt package instead.",
    DeprecationWarning,
    stacklevel=2
)

"""
🏥 Healthcare Marketing - Medical Client Specialist (Proxy)
=====================================================

This file is now a proxy for the modularized version in ./healthcare/
Please import from core.growth.healthcare instead.
"""
import warnings

from .healthcare import (
    CampaignType,
    ComplianceStatus,
    HealthcareCampaign,
    HealthcareClient,
    HealthcareMarketing,
    HealthcareVertical,
    HIPAAChecklist,
)

# Issue a deprecation warning
warnings.warn(
    "core.growth.healthcare_marketing is deprecated. "
    "Use core.growth.healthcare instead.",
    DeprecationWarning,
    stacklevel=2
)

"""
👋 Client Onboarding Flow - Structured Onboarding (Proxy)
===================================================
This file is now a proxy for the modularized version in ./onboarding_logic/
Please import from core.crm.onboarding_logic instead.
"""
import warnings

from .onboarding_logic import (
    ClientOnboarding,
    ClientOnboardingFlow,
    OnboardingChecklist,
    OnboardingStep,
)

# Issue a deprecation warning
warnings.warn(
    "core.crm.client_onboarding is deprecated. "
    "Use core.crm.onboarding_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

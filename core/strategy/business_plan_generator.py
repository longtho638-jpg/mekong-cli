"""
📋 Agentic Business Plan Generator (Proxy)
===================================

This file is now a proxy for the modularized version in ./plan_gen/
Please import from core.strategy.plan_gen instead.
"""
import warnings

from .plan_gen import AgencyDNA, BusinessPlanGenerator, PlanSection

# Issue a deprecation warning
warnings.warn(
    "core.strategy.business_plan_generator is deprecated. "
    "Use core.strategy.plan_gen package instead.",
    DeprecationWarning,
    stacklevel=2
)

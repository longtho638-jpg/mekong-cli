"""
Licensing Module

Handles license key validation and tier management for BizPlan Generator.
"""

from .validation import get_tier_from_key, validate_license_key

__all__ = ["validate_license_key", "get_tier_from_key"]

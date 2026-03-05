"""
Mekong CLI Library - Premium Features

ROIaaS Phase 1: RaaS License Gate
ROIaaS Phase 2: Remote Validation, Usage Metering, Key Generation
"""

from src.lib.raas_gate import (
    RaasLicenseGate,
    get_license_gate,
    require_license,
    check_license,
)
from src.lib.license_generator import (
    LicenseKeyGenerator,
    get_generator,
    generate_license,
    validate_license,
    get_tier_limits,
    TIER_LIMITS,
)
from src.lib.usage_meter import (
    UsageMeter,
    UsageRecord,
    get_meter,
    record_usage,
    get_usage_summary,
)

__all__ = [
    # Phase 1
    "RaasLicenseGate",
    "get_license_gate",
    "require_license",
    "check_license",
    # Phase 2
    "LicenseKeyGenerator",
    "get_generator",
    "generate_license",
    "validate_license",
    "get_tier_limits",
    "TIER_LIMITS",
    "UsageMeter",
    "UsageRecord",
    "get_meter",
    "record_usage",
    "get_usage_summary",
]

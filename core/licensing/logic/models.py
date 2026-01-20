"""
License format and tier enums.
"""
from enum import Enum


class LicenseFormat(Enum):
    """Supported license key formats."""
    AGENCYOS = "agencyos"
    MEKONG = "mekong"

class LicenseTier(Enum):
    """License tier levels."""
    STARTER = "starter"
    FRANCHISE = "franchise"
    PRO = "pro"
    ENTERPRISE = "enterprise"

"""
Data models for License Validation.
"""

class LicenseTier:
    """Enumeration of available license tiers."""
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

    @classmethod
    def all_tiers(cls):
        return [cls.STARTER, cls.PRO, cls.ENTERPRISE]

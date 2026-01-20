"""
License Generator Facade.
"""
from .engine import LicenseGenerator
from .models import LicenseFormat, LicenseTier

license_generator = LicenseGenerator()

def generate_license_key(tier: str = "pro", format: str = "agencyos", **kwargs) -> str:
    return license_generator.generate(format=format, tier=tier, **kwargs)

__all__ = ['LicenseFormat', 'LicenseTier', 'LicenseGenerator', 'license_generator', 'generate_license_key']

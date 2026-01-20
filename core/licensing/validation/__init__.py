"""
License Validator Facade.
"""
import hashlib
from typing import Any, Dict

from .models import LicenseTier
from .quota import QuotaManager


class LicenseValidator(QuotaManager):
    """Validates and manages Agency OS licenses locally."""
    def __init__(self):
        super().__init__()

    def activate_by_email(self, email: str, tier: str = "pro") -> Dict[str, Any]:
        hash_input = f"{email}-{tier}-agencyos"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        email_part = email.split("@")[0].replace(".", "")
        license_key = f"AGENCYOS-{tier.upper()}-{email_part}-{hash_suffix}"
        return self.activate(license_key)

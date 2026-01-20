"""
Unified license key generator engine.
"""
import hashlib
import logging
import secrets
import uuid
from datetime import datetime
from typing import Optional

from .models import LicenseFormat, LicenseTier

logger = logging.getLogger(__name__)

class LicenseGenerator:
    """ Unified license key generator. """
    TIER_PREFIXES = {
        LicenseTier.STARTER: "ST",
        LicenseTier.FRANCHISE: "FR",
        LicenseTier.PRO: "PRO",
        LicenseTier.ENTERPRISE: "EN",
    }

    def generate(
        self,
        format: str = "agencyos",
        tier: str = "pro",
        email: Optional[str] = None,
        product_id: Optional[str] = None,
    ) -> str:
        try:
            fmt = LicenseFormat(format.lower())
        except ValueError:
            raise ValueError(f"Invalid format: '{format}'")

        tier_lower = tier.lower()
        try:
            tier_enum = LicenseTier(tier_lower)
        except ValueError:
            raise ValueError(f"Invalid tier: '{tier}'")

        if fmt == LicenseFormat.AGENCYOS:
            return self._generate_agencyos(tier_enum)
        elif fmt == LicenseFormat.MEKONG:
            return self._generate_mekong(tier_lower, email, product_id)

        raise ValueError(f"Unsupported format: {format}")

    def _generate_agencyos(self, tier: LicenseTier) -> str:
        tier_prefix = self.TIER_PREFIXES[tier]
        uid = uuid.uuid4().hex[:8].upper()
        checksum = hashlib.md5(uid.encode()).hexdigest()[:4].upper()
        return f"AGOS-{tier_prefix}-{uid}-{checksum}"

    def _generate_mekong(
        self, tier: str, email: Optional[str] = None, product_id: Optional[str] = None
    ) -> str:
        if email and product_id:
            base = f"{email}:{product_id}:{secrets.token_hex(8)}"
            hash_part = hashlib.sha256(base.encode()).hexdigest()[:16]
        else:
            hash_part = hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16]

        timestamp = int(datetime.now().timestamp())
        return f"mk_live_{tier}_{hash_part}_{timestamp}"

    def validate_format(self, license_key: str) -> dict:
        if not license_key or not isinstance(license_key, str):
            return {'valid': False, 'error': 'Invalid key type'}

        license_key = license_key.strip()
        if license_key.startswith('AGOS-'):
            parts = license_key.split('-')
            if len(parts) != 4: return {'valid': False}
            tier_map = {v: k.value for k, v in self.TIER_PREFIXES.items()}
            return {'valid': True, 'format': 'agencyos', 'tier': tier_map.get(parts[1], 'unknown')}

        if license_key.startswith('mk_live_'):
            parts = license_key.split('_')
            if len(parts) < 4: return {'valid': False}
            return {'valid': True, 'format': 'mekong', 'tier': parts[2]}

        return {'valid': False}

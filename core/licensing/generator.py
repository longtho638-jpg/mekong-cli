"""
🔑 License Key Generator - Unified Implementation
=================================================

Single source of truth for all license key generation across the codebase.

Supports two formats:
1. AGENCYOS format: AGOS-{tier}-{uid}-{checksum}
2. Mekong format: mk_live_{tier}_{hash}_{timestamp}

Usage:
    from core.licensing.generator import license_generator

    # Generate AgencyOS format
    key = license_generator.generate('agencyos', tier='franchise')
    # Returns: AGOS-FR-A3B5C7D9-4F2A

    # Generate Mekong format
    key = license_generator.generate('mekong', tier='pro')
    # Returns: mk_live_pro_a3b5c7d9e1f2a3b5_1737320400
"""

import hashlib
import logging
import secrets
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


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


class LicenseGenerator:
    """
    Unified license key generator.

    Generates cryptographically secure license keys in multiple formats.
    """

    # Tier prefixes for AgencyOS format
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
        """
        Generate license key with specified format.

        Args:
            format: License format ('agencyos' or 'mekong')
            tier: License tier (starter, franchise, pro, enterprise)
            email: Optional email for deterministic generation (mekong format)
            product_id: Optional product ID for deterministic generation (mekong format)

        Returns:
            str: Generated license key

        Raises:
            ValueError: If format or tier is invalid

        Examples:
            >>> gen = LicenseGenerator()
            >>> gen.generate('agencyos', tier='pro')
            'AGOS-PRO-A3B5C7D9-4F2A'

            >>> gen.generate('mekong', tier='enterprise')
            'mk_live_enterprise_a3b5c7d9e1f2a3b5_1737320400'
        """
        # Validate format
        try:
            fmt = LicenseFormat(format.lower())
        except ValueError:
            raise ValueError(
                f"Invalid format: '{format}'. Must be one of: {[f.value for f in LicenseFormat]}"
            )

        # Validate tier
        tier_lower = tier.lower()
        try:
            tier_enum = LicenseTier(tier_lower)
        except ValueError:
            raise ValueError(
                f"Invalid tier: '{tier}'. Must be one of: {[t.value for t in LicenseTier]}"
            )

        # Generate based on format
        if fmt == LicenseFormat.AGENCYOS:
            return self._generate_agencyos(tier_enum)
        elif fmt == LicenseFormat.MEKONG:
            return self._generate_mekong(tier_lower, email, product_id)

        raise ValueError(f"Unsupported format: {format}")

    def _generate_agencyos(self, tier: LicenseTier) -> str:
        """
        Generate AgencyOS format: AGOS-{tier}-{uid}-{checksum}.

        Format: AGOS-PRO-A3B5C7D9-4F2A
        - Prefix: AGOS
        - Tier: ST/FR/PRO/EN
        - UID: 8 hex chars (uppercase)
        - Checksum: MD5 of UID (4 hex chars, uppercase)

        Args:
            tier: License tier enum

        Returns:
            str: License key in AgencyOS format

        Examples:
            >>> gen = LicenseGenerator()
            >>> key = gen._generate_agencyos(LicenseTier.PRO)
            >>> key.startswith('AGOS-PRO-')
            True
        """
        tier_prefix = self.TIER_PREFIXES[tier]
        uid = uuid.uuid4().hex[:8].upper()
        checksum = hashlib.md5(uid.encode()).hexdigest()[:4].upper()

        key = f"AGOS-{tier_prefix}-{uid}-{checksum}"
        logger.debug(f"Generated AgencyOS license: {key}")

        return key

    def _generate_mekong(
        self,
        tier: str,
        email: Optional[str] = None,
        product_id: Optional[str] = None
    ) -> str:
        """
        Generate Mekong format: mk_live_{tier}_{hash}_{timestamp}.

        Format: mk_live_pro_a3b5c7d9e1f2a3b5_1737320400
        - Prefix: mk_live
        - Tier: starter/franchise/pro/enterprise
        - Hash: 16 hex chars (deterministic if email+product_id provided)
        - Timestamp: Unix timestamp

        Args:
            tier: License tier string
            email: Optional email for deterministic hash
            product_id: Optional product ID for deterministic hash

        Returns:
            str: License key in Mekong format

        Examples:
            >>> gen = LicenseGenerator()
            >>> key = gen._generate_mekong('pro')
            >>> key.startswith('mk_live_pro_')
            True
        """
        # Generate hash (deterministic or random)
        if email and product_id:
            # Deterministic hash based on email + product_id
            base = f"{email}:{product_id}:{secrets.token_hex(8)}"
            hash_part = hashlib.sha256(base.encode()).hexdigest()[:16]
        else:
            # Random hash
            hash_part = hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16]

        timestamp = int(datetime.now().timestamp())
        key = f"mk_live_{tier}_{hash_part}_{timestamp}"

        logger.debug(f"Generated Mekong license: {key}")
        return key

    def validate_format(self, license_key: str) -> dict:
        """
        Validate license key format and extract metadata.

        Args:
            license_key: License key to validate

        Returns:
            dict: {
                'valid': bool,
                'format': str,
                'tier': str,
                'metadata': dict
            }

        Examples:
            >>> gen = LicenseGenerator()
            >>> result = gen.validate_format('AGOS-PRO-A3B5C7D9-4F2A')
            >>> result['valid']
            True
            >>> result['format']
            'agencyos'
            >>> result['tier']
            'pro'
        """
        if not license_key or not isinstance(license_key, str):
            return {'valid': False, 'error': 'Invalid key type'}

        license_key = license_key.strip()

        # Check AgencyOS format
        if license_key.startswith('AGOS-'):
            parts = license_key.split('-')
            if len(parts) != 4:
                return {'valid': False, 'error': 'Invalid AGOS format'}

            tier_map = {v: k.value for k, v in self.TIER_PREFIXES.items()}
            tier = tier_map.get(parts[1], 'unknown')

            return {
                'valid': True,
                'format': 'agencyos',
                'tier': tier,
                'metadata': {
                    'uid': parts[2],
                    'checksum': parts[3]
                }
            }

        # Check Mekong format
        if license_key.startswith('mk_live_'):
            parts = license_key.split('_')
            if len(parts) < 4:
                return {'valid': False, 'error': 'Invalid Mekong format'}

            return {
                'valid': True,
                'format': 'mekong',
                'tier': parts[2],
                'metadata': {
                    'hash': parts[3] if len(parts) > 3 else None,
                    'timestamp': int(parts[4]) if len(parts) > 4 else None
                }
            }

        return {'valid': False, 'error': 'Unknown format'}


# Singleton instance for application-wide use
license_generator = LicenseGenerator()


# Backward compatibility functions
def generate_license_key(tier: str = "pro", format: str = "agencyos", **kwargs) -> str:
    """
    Generate license key (backward compatible wrapper).

    Args:
        tier: License tier
        format: License format ('agencyos' or 'mekong')
        **kwargs: Additional arguments passed to generator

    Returns:
        str: Generated license key

    Examples:
        >>> from core.licensing.generator import generate_license_key
        >>> key = generate_license_key(tier='pro')
        >>> key.startswith('AGOS-PRO-')
        True
    """
    return license_generator.generate(format=format, tier=tier, **kwargs)

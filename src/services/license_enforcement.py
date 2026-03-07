"""
License Enforcement Service — ROIaaS Phase 8

Service for validating license status with caching and tier comparison.
Used by middleware to block requests from suspended/revoked licenses.

Features:
- License status validation (ACTIVE, SUSPENDED, REVOKED, EXPIRED, INVALID)
- Tier sufficiency checking
- LRU cache with 5-min TTL
- Database integration via raas_license_keys table
"""

import time
import logging
from enum import Enum
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone

from src.db.database import get_database, DatabaseConnection

logger = logging.getLogger("mekong.license_enforcement")


class LicenseStatus(str, Enum):
    """License status enumeration."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"
    EXPIRED = "expired"
    INVALID = "invalid"
    INSUFFICIENT_TIER = "insufficient_tier"


@dataclass
class LicenseInfo:
    """License information data class."""
    key_id: str
    tier: str
    status: str
    email: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class LicenseEnforcementService:
    """
    Service for license enforcement with caching.

    Caches license status for 5 minutes to reduce DB load.
    Provides methods for status checking and tier comparison.
    """

    # Cache TTL in seconds (5 minutes)
    CACHE_TTL = 300

    # Tier hierarchy (higher index = higher tier)
    TIER_HIERARCHY = ["free", "trial", "pro", "enterprise"]

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """
        Initialize license enforcement service.

        Args:
            db: Optional database connection (uses global if not provided)
        """
        self._db = db or get_database()
        self._cache: Dict[str, Tuple[LicenseInfo, float]] = {}

    def _cache_get(self, key: str) -> Optional[LicenseInfo]:
        """
        Get license info from cache if not expired.

        Args:
            key: Cache key (license key or key_id)

        Returns:
            LicenseInfo if found and not expired, None otherwise
        """
        if key not in self._cache:
            return None

        license_info, cached_at = self._cache[key]
        if time.time() - cached_at > self.CACHE_TTL:
            # Cache expired
            del self._cache[key]
            return None

        return license_info

    def _cache_set(self, key: str, license_info: LicenseInfo) -> None:
        """
        Set license info in cache with current timestamp.

        Args:
            key: Cache key
            license_info: License information to cache
        """
        self._cache[key] = (license_info, time.time())

    def _cache_invalidate(self, key: str) -> None:
        """
        Invalidate cached license info.

        Args:
            key: Cache key to invalidate
        """
        if key in self._cache:
            del self._cache[key]

    async def _check_license_in_db(self, license_key: str) -> Optional[LicenseInfo]:
        """
        Check license status in database.

        Args:
            license_key: License key to check

        Returns:
            LicenseInfo if found, None if not found
        """
        try:
            # Extract key_id from JWT license key if it's a JWT token
            # JWT format: raasjwt-[tier]-[jwt_token]
            # For JWT keys, we need to decode to get key_id (jti claim)
            key_id = license_key
            if license_key.startswith("raasjwt-"):
                # Import here to avoid circular dependency
                from src.lib.jwt_license_generator import validate_jwt_license
                is_valid, payload, _ = validate_jwt_license(license_key)
                if is_valid and payload:
                    key_id = payload.get("key_id", license_key)
                else:
                    # Invalid JWT - treat key_id as the license_key itself
                    pass

            # Query database for license key
            query = """
                SELECT id, key_id, tier, status, email, expires_at, created_at, updated_at
                FROM raas_license_keys
                WHERE key_id = $1 OR license_key = $2
                LIMIT 1
            """
            result = await self._db.fetch_one(query, (key_id, license_key))

            if not result:
                return None

            return LicenseInfo(
                key_id=str(result["id"]),
                tier=result["tier"],
                status=result["status"],
                email=result.get("email"),
                expires_at=result.get("expires_at"),
                created_at=result.get("created_at"),
                updated_at=result.get("updated_at"),
            )

        except Exception as e:
            logger.error(
                "license_enforcement.db_check_error",
                error=str(e),
                license_key=license_key[:8] + "..." if len(license_key) > 8 else license_key,
            )
            return None

    async def check_license_status(self, license_key: str) -> LicenseStatus:
        """
        Check license status with caching.

        Flow:
        1. Check cache (5-min TTL)
        2. If not cached, query database
        3. Cache result
        4. Return status

        Args:
            license_key: License key to check

        Returns:
            LicenseStatus enum value
        """
        # Check cache first
        cached_info = self._cache_get(license_key)
        if cached_info:
            return self._determine_status(cached_info)

        # Query database
        license_info = await self._check_license_in_db(license_key)

        if not license_info:
            # License not found in DB - check if JWT is valid
            if license_key.startswith("raasjwt-"):
                from src.lib.jwt_license_generator import validate_jwt_license
                is_valid, payload, _ = validate_jwt_license(license_key)
                if is_valid and payload:
                    # Valid JWT but not in DB - treat as ACTIVE with payload tier
                    license_info = LicenseInfo(
                        key_id=payload.get("jti", "unknown"),
                        tier=payload.get("tier", "free"),
                        status="active",
                        email=payload.get("email"),
                    )
                else:
                    return LicenseStatus.INVALID
            else:
                return LicenseStatus.INVALID

        # Cache the result
        self._cache_set(license_key, license_info)

        return self._determine_status(license_info)

    def _determine_status(self, license_info: LicenseInfo) -> LicenseStatus:
        """
        Determine license status from license info.

        Args:
            license_info: License information

        Returns:
            LicenseStatus enum value
        """
        # Check status field first
        status = license_info.status.lower() if license_info.status else "active"

        if status == "suspended":
            return LicenseStatus.SUSPENDED
        elif status == "revoked":
            return LicenseStatus.REVOKED

        # Check expiration
        if license_info.expires_at:
            now = datetime.now(timezone.utc)
            expires_at = license_info.expires_at
            # Handle timezone-aware and naive datetimes
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now > expires_at:
                return LicenseStatus.EXPIRED

        return LicenseStatus.ACTIVE

    def is_tier_sufficient(
        self,
        current_tier: str,
        required_tier: str,
    ) -> bool:
        """
        Check if current tier meets or exceeds required tier.

        Args:
            current_tier: Current license tier
            required_tier: Required tier for access

        Returns:
            True if current tier >= required tier, False otherwise
        """
        current_tier = current_tier.lower()
        required_tier = required_tier.lower()

        # Handle custom tier suffixes (e.g., "pro (custom)")
        if " (" in current_tier:
            current_tier = current_tier.split(" (")[0].strip()

        # Find tier indices
        try:
            current_index = self.TIER_HIERARCHY.index(current_tier)
        except ValueError:
            current_index = 0  # Unknown tier = free

        try:
            required_index = self.TIER_HIERARCHY.index(required_tier)
        except ValueError:
            required_index = 0  # Unknown required = free

        return current_index >= required_index

    async def get_license_info(self, license_key: str) -> Optional[LicenseInfo]:
        """
        Get full license information.

        Args:
            license_key: License key to lookup

        Returns:
            LicenseInfo if found, None otherwise
        """
        # Check cache first
        cached_info = self._cache_get(license_key)
        if cached_info:
            return cached_info

        # Query database
        license_info = await self._check_license_in_db(license_key)

        if license_info:
            self._cache_set(license_key, license_info)

        return license_info

    def clear_cache(self) -> None:
        """Clear all cached license statuses."""
        self._cache.clear()
        logger.info("license_enforcement.cache_cleared", message="License cache cleared")


# Global instance
_license_enforcement_service: Optional[LicenseEnforcementService] = None


def get_license_enforcement() -> LicenseEnforcementService:
    """Get global license enforcement service instance."""
    global _license_enforcement_service
    if _license_enforcement_service is None:
        _license_enforcement_service = LicenseEnforcementService()
    return _license_enforcement_service


async def check_license_status(license_key: str) -> LicenseStatus:
    """
    Check license status using global service.

    Args:
        license_key: License key to check

    Returns:
        LicenseStatus enum value
    """
    return await get_license_enforcement().check_license_status(license_key)


def is_tier_sufficient(current_tier: str, required_tier: str) -> bool:
    """
    Check if current tier meets required tier.

    Args:
        current_tier: Current tier
        required_tier: Required tier

    Returns:
        True if sufficient, False otherwise
    """
    return get_license_enforcement().is_tier_sufficient(current_tier, required_tier)


__all__ = [
    "LicenseStatus",
    "LicenseInfo",
    "LicenseEnforcementService",
    "get_license_enforcement",
    "check_license_status",
    "is_tier_sufficient",
]

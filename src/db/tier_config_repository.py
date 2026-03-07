"""
Tier Configuration Repository — ROIaaS Phase 6

Repository layer for tier rate limiting configuration with database operations.
"""

from typing import Optional, Dict, List, Any
from dataclasses import dataclass

from src.db.database import get_database, DatabaseConnection


@dataclass
class TierConfig:
    """Tier configuration data class."""
    id: Optional[str]
    tier: str
    preset: str
    rate_limit: int
    window_seconds: int


@dataclass
class TenantRateLimitOverride:
    """Tenant rate limit override data class."""
    id: Optional[str]
    tenant_id: str
    tier: Optional[str]
    preset: str
    custom_limit: Optional[int]
    custom_window: int
    expires_at: Optional[str]


class TierConfigRepository:
    """Repository for tier configuration operations."""

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        self._db = db or get_database()

    # ========== TIER CONFIGS ==========

    async def get_config(self, tier: str, preset: str) -> Optional[TierConfig]:
        """
        Get tier configuration from database.

        Args:
            tier: Tier name (free, trial, pro, enterprise)
            preset: Preset name (auth_login, auth_callback, etc.)

        Returns:
            TierConfig if found, None otherwise
        """
        query = """
            SELECT id, tier, preset, rate_limit, window_seconds
            FROM tier_configs
            WHERE tier = $1 AND preset = $2
        """
        result = await self._db.fetch_one(query, (tier.lower(), preset.lower()))

        if not result:
            return None

        return TierConfig(
            id=str(result["id"]),
            tier=result["tier"],
            preset=result["preset"],
            rate_limit=result["rate_limit"],
            window_seconds=result["window_seconds"],
        )

    async def update_config(
        self,
        tier: str,
        preset: str,
        rate_limit: int,
        window_seconds: Optional[int] = None,
    ) -> Optional[TierConfig]:
        """
        Update or insert tier configuration.

        Args:
            tier: Tier name
            preset: Preset name
            rate_limit: New rate limit (requests per window)
            window_seconds: Window size in seconds (default: 60)

        Returns:
            Updated TierConfig
        """
        if window_seconds is None:
            window_seconds = 60

        query = """
            INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tier, preset) DO UPDATE
            SET rate_limit = EXCLUDED.rate_limit,
                window_seconds = EXCLUDED.window_seconds,
                updated_at = NOW()
            RETURNING id, tier, preset, rate_limit, window_seconds
        """
        result = await self._db.fetch_one(
            query, (tier.lower(), preset.lower(), rate_limit, window_seconds)
        )

        if not result:
            return None

        return TierConfig(
            id=str(result["id"]),
            tier=result["tier"],
            preset=result["preset"],
            rate_limit=result["rate_limit"],
            window_seconds=result["window_seconds"],
        )

    async def get_all_configs(self) -> Dict[str, Dict[str, TierConfig]]:
        """
        Get all tier configurations.

        Returns:
            Dict mapping tier -> preset -> TierConfig
        """
        query = """
            SELECT id, tier, preset, rate_limit, window_seconds
            FROM tier_configs
            ORDER BY tier, preset
        """
        results = await self._db.fetch_all(query)

        configs: Dict[str, Dict[str, TierConfig]] = {}

        for row in results:
            tier = row["tier"]
            preset = row["preset"]

            if tier not in configs:
                configs[tier] = {}

            configs[tier][preset] = TierConfig(
                id=str(row["id"]),
                tier=tier,
                preset=preset,
                rate_limit=row["rate_limit"],
                window_seconds=row["window_seconds"],
            )

        return configs

    async def delete_config(self, tier: str, preset: str) -> bool:
        """
        Delete a tier configuration.

        Args:
            tier: Tier name
            preset: Preset name

        Returns:
            True if deleted, False if not found
        """
        query = "DELETE FROM tier_configs WHERE tier = $1 AND preset = $2"
        result = await self._db.execute(query, (tier.lower(), preset.lower()))
        return result > 0

    # ========== TENANT OVERRIDES ==========

    async def get_tenant_override(
        self,
        tenant_id: str,
        preset: str,
    ) -> Optional[TenantRateLimitOverride]:
        """
        Get tenant-specific rate limit override.

        Args:
            tenant_id: Tenant identifier (key_id or license_key)
            preset: Preset name

        Returns:
            TenantRateLimitOverride if found, None otherwise
        """
        query = """
            SELECT id, tenant_id, tier, preset, custom_limit, custom_window, expires_at
            FROM tenant_rate_limits
            WHERE tenant_id = $1 AND preset = $2
        """
        result = await self._db.fetch_one(query, (tenant_id, preset.lower()))

        if not result:
            return None

        return TenantRateLimitOverride(
            id=str(result["id"]),
            tenant_id=result["tenant_id"],
            tier=result["tier"],
            preset=result["preset"],
            custom_limit=result["custom_limit"],
            custom_window=result["custom_window"],
            expires_at=result["expires_at"],
        )

    async def set_tenant_override(
        self,
        tenant_id: str,
        preset: str,
        custom_limit: int,
        custom_window: int = 60,
        tier: Optional[str] = None,
        expires_at: Optional[str] = None,
    ) -> TenantRateLimitOverride:
        """
        Set or update tenant rate limit override.

        Args:
            tenant_id: Tenant identifier
            preset: Preset name
            custom_limit: Custom rate limit
            custom_window: Custom window in seconds (default: 60)
            tier: Optional tier override
            expires_at: Optional expiration timestamp

        Returns:
            Created/updated TenantRateLimitOverride
        """
        query = """
            INSERT INTO tenant_rate_limits (
                tenant_id, tier, preset, custom_limit, custom_window, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tenant_id, preset) DO UPDATE
            SET custom_limit = EXCLUDED.custom_limit,
                custom_window = EXCLUDED.custom_window,
                tier = EXCLUDED.tier,
                expires_at = EXCLUDED.expires_at
            RETURNING id, tenant_id, tier, preset, custom_limit, custom_window, expires_at
        """
        result = await self._db.fetch_one(
            query, (tenant_id, tier, preset.lower(), custom_limit, custom_window, expires_at)
        )

        return TenantRateLimitOverride(
            id=str(result["id"]),
            tenant_id=result["tenant_id"],
            tier=result["tier"],
            preset=result["preset"],
            custom_limit=result["custom_limit"],
            custom_window=result["custom_window"],
            expires_at=result["expires_at"],
        )

    async def delete_tenant_override(self, tenant_id: str, preset: str) -> bool:
        """
        Delete tenant rate limit override.

        Args:
            tenant_id: Tenant identifier
            preset: Preset name

        Returns:
            True if deleted, False if not found
        """
        query = "DELETE FROM tenant_rate_limits WHERE tenant_id = $1 AND preset = $2"
        result = await self._db.execute(query, (tenant_id, preset.lower()))
        return result > 0

    async def get_all_tenant_overrides(
        self,
        tenant_id: Optional[str] = None,
    ) -> List[TenantRateLimitOverride]:
        """
        Get all tenant overrides, optionally filtered by tenant.

        Args:
            tenant_id: Optional tenant ID to filter by

        Returns:
            List of TenantRateLimitOverride
        """
        if tenant_id:
            query = """
                SELECT id, tenant_id, tier, preset, custom_limit, custom_window, expires_at
                FROM tenant_rate_limits
                WHERE tenant_id = $1
                ORDER BY preset
            """
            results = await self._db.fetch_all(query, (tenant_id,))
        else:
            query = """
                SELECT id, tenant_id, tier, preset, custom_limit, custom_window, expires_at
                FROM tenant_rate_limits
                ORDER BY tenant_id, preset
            """
            results = await self._db.fetch_all(query)

        return [
            TenantRateLimitOverride(
                id=str(row["id"]),
                tenant_id=row["tenant_id"],
                tier=row["tier"],
                preset=row["preset"],
                custom_limit=row["custom_limit"],
                custom_window=row["custom_window"],
                expires_at=row["expires_at"],
            )
            for row in results
        ]

    async def cleanup_expired_overrides(self) -> int:
        """
        Remove expired tenant overrides.

        Returns:
            Number of records deleted
        """
        query = """
            DELETE FROM tenant_rate_limits
            WHERE expires_at IS NOT NULL AND expires_at < NOW()
        """
        result = await self._db.execute(query)
        return result


# Global instance
_repository: Optional[TierConfigRepository] = None


def get_repository() -> TierConfigRepository:
    """Get global repository instance."""
    global _repository
    if _repository is None:
        _repository = TierConfigRepository()
    return _repository


async def init_repository() -> TierConfigRepository:
    """Initialize repository with database connection."""
    from src.db.database import init_database
    await init_database()
    return get_repository()


__all__ = [
    "TierConfig",
    "TenantRateLimitOverride",
    "TierConfigRepository",
    "get_repository",
    "init_repository",
]

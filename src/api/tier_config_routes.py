"""
Tier Config API Routes — ROIaaS Phase 6

RESTful API endpoints for managing tier rate limit configurations and tenant overrides.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["Tier Configuration"])


# ========== Request/Response Models ==========

class RateLimitConfigResponse(BaseModel):
    """Rate limit configuration response."""
    preset: str
    rate_limit: int = Field(..., description="Requests per window")
    window_seconds: int = Field(..., description="Window size in seconds")
    burst_size: Optional[int] = Field(None, description="Token bucket burst size")


class TierConfigResponse(BaseModel):
    """Tier configuration response."""
    id: Optional[str]
    tier: str
    preset: str
    rate_limit: int
    window_seconds: int


class TierConfigsListResponse(BaseModel):
    """List of all tier configurations."""
    configs: dict[str, dict[str, TierConfigResponse]]


class UpdateTierConfigRequest(BaseModel):
    """Request to update tier configuration."""
    rate_limit: int = Field(..., gt=0, description="New rate limit (requests per window)")
    window_seconds: int = Field(60, gt=0, description="Window size in seconds")


class TenantOverrideResponse(BaseModel):
    """Tenant rate limit override response."""
    id: Optional[str]
    tenant_id: str
    tier: Optional[str]
    preset: str
    custom_limit: Optional[int]
    custom_window: int
    expires_at: Optional[str]


class TenantOverrideListResponse(BaseModel):
    """List of tenant overrides."""
    overrides: List[TenantOverrideResponse]


class CreateTenantOverrideRequest(BaseModel):
    """Request to create tenant override."""
    preset: str = Field(..., description="Preset name")
    custom_limit: int = Field(..., gt=0, description="Custom rate limit")
    custom_window: int = Field(60, gt=0, description="Custom window in seconds")
    tier: Optional[str] = Field(None, description="Optional tier override")
    expires_at: Optional[str] = Field(None, description="Optional expiration timestamp")


# ========== Tier Config Endpoints ==========

@router.get("/tier-configs", response_model=TierConfigsListResponse)
async def list_tier_configs() -> TierConfigsListResponse:
    """
    List all tier rate limit configurations.

    Returns configurations for all tiers (free, trial, pro, enterprise)
    with all presets (auth_login, auth_callback, auth_refresh, api_default).
    """
    from src.db.tier_config_repository import get_repository

    repo = get_repository()
    configs = await repo.get_all_configs()

    # Convert to response format
    result = {}
    for tier_name, presets in configs.items():
        result[tier_name] = {}
        for preset_name, config in presets.items():
            result[tier_name][preset_name] = TierConfigResponse(
                id=config.id,
                tier=config.tier,
                preset=config.preset,
                rate_limit=config.rate_limit,
                window_seconds=config.window_seconds,
            )

    return TierConfigsListResponse(configs=result)


@router.get("/tier-configs/{tier}", response_model=List[TierConfigResponse])
async def get_tier_config(tier: str) -> List[TierConfigResponse]:
    """
    Get all configurations for a specific tier.

    Args:
        tier: Tier name (free, trial, pro, enterprise)

    Returns:
        List of preset configurations for the tier
    """
    from src.db.tier_config_repository import get_repository

    repo = get_repository()
    presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]

    configs = []
    for preset in presets:
        config = await repo.get_config(tier.lower(), preset)
        if config:
            configs.append(TierConfigResponse(
                id=config.id,
                tier=config.tier,
                preset=config.preset,
                rate_limit=config.rate_limit,
                window_seconds=config.window_seconds,
            ))

    if not configs:
        # Return default configs if database has none
        from src.lib.tier_config import get_tier_config as get_default_config
        try:
            default = get_default_config(tier)
            return [
                TierConfigResponse(
                    id=None,
                    tier=tier,
                    preset="auth_login",
                    rate_limit=default.auth_login.requests_per_minute,
                    window_seconds=60,
                ),
                TierConfigResponse(
                    id=None,
                    tier=tier,
                    preset="auth_callback",
                    rate_limit=default.auth_callback.requests_per_minute,
                    window_seconds=60,
                ),
                TierConfigResponse(
                    id=None,
                    tier=tier,
                    preset="auth_refresh",
                    rate_limit=default.auth_refresh.requests_per_minute,
                    window_seconds=60,
                ),
                TierConfigResponse(
                    id=None,
                    tier=tier,
                    preset="api_default",
                    rate_limit=default.api_default.requests_per_minute,
                    window_seconds=60,
                ),
            ]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tier '{tier}' not found. Valid tiers: free, trial, pro, enterprise",
            )

    return configs


@router.put("/tier-configs/{tier}/{preset}", response_model=TierConfigResponse)
async def update_tier_config(
    tier: str,
    preset: str,
    request: UpdateTierConfigRequest,
) -> TierConfigResponse:
    """
    Update rate limit configuration for a tier preset.

    Args:
        tier: Tier name (free, trial, pro, enterprise)
        preset: Preset name (auth_login, auth_callback, auth_refresh, api_default)
        request: Update request with new rate limit and window

    Returns:
        Updated configuration
    """
    from src.db.tier_config_repository import get_repository
    from src.lib.tier_config import Tier

    # Validate tier
    valid_tiers = [t.value for t in Tier]
    if tier.lower() not in valid_tiers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier '{tier}'. Valid tiers: {valid_tiers}",
        )

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if preset.lower() not in valid_presets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid preset '{preset}'. Valid presets: {valid_presets}",
        )

    repo = get_repository()
    config = await repo.update_config(
        tier=tier.lower(),
        preset=preset.lower(),
        rate_limit=request.rate_limit,
        window_seconds=request.window_seconds,
    )

    if not config:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration",
        )

    # Invalidate cache
    from src.lib.rate_limiter_factory import invalidate_cache
    invalidate_cache(tier.lower())

    return TierConfigResponse(
        id=config.id,
        tier=config.tier,
        preset=config.preset,
        rate_limit=config.rate_limit,
        window_seconds=config.window_seconds,
    )


# ========== Tenant Override Endpoints ==========

@router.get("/tenant-overrides", response_model=TenantOverrideListResponse)
async def list_tenant_overrides(
    tenant_id: Optional[str] = None,
) -> TenantOverrideListResponse:
    """
    List all tenant rate limit overrides.

    Args:
        tenant_id: Optional filter by tenant ID

    Returns:
        List of tenant overrides
    """
    from src.db.tier_config_repository import get_repository

    repo = get_repository()
    overrides = await repo.get_all_tenant_overrides(tenant_id)

    return TenantOverrideListResponse(
        overrides=[
            TenantOverrideResponse(
                id=override.id,
                tenant_id=override.tenant_id,
                tier=override.tier,
                preset=override.preset,
                custom_limit=override.custom_limit,
                custom_window=override.custom_window,
                expires_at=override.expires_at,
            )
            for override in overrides
        ]
    )


@router.get("/tenant-overrides/{tenant_id}", response_model=TenantOverrideListResponse)
async def get_tenant_overrides(tenant_id: str) -> TenantOverrideListResponse:
    """
    Get all overrides for a specific tenant.

    Args:
        tenant_id: Tenant identifier

    Returns:
        List of overrides for the tenant
    """
    from src.db.tier_config_repository import get_repository

    repo = get_repository()
    overrides = await repo.get_all_tenant_overrides(tenant_id)

    return TenantOverrideListResponse(
        overrides=[
            TenantOverrideResponse(
                id=override.id,
                tenant_id=override.tenant_id,
                tier=override.tier,
                preset=override.preset,
                custom_limit=override.custom_limit,
                custom_window=override.custom_window,
                expires_at=override.expires_at,
            )
            for override in overrides
        ]
    )


@router.post("/tenant-overrides", response_model=TenantOverrideResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant_override(request: CreateTenantOverrideRequest) -> TenantOverrideResponse:
    """
    Create a new tenant rate limit override.

    Args:
        request: Override creation request

    Returns:
        Created override
    """
    from src.db.tier_config_repository import get_repository

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if request.preset.lower() not in valid_presets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid preset '{request.preset}'. Valid presets: {valid_presets}",
        )

    repo = get_repository()

    try:
        override = await repo.set_tenant_override(
            tenant_id=request.tenant_id if hasattr(request, 'tenant_id') else "default",
            preset=request.preset.lower(),
            custom_limit=request.custom_limit,
            custom_window=request.custom_window,
            tier=request.tier.lower() if request.tier else None,
            expires_at=request.expires_at,
        )

        return TenantOverrideResponse(
            id=override.id,
            tenant_id=override.tenant_id,
            tier=override.tier,
            preset=override.preset,
            custom_limit=override.custom_limit,
            custom_window=override.custom_window,
            expires_at=override.expires_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.delete("/tenant-overrides/{tenant_id}/{preset}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_override(tenant_id: str, preset: str) -> None:
    """
    Remove a tenant rate limit override.

    Args:
        tenant_id: Tenant identifier
        preset: Preset name
    """
    from src.db.tier_config_repository import get_repository

    # Validate preset
    valid_presets = ["auth_login", "auth_callback", "auth_refresh", "api_default"]
    if preset.lower() not in valid_presets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid preset '{preset}'. Valid presets: {valid_presets}",
        )

    repo = get_repository()
    deleted = await repo.delete_tenant_override(tenant_id, preset.lower())

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No override found for tenant '{tenant_id}' and preset '{preset}'",
        )


__all__ = ["router"]

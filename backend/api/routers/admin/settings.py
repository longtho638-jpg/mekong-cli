from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path

from backend.api.security.rbac import (
    require_admin,
    require_developer,
    require_owner,
    require_viewer,
)
from backend.api.services.admin_service import AdminService
from backend.models.admin import (
    FeatureFlag,
    FeatureFlagCreate,
    FeatureFlagUpdate,
    SystemSetting,
    SystemSettingUpdate,
)

router = APIRouter(prefix="/settings", tags=["admin-settings"])

def get_admin_service() -> AdminService:
    return AdminService()

# --- Feature Flags ---

@router.get("/feature-flags", response_model=List[FeatureFlag], dependencies=[Depends(require_viewer)])
async def list_feature_flags(
    service: AdminService = Depends(get_admin_service)
):
    """List all feature flags."""
    return service.list_feature_flags()

@router.post("/feature-flags", response_model=FeatureFlag, dependencies=[Depends(require_developer)])
async def create_feature_flag(
    flag: FeatureFlagCreate,
    service: AdminService = Depends(get_admin_service)
):
    """Create a new feature flag."""
    try:
        return service.create_feature_flag(flag)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/feature-flags/{key}", response_model=FeatureFlag, dependencies=[Depends(require_developer)])
async def update_feature_flag(
    updates: FeatureFlagUpdate,
    key: str = Path(...),
    service: AdminService = Depends(get_admin_service)
):
    """Update a feature flag."""
    try:
        return service.update_feature_flag(key, updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/feature-flags/{key}", dependencies=[Depends(require_admin)])
async def delete_feature_flag(
    key: str = Path(...),
    service: AdminService = Depends(get_admin_service)
):
    """Delete a feature flag."""
    try:
        service.delete_feature_flag(key)
        return {"status": "success", "message": f"Feature flag {key} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- System Settings ---

@router.get("", response_model=List[SystemSetting], dependencies=[Depends(require_admin)])
async def list_settings(
    service: AdminService = Depends(get_admin_service)
):
    """List system settings."""
    return service.list_settings()

@router.patch("/{key}", response_model=SystemSetting, dependencies=[Depends(require_owner)])
async def update_setting(
    updates: SystemSettingUpdate,
    key: str = Path(...),
    service: AdminService = Depends(get_admin_service),
):
    """Update a system setting (Owner only)."""
    user_id = "owner" # Placeholder, strictly specific to this function context
    try:
        return service.update_setting(key, updates, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

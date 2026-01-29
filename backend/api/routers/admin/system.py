from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from backend.api.security.rbac import require_admin, require_viewer
from backend.api.services.admin_service import AdminService

router = APIRouter(prefix="/system", tags=["admin-system"])


def get_admin_service() -> AdminService:
    return AdminService()


@router.get("/stats", dependencies=[Depends(require_viewer)])
async def get_system_stats(service: AdminService = Depends(get_admin_service)) -> Dict[str, Any]:
    """Get aggregated system statistics."""
    try:
        return await service.get_system_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rate-limit-status", dependencies=[Depends(require_admin)])
async def get_rate_limit_status(
    service: AdminService = Depends(get_admin_service),
) -> Dict[str, Any]:
    """Get current rate limit system status."""
    try:
        return await service.get_rate_limit_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache/stats", dependencies=[Depends(require_admin)])
async def get_cache_stats(service: AdminService = Depends(get_admin_service)) -> Dict[str, Any]:
    """Get cache statistics."""
    try:
        return service.get_cache_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear", dependencies=[Depends(require_admin)])
async def clear_cache(service: AdminService = Depends(get_admin_service)) -> Dict[str, Any]:
    """Clear the entire cache."""
    try:
        success = service.clear_cache()
        return {
            "success": success,
            "message": "Cache cleared successfully" if success else "Failed to clear cache",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

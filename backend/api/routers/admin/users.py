from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from backend.api.security.rbac import require_admin, require_owner, require_viewer
from backend.api.services.admin_service import AdminService
from backend.models.admin import AdminUser

router = APIRouter(prefix="/users", tags=["admin-users"])

def get_admin_service() -> AdminService:
    return AdminService()

@router.get("", dependencies=[Depends(require_viewer)])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    service: AdminService = Depends(get_admin_service)
) -> Dict[str, Any]:
    """List users with pagination."""
    try:
        return await service.list_users(page, per_page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=AdminUser, dependencies=[Depends(require_viewer)])
async def get_user(
    user_id: str = Path(...),
    service: AdminService = Depends(get_admin_service)
):
    """Get user details."""
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/{user_id}/ban", dependencies=[Depends(require_admin)])
async def ban_user(
    user_id: str = Path(...),
    duration: Optional[str] = Query(None, description="'forever', 'none', or ISO timestamp"),
    service: AdminService = Depends(get_admin_service)
):
    """Ban or unban a user."""
    try:
        service.ban_user(user_id, duration)
        return {"status": "success", "message": f"User {user_id} ban status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}/role", dependencies=[Depends(require_owner)])
async def update_user_role(
    user_id: str = Path(...),
    role: str = Query(..., description="New role"),
    service: AdminService = Depends(get_admin_service)
):
    """Update user role (Owner only)."""
    try:
        service.update_user_role(user_id, role)
        return {"status": "success", "message": f"User {user_id} role updated to {role}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import List

from fastapi import APIRouter, Depends, Query

from backend.api.security.rbac import require_admin
from backend.api.services.admin_service import AdminService
from backend.models.admin import AdminAuditLog

router = APIRouter(prefix="/audit", tags=["admin-audit"])


def get_admin_service() -> AdminService:
    return AdminService()


@router.get("", response_model=List[AdminAuditLog], dependencies=[Depends(require_admin)])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: AdminService = Depends(get_admin_service),
):
    """List system audit logs."""
    return service.get_audit_logs(limit, offset)

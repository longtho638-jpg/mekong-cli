from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.api.dependencies.database import get_db
from backend.api.schemas.audit import AuditLogSchema
from backend.api.security.rbac import require_admin
from backend.models.audit_log import AuditLog
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/logs", response_model=List[AuditLogSchema], dependencies=[Depends(require_admin)])
async def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Retrieve audit logs with filtering. Admin only.
    """
    logs = await audit_service.search_audit_logs(
        db=db,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return logs


@router.get("/export", dependencies=[Depends(require_admin)])
async def export_audit_logs(
    format: str = Query("json", regex="^(json|csv)$"),
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """
    Export audit logs to JSON or CSV.
    """
    result = await audit_service.export_logs(
        db=db, format=format, user_id=user_id, start_date=start_date, end_date=end_date
    )

    if format == "csv":
        from fastapi.responses import Response

        return Response(
            content=result,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().isoformat()}.csv"
            },
        )

    return result


@router.get("/verify", dependencies=[Depends(require_admin)])
async def verify_integrity(limit: int = 1000, db: Session = Depends(get_db)):
    """
    Verify the integrity of the audit log hash chain.
    """
    is_valid = await audit_service.verify_integrity(db, limit)
    return {"integrity_check": "passed" if is_valid else "failed", "checked_records": limit}

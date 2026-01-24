import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from typing_extensions import TypedDict

from backend.api.security.audit import audit_logger
from backend.api.security.rbac import require_admin

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditLogEntry(TypedDict):
    event: str
    user: str
    timestamp: str
    details: Dict[str, Any]


@router.get("/logs", response_model=List[AuditLogEntry], dependencies=[Depends(require_admin)])
async def get_audit_logs() -> List[AuditLogEntry]:
    """Retrieve audit logs (Mock implementation reading from file)."""
    logs: List[AuditLogEntry] = []
    log_file = audit_logger.log_dir / "audit.log"
    if log_file.exists():
        try:
            # Read last 50 lines
            with open(log_file, "r") as f:
                lines = f.readlines()
                for line in lines[-50:]:
                    # Format: 2026-01-21 10:00:00 - INFO - {"event": ...}
                    try:
                        json_part = line.split(" - INFO - ")[1]
                        logs.append(json.loads(json_part))
                    except (IndexError, json.JSONDecodeError):
                        pass
        except Exception:
            pass

    return list(reversed(logs)) # Newest first

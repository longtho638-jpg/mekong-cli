from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.api.security.rbac import require_admin
from backend.api.security.audit import audit_logger
import json

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs", dependencies=[Depends(require_admin)])
async def get_audit_logs() -> List[Dict[str, Any]]:
    """Retrieve audit logs (Mock implementation reading from file)."""
    logs = []
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
                    except IndexError:
                        pass
        except Exception:
            pass

    return list(reversed(logs)) # Newest first

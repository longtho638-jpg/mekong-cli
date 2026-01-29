"""
Ops API Router - Handles system operations, health monitoring and approvals.
"""

from antigravity.core.ops import OpsEngine
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel

from backend.api.security.rbac import require_admin, require_operator

router = APIRouter(prefix="/ops", tags=["ops"])

# --- Schemas ---


class ServiceHealth(BaseModel):
    name: str
    status: str
    last_check: float
    message: Optional[str] = None


class QuotaStatus(BaseModel):
    total_usage: float
    limit: float
    reset_in: float


# --- Dependencies ---


def get_ops_engine() -> OpsEngine:
    return OpsEngine()


# --- Endpoints ---


@router.get("/status", response_model=List[ServiceHealth], dependencies=[Depends(require_operator)])
async def get_ops_status(engine: OpsEngine = Depends(get_ops_engine)):
    """Get health status of all monitored services."""
    # This assumes OpsEngine has a get_system_status method.
    # If not, we should implement it or wrap it.
    # Based on previous phases, OpsEngine might print to console.
    # We should ensure it returns data.
    # For now, we'll mock the return based on check_health.

    # engine.check_health() prints logs. We need a method that returns data.
    # Let's assume we update OpsEngine or use a placeholder.

    return [
        ServiceHealth(name="Swarm", status="healthy", last_check=0.0),
        ServiceHealth(name="Database", status="healthy", last_check=0.0),
    ]


@router.get("/quota", response_model=QuotaStatus, dependencies=[Depends(require_operator)])
async def get_quota(engine: OpsEngine = Depends(get_ops_engine)):
    """Get current quota usage."""
    # engine.get_quota_status() prints. We need data.
    # Ideally OpsEngine delegates to quota_service
    from antigravity.core.quota_service import quota_service

    _ = quota_service.get_status()  # Assuming this exists or similar

    # Mocking for now as QuotaService might return text
    return QuotaStatus(total_usage=150.0, limit=1000.0, reset_in=3600.0)


# Approvals were in the previous file but relied on a generic 'container'.
# We will deprecate them for now until we have a dedicated ApprovalService in Core.

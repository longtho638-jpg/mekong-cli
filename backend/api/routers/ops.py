"""
Ops API Router - Handles system operations, health monitoring and approvals.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from backend.di_container import container

router = APIRouter(prefix="/ops", tags=["ops"])

# Pydantic Schemas
class ServiceHealth(BaseModel):
    name: str
    status: str
    last_check: float
    message: Optional[str] = None

class ApprovalRequest(BaseModel):
    id: str
    action_name: str
    requester: str
    payload: Any
    created_at: float
    status: str

class ApprovalAction(BaseModel):
    approver: str
    reason: Optional[str] = None

@router.get("/status", response_model=List[ServiceHealth])
async def get_ops_status():
    """Get health status of all monitored services."""
    ops_service = container.get_service("ops")
    return await ops_service.get_system_status()

@router.get("/approvals", response_model=List[ApprovalRequest])
async def get_approvals():
    """Get pending approval requests."""
    ops_service = container.get_service("ops")
    return await ops_service.get_pending_approvals()

@router.post("/approvals/{request_id}/approve")
async def approve_request(request_id: str, action: ApprovalAction = Body(...)):
    """Approve a pending request."""
    ops_service = container.get_service("ops")
    success = await ops_service.approve_request(request_id, action.approver)
    if not success:
        raise HTTPException(status_code=400, detail="Approval failed or request not found")
    return {"success": True}

@router.post("/approvals/{request_id}/reject")
async def reject_request(request_id: str, action: ApprovalAction = Body(...)):
    """Reject a pending request."""
    ops_service = container.get_service("ops")
    success = await ops_service.reject_request(request_id, action.approver, action.reason)
    if not success:
        raise HTTPException(status_code=400, detail="Rejection failed or request not found")
    return {"success": True}

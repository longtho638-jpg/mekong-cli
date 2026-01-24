"""
Ops Service - Business logic for system operations, health monitoring and approvals.
"""

import logging
from antigravity.core.ops.approval_gate import ApprovalGate, ApprovalRequest
from antigravity.core.ops.auto_healer import AutoHealer, HealthStatus
from typing import Any, Dict, List, Optional, TypedDict

logger = logging.getLogger(__name__)


class ServiceStatusDict(TypedDict):
    """Status information for a single service"""
    name: str
    status: str
    last_check: float
    message: str


class ApprovalRequestDict(TypedDict):
    """Data structure for an approval request"""
    id: str
    action_name: str
    requester: str
    payload: Any
    created_at: float
    status: str


class OpsService:
    """Service for managing system operations health and approvals."""

    def __init__(self):
        self.approval_gate = ApprovalGate()
        self.auto_healer = AutoHealer()
        self._initialize_monitoring()

    def _initialize_monitoring(self):
        """Initialize default monitoring services."""
        # In a real app, these would be discovered or configured
        self.auto_healer.register_service("Database")
        self.auto_healer.register_service("Swarm Engine")
        self.auto_healer.register_service("Payment Gateway")
        self.auto_healer.register_service("Email Service")

    async def get_system_status(self) -> List[ServiceStatusDict]:
        """Get health status of all monitored services."""
        statuses: List[ServiceStatusDict] = []
        for name, svc in self.auto_healer.services.items():
            statuses.append({
                "name": name,
                "status": svc.status.value,
                "last_check": svc.last_check * 1000,  # Frontend expects ms
                "message": svc.message
            })
        return statuses

    async def get_pending_approvals(self) -> List[ApprovalRequestDict]:
        """Get all pending approval requests."""
        requests = self.approval_gate.get_pending_requests()
        return [
            {
                "id": req.id,
                "action_name": req.action_name,
                "requester": req.requester,
                "payload": req.payload,
                "created_at": req.created_at * 1000,
                "status": req.status.value
            }
            for req in requests
        ]

    async def approve_request(self, request_id: str, approver: str) -> bool:
        """Approve a pending request."""
        logger.info(f"Approving request {request_id} by {approver}")
        return self.approval_gate.approve(request_id, approver)

    async def reject_request(self, request_id: str, approver: str, reason: Optional[str] = None) -> bool:
        """Reject a pending request."""
        logger.info(f"Rejecting request {request_id} by {approver}. Reason: {reason}")
        return self.approval_gate.reject(request_id, approver, reason)

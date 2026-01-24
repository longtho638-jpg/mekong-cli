"""
Ops Service - Business logic for system operations, health monitoring and approvals.
"""
from typing import Dict, List, Any, Optional
from antigravity.core.ops.approval_gate import ApprovalGate, ApprovalRequest
from antigravity.core.ops.auto_healer import AutoHealer, HealthStatus

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

    async def get_system_status(self) -> List[Dict[str, Any]]:
        """Get health status of all monitored services."""
        statuses = []
        for name, svc in self.auto_healer.services.items():
            statuses.append({
                "name": name,
                "status": svc.status.value,
                "last_check": svc.last_check * 1000, # Frontend expects ms
                "message": svc.message
            })
        return statuses

    async def get_pending_approvals(self) -> List[Dict[str, Any]]:
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
        return self.approval_gate.approve(request_id, approver)

    async def reject_request(self, request_id: str, approver: str, reason: Optional[str] = None) -> bool:
        """Reject a pending request."""
        return self.approval_gate.reject(request_id, approver, reason)

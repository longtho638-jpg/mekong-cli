"""
Approval Gate Middleware.
Implements Human-in-the-Loop 2.0 gates for critical actions.
"""
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

@dataclass
class ApprovalRequest:
    id: str
    action_name: str
    requester: str
    payload: Any
    created_at: float = field(default_factory=time.time)
    status: ApprovalStatus = ApprovalStatus.PENDING
    approver: Optional[str] = None
    reason: Optional[str] = None
    timeout_seconds: int = 3600 # 1 hour default

class ApprovalGate:
    """
    Manages approval requests for critical actions.
    """
    def __init__(self):
        self._requests: Dict[str, ApprovalRequest] = {}
        self._callbacks: Dict[str, Callable] = {}

    def request_approval(self, action_name: str, requester: str, payload: Any, callback: Callable = None) -> str:
        """
        Submit a request for approval.
        Returns the request ID.
        """
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        request = ApprovalRequest(
            id=request_id,
            action_name=action_name,
            requester=requester,
            payload=payload
        )
        self._requests[request_id] = request
        if callback:
            self._callbacks[request_id] = callback

        logger.info(f"🔒 Approval requested: {action_name} by {requester} (ID: {request_id})")
        # In a real system, this would trigger a notification (Slack/Email)
        return request_id

    def approve(self, request_id: str, approver: str) -> bool:
        """Approve a pending request."""
        request = self._requests.get(request_id)
        if not request:
            logger.warning(f"Approval request {request_id} not found")
            return False

        if request.status != ApprovalStatus.PENDING:
            logger.warning(f"Request {request_id} is already {request.status.value}")
            return False

        request.status = ApprovalStatus.APPROVED
        request.approver = approver
        logger.info(f"✅ Request {request_id} APPROVED by {approver}")

        # Execute callback if registered
        if request_id in self._callbacks:
            try:
                self._callbacks[request_id](request.payload)
                return True
            except Exception as e:
                logger.error(f"Error executing callback for {request_id}: {e}")
                return False

        return True

    def reject(self, request_id: str, approver: str, reason: str = None) -> bool:
        """Reject a pending request."""
        request = self._requests.get(request_id)
        if not request:
            return False

        if request.status != ApprovalStatus.PENDING:
            return False

        request.status = ApprovalStatus.REJECTED
        request.approver = approver
        request.reason = reason
        logger.info(f"❌ Request {request_id} REJECTED by {approver}: {reason}")
        return True

    def get_pending_requests(self) -> List[ApprovalRequest]:
        """Get all pending requests."""
        return [r for r in self._requests.values() if r.status == ApprovalStatus.PENDING]

    def get_request(self, request_id: str) -> Optional[ApprovalRequest]:
        """Get a specific request."""
        return self._requests.get(request_id)

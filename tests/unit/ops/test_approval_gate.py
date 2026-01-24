from antigravity.core.ops.approval_gate import ApprovalGate, ApprovalStatus

import pytest


def test_approval_flow():
    gate = ApprovalGate()

    # 1. Request Approval
    execution_flag = {"executed": False}

    def sensitive_action(payload):
        execution_flag["executed"] = True
        execution_flag["data"] = payload

    req_id = gate.request_approval(
        action_name="deploy_prod",
        requester="dev_bot",
        payload={"version": "1.0.0"},
        callback=sensitive_action
    )

    # Verify Pending
    req = gate.get_request(req_id)
    assert req is not None
    assert req.status == ApprovalStatus.PENDING
    assert not execution_flag["executed"]

    # 2. Approve
    success = gate.approve(req_id, approver="admin_user")

    # Verify Execution
    assert success is True
    assert req.status == ApprovalStatus.APPROVED
    assert req.approver == "admin_user"
    assert execution_flag["executed"] is True
    assert execution_flag["data"] == {"version": "1.0.0"}

    # Test already approved
    success_again = gate.approve(req_id, "admin_user")
    assert success_again is False

def test_approval_not_found():
    gate = ApprovalGate()
    assert gate.approve("non_existent", "admin") is False
    assert gate.reject("non_existent", "admin") is False
    assert gate.get_request("non_existent") is None

def test_callback_error():
    gate = ApprovalGate()

    def failing_callback(payload):
        raise ValueError("Callback failed")

    req_id = gate.request_approval("test", "user", {}, callback=failing_callback)
    success = gate.approve(req_id, "admin")
    assert success is False

def test_rejection_flow():
    gate = ApprovalGate()
    execution_flag = {"executed": False}

    def sensitive_action(payload):
        execution_flag["executed"] = True

    req_id = gate.request_approval("delete_db", "hacker", {}, callback=sensitive_action)

    # Verify pending in list
    pending = gate.get_pending_requests()
    assert len(pending) == 1
    assert pending[0].id == req_id

    # Reject
    gate.reject(req_id, "admin_user", "Too dangerous")

    req = gate.get_request(req_id)
    assert req.status == ApprovalStatus.REJECTED
    assert not execution_flag["executed"]

    # Test already rejected
    assert gate.reject(req_id, "admin", "Again") is False
    assert gate.approve(req_id, "admin") is False
    assert len(gate.get_pending_requests()) == 0

if __name__ == "__main__":
    test_approval_flow()
    test_rejection_flow()

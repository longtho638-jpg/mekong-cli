"""
AgentOps Executor - Logic for executing ops actions
"""

from backend.models.agentops import OpsExecuteRequest, OpsExecuteResponse


class OpsExecutor:
    """Handles the execution of AgentOps commands."""

    def __init__(self, registry):
        self.registry = registry

    async def execute_ops(self, request: OpsExecuteRequest) -> OpsExecuteResponse:
        """Execute an AgentOps action"""
        ops_registry = self.registry.get_registry()
        if request.category not in ops_registry:
            raise ValueError(f"Unknown ops: {request.category}")

        ops = ops_registry[request.category]

        # Simulated execution - in production would call actual agent
        return OpsExecuteResponse(
            category=request.category,
            action=request.action,
            success=True,
            result={
                "ops": ops.name,
                "action": request.action,
                "params": request.params,
                "message": f"Executed {request.action} on {ops.name}",
            },
        )

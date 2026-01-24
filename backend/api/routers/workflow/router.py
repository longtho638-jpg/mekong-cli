import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing_extensions import TypedDict

router = APIRouter(prefix="/workflow", tags=["workflow"])


class WorkflowNodeDict(TypedDict):
    id: str
    type: str
    config: Dict[str, Any]
    next_nodes: List[str]
    position: Dict[str, float]


class WorkflowDict(TypedDict):
    id: str
    name: str
    trigger: str
    trigger_config: Dict[str, Any]
    nodes: List[WorkflowNodeDict]
    active: bool


class WorkflowNode(BaseModel):
    id: str
    type: str
    config: Dict[str, Any]
    next_nodes: List[str]
    position: Dict[str, float]  # For UI coordinates


class Workflow(BaseModel):
    id: str
    name: str
    trigger: str
    trigger_config: Dict[str, Any]
    nodes: List[WorkflowNode]
    active: bool


class WorkflowListResponse(BaseModel):
    workflows: List[Workflow]


@router.get("/list", response_model=List[WorkflowDict])
async def list_workflows():
    """List all workflows."""
    from antigravity.mcp_servers.workflow_server.handlers import WorkflowEngineHandler
    handler = WorkflowEngineHandler()
    return handler.list_workflows()  # type: ignore

@router.post("/create")
async def create_workflow(name: str, trigger_type: str):
    """Create a new workflow."""
    from antigravity.mcp_servers.workflow_server.handlers import WorkflowEngineHandler
    handler = WorkflowEngineHandler()
    return handler.create_workflow(name, trigger_type)

@router.post("/{workflow_id}/save")
async def save_workflow(workflow_id: str, workflow: Workflow):
    """Save a workflow definition."""
    # Convert Pydantic model to dict/dataclass expected by handler
    # Note: Handler expects Workflow dataclass, we might need adapter
    from antigravity.mcp_servers.workflow_server.handlers import (
        ActionType,
        TriggerType,
        WorkflowEngineHandler,
    )
    from antigravity.mcp_servers.workflow_server.handlers import Workflow as HandlerWorkflow
    from antigravity.mcp_servers.workflow_server.handlers import WorkflowNode as HandlerNode

    handler = WorkflowEngineHandler()

    # Map nodes
    nodes = []
    for n in workflow.nodes:
        # Convert type string to enum
        try:
            action_type = ActionType(n.type)
        except ValueError:
            # Fallback or error handling
            action_type = ActionType.API_CALL

        nodes.append(HandlerNode(
            id=n.id,
            type=action_type,
            config=n.config,
            next_nodes=n.next_nodes
        ))

    try:
        trigger = TriggerType(workflow.trigger)
    except ValueError:
        trigger = TriggerType.MANUAL

    handler_wf = HandlerWorkflow(
        id=workflow.id,
        name=workflow.name,
        trigger=trigger,
        trigger_config=workflow.trigger_config,
        nodes=nodes,
        active=workflow.active
    )

    return handler.save_workflow(handler_wf)

@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str):
    """Execute a workflow manually."""
    from antigravity.mcp_servers.workflow_server.handlers import WorkflowEngineHandler
    handler = WorkflowEngineHandler()
    return handler.execute_workflow(workflow_id)

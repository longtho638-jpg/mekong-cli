"""
Swarm Graph Engine.
Handles Directed Acyclic Graph (DAG) execution for complex agent workflows.
"""
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set

from typing_extensions import TypedDict, Union

from .engine import AgentSwarm
from .enums import TaskPriority, TaskStatus
from .models import SwarmTask

logger = logging.getLogger(__name__)


class NodePayload(TypedDict, total=False):
    """Structured payload for graph nodes"""
    use_output_from: str
    input_data: Any
    params: Dict[str, Any]


@dataclass
class GraphNode:
    """A node in the execution graph."""
    id: str
    task_name: str
    payload: Union[NodePayload, Dict[str, Any], Any]
    agent_role: str = "worker" # Preferred role
    dependencies: List[str] = field(default_factory=list) # IDs of nodes that must complete first
    priority: TaskPriority = TaskPriority.NORMAL

    # Runtime state
    task_id: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: Optional[str] = None

@dataclass
class GraphWorkflow:
    """A complete DAG workflow."""
    id: str
    name: str
    nodes: Dict[str, GraphNode] = field(default_factory=dict)

    def add_node(self, node: GraphNode):
        self.nodes[node.id] = node

    def add_dependency(self, node_id: str, depends_on_id: str):
        if node_id in self.nodes and depends_on_id in self.nodes:
            self.nodes[node_id].dependencies.append(depends_on_id)
        else:
            raise ValueError("Node not found")

class GraphExecutor:
    """Executes a GraphWorkflow using an AgentSwarm."""

    def __init__(self, swarm: AgentSwarm):
        self.swarm = swarm
        self._running_workflows: Dict[str, GraphWorkflow] = {}

    def execute_workflow(self, workflow: GraphWorkflow) -> str:
        """Start executing a workflow."""
        logger.info(f"Starting workflow execution: {workflow.name} ({workflow.id})")
        self._running_workflows[workflow.id] = workflow

        # Start execution loop in background
        self.swarm._executor.submit(self._run_workflow_loop, workflow)
        return workflow.id

    def _run_workflow_loop(self, workflow: GraphWorkflow):
        """Main loop for checking dependencies and submitting tasks."""
        completed_nodes: Set[str] = set()
        failed_nodes: Set[str] = set()
        running_nodes: Set[str] = set()

        while len(completed_nodes) + len(failed_nodes) < len(workflow.nodes):
            # Check for completed tasks
            for node_id in list(running_nodes):
                node = workflow.nodes[node_id]
                if node.task_id:
                    result = self.swarm.task_manager.get_task_result(node.task_id, wait=False)
                    task = self.swarm.task_manager.get_task(node.task_id)

                    if task and task.status == TaskStatus.COMPLETED:
                        node.status = TaskStatus.COMPLETED
                        node.result = result
                        completed_nodes.add(node_id)
                        running_nodes.remove(node_id)
                        logger.info(f"Node {node_id} completed")

                    elif task and task.status == TaskStatus.FAILED:
                        node.status = TaskStatus.FAILED
                        node.error = task.error
                        failed_nodes.add(node_id)
                        running_nodes.remove(node_id)
                        logger.error(f"Node {node_id} failed: {task.error}")
                        # In a real DAG engine, we might cancel dependent nodes here

            # Find executable nodes
            for node in workflow.nodes.values():
                if node.id in completed_nodes or node.id in failed_nodes or node.id in running_nodes:
                    continue

                # Check dependencies
                deps_met = all(dep in completed_nodes for dep in node.dependencies)
                if deps_met:
                    # Submit task
                    task_id = self.swarm.submit_task(
                        name=f"[{workflow.name}] {node.task_name}",
                        payload=self._resolve_payload(node, workflow),
                        priority=node.priority
                    )
                    node.task_id = task_id
                    node.status = TaskStatus.RUNNING # Technically 'SUBMITTED' until picked up
                    running_nodes.add(node.id)
                    logger.info(f"Node {node.id} submitted as task {task_id}")

            # Prevent busy loop
            import time
            time.sleep(0.5)

        logger.info(f"Workflow {workflow.name} finished. Completed: {len(completed_nodes)}, Failed: {len(failed_nodes)}")

    def _resolve_payload(self, node: GraphNode, workflow: GraphWorkflow) -> Any:
        """
        Resolve payload potentially using results from dependencies.
        Simple implementation: if payload is a dict with 'use_output_from', inject result.
        """
        payload = node.payload
        if isinstance(payload, dict) and "use_output_from" in payload:
            dep_id = payload["use_output_from"]
            if dep_id in workflow.nodes:
                # Inject output into 'input_data' or similar
                payload["input_data"] = workflow.nodes[dep_id].result
        return payload

"""
Automation Engine core logic.
"""
import logging
import uuid
from typing import Dict, List

from .models import Action, ActionType, TriggerType, Workflow

logger = logging.getLogger(__name__)

class AutomationEngineBase:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, Workflow] = {}

    def create_workflow(
        self, name: str, description: str, trigger: TriggerType, actions: List[Action]
    ) -> Workflow:
        """Create and register a new workflow."""
        if not name:
            raise ValueError("Workflow name required")

        workflow = Workflow(
            id=f"WF-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            trigger=trigger,
            actions=actions,
        )

        self.workflows[workflow.id] = workflow
        logger.info(f"Workflow created: {name} (Trigger: {trigger.value})")
        return workflow

    def run_workflow(self, workflow_id: str) -> List[str]:
        """Simulate workflow execution."""
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return ["Error: Workflow not found"]

        if not workflow.enabled:
            return [f"Workflow {workflow.name} is disabled"]

        workflow.runs += 1
        logger.info(f"Executing workflow: {workflow.name} (Run #{workflow.runs})")

        results = []
        for action in workflow.actions:
            delay_text = f" (+{action.delay_hours}h delay)" if action.delay_hours > 0 else ""
            status_msg = f"✅ {action.type.value}: {list(action.config.keys())}{delay_text}"
            results.append(status_msg)
            logger.debug(f"Action triggered: {action.type.value}")

        return results

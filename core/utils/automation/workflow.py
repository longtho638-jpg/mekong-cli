"""
Workflow management and execution logic.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict

from .models import AutomationWorkflow, DataSource, TriggerType, WorkflowStatus

logger = logging.getLogger(__name__)

class WorkflowManager:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, AutomationWorkflow] = {}

    def create_workflow(
        self, name: str, source: DataSource, destination: DataSource, trigger: TriggerType
    ) -> AutomationWorkflow:
        """Register a new automated data workflow."""
        if not name:
            raise ValueError("Workflow name required")

        workflow = AutomationWorkflow(
            id=f"WFL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            source=source,
            destination=destination,
            trigger=trigger,
        )
        self.workflows[workflow.id] = workflow
        logger.info(f"Workflow created: {name} ({source.value} -> {destination.value})")
        return workflow

    def execute_workflow(self, workflow_id: str, records: int, errors: int = 0) -> bool:
        """Simulate execution of a specific workflow."""
        if workflow_id not in self.workflows:
            return False

        w = self.workflows[workflow_id]
        w.runs_count += 1
        w.records_processed += max(0, records)
        w.error_count += max(0, errors)
        w.last_run = datetime.now()

        if errors > 0:
            w.status = WorkflowStatus.ERROR
            logger.error(f"Workflow {w.name} finished with {errors} errors")
        else:
            logger.info(f"Workflow {w.name} processed {records} records successfully")
        return True

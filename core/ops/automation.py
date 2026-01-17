"""
⚙️ Automation Workflows - Streamline Your Agency
==================================================

Automate repetitive agency tasks.
Work smarter, not harder!

Features:
- Pre-built workflow templates
- Trigger-action automation
- Task automation
- Notification workflows
"""

import uuid
import logging
from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TriggerType(Enum):
    """Automation trigger types."""
    NEW_CLIENT = "new_client"
    NEW_PROJECT = "new_project"
    INVOICE_DUE = "invoice_due"
    MILESTONE_COMPLETE = "milestone_complete"
    FEEDBACK_RECEIVED = "feedback_received"
    MEETING_SCHEDULED = "meeting_scheduled"


class ActionType(Enum):
    """Automation action types."""
    SEND_EMAIL = "send_email"
    CREATE_TASK = "create_task"
    SEND_NOTIFICATION = "send_notification"
    UPDATE_STATUS = "update_status"
    ASSIGN_TEAM = "assign_team"


@dataclass
class Action:
    """An automation action entity."""
    type: ActionType
    config: Dict[str, Any]
    delay_hours: int = 0

    def __post_init__(self):
        if self.delay_hours < 0:
            raise ValueError("Delay hours cannot be negative")


@dataclass
class Workflow:
    """An automation workflow entity."""
    id: str
    name: str
    description: str
    trigger: TriggerType
    actions: List[Action]
    enabled: bool = True
    runs: int = 0
    created_at: datetime = field(default_factory=datetime.now)


class AutomationEngine:
    """
    Automation Engine System.
    
    Orchestrates workflows triggered by agency events.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, Workflow] = {}
        logger.info(f"Automation Engine initialized for {agency_name}")
        self._create_default_workflows()

    def _create_default_workflows(self):
        """Pre-configure common agency workflows."""

        # New client onboarding
        self.create_workflow(
            name="New Client Onboarding",
            description="Welcome new clients and set up their project",
            trigger=TriggerType.NEW_CLIENT,
            actions=[
                Action(ActionType.SEND_EMAIL, {"template": "welcome_email", "to": "client"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Schedule kickoff call", "assign": "account_manager"}, 0),
                Action(ActionType.SEND_NOTIFICATION, {"message": "New client onboarded!", "channel": "slack"}, 0),
            ]
        )

        # Invoice reminder
        self.create_workflow(
            name="Invoice Reminder",
            description="Send reminders for unpaid invoices",
            trigger=TriggerType.INVOICE_DUE,
            actions=[
                Action(ActionType.SEND_EMAIL, {"template": "invoice_reminder", "to": "client"}, 0),
                Action(ActionType.SEND_NOTIFICATION, {"message": "Invoice overdue!", "channel": "email"}, 72),
            ]
        )

        # Milestone celebration
        self.create_workflow(
            name="Milestone Celebration",
            description="Celebrate and notify when milestones are completed",
            trigger=TriggerType.MILESTONE_COMPLETE,
            actions=[
                Action(ActionType.SEND_NOTIFICATION, {"message": "Milestone completed! 🎉", "channel": "slack"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Review milestone", "assign": "pm"}, 0),
            ]
        )

    def create_workflow(
        self,
        name: str,
        description: str,
        trigger: TriggerType,
        actions: List[Action]
    ) -> Workflow:
        """Create and register a new workflow."""
        if not name:
            raise ValueError("Workflow name required")

        workflow = Workflow(
            id=f"WF-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            trigger=trigger,
            actions=actions
        )

        self.workflows[workflow.id] = workflow
        logger.info(f"Workflow created: {name} (Trigger: {trigger.value})")
        return workflow

    def run_workflow(self, workflow_id: str) -> List[str]:
        """
        Simulate workflow execution.
        In production, this would dispatch tasks to a queue.
        """
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            logger.error(f"Workflow {workflow_id} not found")
            return ["Error: Workflow not found"]

        if not workflow.enabled:
            logger.warning(f"Workflow {workflow.name} is disabled")
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

    def format_dashboard(self) -> str:
        """Render Automation Dashboard."""
        active_count = sum(1 for w in self.workflows.values() if w.enabled)
        total_runs = sum(w.runs for w in self.workflows.values())

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ AUTOMATION DASHBOARD{' ' * 35}║",
            f"║  {len(self.workflows)} workflows │ {active_count} active │ {total_runs} total runs{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Workflow              │ Trigger        │ Actions │ Runs  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        # Display top 5 workflows
        for w in list(self.workflows.values())[:5]:
            name_display = (w.name[:20] + '..') if len(w.name) > 22 else w.name
            trigger_display = w.trigger.value[:14]
            status_icon = "🟢" if w.enabled else "🔴"

            lines.append(f"║  {status_icon} {name_display:<20} │ {trigger_display:<14} │ {len(w.actions):>7} │ {w.runs:>4}  ║")

        lines.extend([
            "║                                                           ║",
            "║  💡 Automations save 10+ hours/week!                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Efficiency!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("⚙️ Initializing Automation Engine...")
    print("=" * 60)

    try:
        engine = AutomationEngine("Saigon Digital Hub")

        # Simulate running a workflow
        workflow = list(engine.workflows.values())[0]
        engine.run_workflow(workflow.id)

        print("\n" + engine.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")

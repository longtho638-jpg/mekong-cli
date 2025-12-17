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

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


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
    """An automation action."""
    type: ActionType
    config: Dict[str, Any]
    delay_hours: int = 0


@dataclass
class Workflow:
    """An automation workflow."""
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
    Automation Engine.
    
    Automate repetitive agency tasks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, Workflow] = {}
        
        # Pre-build common workflows
        self._create_default_workflows()
    
    def _create_default_workflows(self):
        """Create default automation workflows."""
        
        # New client onboarding
        self.create_workflow(
            name="New Client Onboarding",
            description="Welcome new clients and set up their project",
            trigger=TriggerType.NEW_CLIENT,
            actions=[
                Action(ActionType.SEND_EMAIL, {"template": "welcome_email", "to": "client"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Schedule kickoff call", "assign": "account_manager"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Collect brand assets", "assign": "designer"}, 24),
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
                Action(ActionType.SEND_EMAIL, {"template": "milestone_update", "to": "client"}, 0),
                Action(ActionType.SEND_NOTIFICATION, {"message": "Milestone completed! 🎉", "channel": "slack"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Review milestone with client", "assign": "project_manager"}, 0),
            ]
        )
        
        # Feedback follow-up
        self.create_workflow(
            name="Feedback Follow-up",
            description="Follow up on client feedback",
            trigger=TriggerType.FEEDBACK_RECEIVED,
            actions=[
                Action(ActionType.SEND_EMAIL, {"template": "thank_you_feedback", "to": "client"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Review feedback and action items", "assign": "owner"}, 0),
            ]
        )
        
        # Meeting prep
        self.create_workflow(
            name="Meeting Preparation",
            description="Prepare for scheduled client meetings",
            trigger=TriggerType.MEETING_SCHEDULED,
            actions=[
                Action(ActionType.CREATE_TASK, {"title": "Prepare meeting agenda", "assign": "account_manager"}, 0),
                Action(ActionType.SEND_NOTIFICATION, {"message": "Meeting scheduled - prep needed", "channel": "slack"}, 0),
            ]
        )
    
    def create_workflow(
        self,
        name: str,
        description: str,
        trigger: TriggerType,
        actions: List[Action]
    ) -> Workflow:
        """Create a new workflow."""
        workflow = Workflow(
            id=f"WF-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            trigger=trigger,
            actions=actions
        )
        
        self.workflows[workflow.id] = workflow
        return workflow
    
    def run_workflow(self, workflow_id: str) -> List[str]:
        """Simulate running a workflow."""
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            return ["Workflow not found"]
        
        workflow.runs += 1
        results = []
        
        for action in workflow.actions:
            delay_text = f" (after {action.delay_hours}h)" if action.delay_hours > 0 else ""
            results.append(f"✅ {action.type.value}: {action.config}{delay_text}")
        
        return results
    
    def format_workflow(self, workflow: Workflow) -> str:
        """Format workflow details."""
        trigger_icons = {
            TriggerType.NEW_CLIENT: "👤",
            TriggerType.NEW_PROJECT: "📋",
            TriggerType.INVOICE_DUE: "💳",
            TriggerType.MILESTONE_COMPLETE: "🎯",
            TriggerType.FEEDBACK_RECEIVED: "💬",
            TriggerType.MEETING_SCHEDULED: "📅"
        }
        
        action_icons = {
            ActionType.SEND_EMAIL: "📧",
            ActionType.CREATE_TASK: "✅",
            ActionType.SEND_NOTIFICATION: "🔔",
            ActionType.UPDATE_STATUS: "🔄",
            ActionType.ASSIGN_TEAM: "👥"
        }
        
        status = "🟢 Active" if workflow.enabled else "🔴 Disabled"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ {workflow.name.upper()[:48]:<48}  ║",
            f"║  {workflow.description[:53]:<53}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🎯 Trigger: {trigger_icons[workflow.trigger]} {workflow.trigger.value:<37}  ║",
            f"║  Status: {status:<44}  ║",
            f"║  Runs: {workflow.runs:<46}  ║",
            "║                                                           ║",
            "║  📋 ACTIONS:                                              ║",
        ]
        
        for i, action in enumerate(workflow.actions, 1):
            icon = action_icons[action.type]
            delay = f"(+{action.delay_hours}h)" if action.delay_hours > 0 else ""
            lines.append(f"║    {i}. {icon} {action.type.value:<20} {delay:<14}  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_dashboard(self) -> str:
        """Format automation dashboard."""
        active = sum(1 for w in self.workflows.values() if w.enabled)
        total_runs = sum(w.runs for w in self.workflows.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ AUTOMATION DASHBOARD                                  ║",
            f"║  {len(self.workflows)} workflows | {active} active | {total_runs} total runs          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Workflow              │ Trigger        │ Actions │ Runs ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for workflow in list(self.workflows.values())[:5]:
            name = workflow.name[:20]
            trigger = workflow.trigger.value[:14]
            actions = len(workflow.actions)
            runs = workflow.runs
            
            lines.append(f"║  {name:<20} │ {trigger:<14} │ {actions:>7} │ {runs:>4} ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 Automations save 10+ hours/week!                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Work smarter, not harder!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    engine = AutomationEngine("Saigon Digital Hub")
    
    print("⚙️ Automation Workflows")
    print("=" * 60)
    print()
    
    print(engine.format_dashboard())
    print()
    
    # Show a workflow
    workflow = list(engine.workflows.values())[0]
    print(engine.format_workflow(workflow))
    print()
    
    # Simulate running
    print("🔄 Simulating workflow run:")
    results = engine.run_workflow(workflow.id)
    for result in results:
        print(f"   {result}")

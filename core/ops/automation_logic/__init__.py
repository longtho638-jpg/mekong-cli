"""
Automation Engine Facade and Dashboard.
"""
import logging

from .engine import AutomationEngineBase
from .models import Action, ActionType, TriggerType, Workflow

logger = logging.getLogger(__name__)

class AutomationEngine(AutomationEngineBase):
    """
    Automation Engine System.
    Orchestrates workflows triggered by agency events.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Automation Engine initialized for {agency_name}")
        self._create_default_workflows()

    def _create_default_workflows(self):
        """Pre-configure common agency workflows."""
        self.create_workflow(
            name="New Client Onboarding", description="Welcome new clients",
            trigger=TriggerType.NEW_CLIENT,
            actions=[
                Action(ActionType.SEND_EMAIL, {"template": "welcome", "to": "client"}, 0),
                Action(ActionType.CREATE_TASK, {"title": "Schedule kickoff"}, 0),
            ],
        )

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
        for w in list(self.workflows.values())[:5]:
            lines.append(f"║  {'🟢' if w.enabled else '🔴'} {w.name[:20]:<20} │ {w.trigger.value[:14]:<14} │ {len(w.actions):>7} │ {w.runs:>4}  ║")
        lines.extend(["║                                                           ║", "╠═══════════════════════════════════════════════════════════╣", f"║  Castle {self.agency_name[:40]:<40} - Efficiency!          ║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)

"""
👋 Onboarding Specialist - Client Onboarding Expert
=====================================================

Streamlined client onboarding process.
First impressions that last!

Roles:
- Welcome & orientation
- Account setup
- Training delivery
- Handoff to success team
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OnboardingPhase(Enum):
    """Phases of the client onboarding lifecycle."""
    WELCOME = "welcome"
    DISCOVERY = "discovery"
    SETUP = "setup"
    TRAINING = "training"
    HANDOFF = "handoff"
    COMPLETE = "complete"


class TaskPriority(Enum):
    """Urgency levels for individual onboarding tasks."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class OnboardingTask:
    """An individual onboarding task entity."""
    id: str
    name: str
    phase: OnboardingPhase
    priority: TaskPriority
    due_day: int
    completed: bool = False
    completed_at: Optional[datetime] = None


@dataclass
class ClientOnboardingRecord:
    """A comprehensive onboarding project for a specific client."""
    id: str
    client_name: str
    specialist: str
    start_date: datetime
    current_phase: OnboardingPhase
    tasks: List[OnboardingTask]
    satisfaction_score: Optional[int] = None

    def __post_init__(self):
        if not self.client_name:
            raise ValueError("Client name is required")


class OnboardingSpecialist:
    """
    Onboarding Specialist System.
    
    Orchestrates the new client setup journey through phased task management and tracking.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.onboardings: Dict[str, ClientOnboardingRecord] = {}
        logger.info(f"Onboarding Specialist system initialized for {agency_name}")
    
    def _get_standard_tasks(self) -> List[OnboardingTask]:
        """Generate the blueprint of tasks for every new client."""
        return [
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Welcome Email", OnboardingPhase.WELCOME, TaskPriority.HIGH, 0),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Discovery Call", OnboardingPhase.DISCOVERY, TaskPriority.HIGH, 3),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Account Setup", OnboardingPhase.SETUP, TaskPriority.MEDIUM, 7),
        ]
    
    def start_onboarding(
        self,
        client_name: str,
        specialist: str = "Expert AI"
    ) -> ClientOnboardingRecord:
        """Initialize a new onboarding project."""
        record = ClientOnboardingRecord(
            id=f"ONB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name, specialist=specialist,
            start_date=datetime.now(),
            current_phase=OnboardingPhase.WELCOME,
            tasks=self._get_standard_tasks()
        )
        self.onboardings[record.id] = record
        logger.info(f"Onboarding started: {client_name} ({record.id})")
        return record
    
    def complete_task(self, onb_id: str, task_id: str) -> bool:
        """Mark a specific task as finished and re-evaluate phase."""
        if onb_id not in self.onboardings: return False
        
        record = self.onboardings[onb_id]
        for t in record.tasks:
            if t.id == task_id:
                t.completed = True
                t.completed_at = datetime.now()
                logger.info(f"Task '{t.name}' completed for {record.client_name}")
                self._sync_phase(record)
                return True
        return False
    
    def _sync_phase(self, record: ClientOnboardingRecord):
        """Update current phase based on remaining open tasks."""
        for phase in list(OnboardingPhase)[:-1]:
            tasks = [t for t in record.tasks if t.phase == phase]
            if any(not t.completed for t in tasks):
                record.current_phase = phase
                return
        record.current_phase = OnboardingPhase.COMPLETE
    
    def format_dashboard(self) -> str:
        """Render the Onboarding Dashboard."""
        active = [o for o in self.onboardings.values() if o.current_phase != OnboardingPhase.COMPLETE]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 ONBOARDING SPECIALIST DASHBOARD{' ' * 27}║",
            f"║  {len(self.onboardings)} projects │ {len(active)} active onboarding flows{' ' * 16}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE ONBOARDINGS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for o in active[:5]:
            done = sum(1 for t in o.tasks if t.completed)
            pct = (done / len(o.tasks)) * 100 if o.tasks else 0
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            lines.append(f"║  👋 {o.client_name[:18]:<18} │ {bar} │ {pct:>3.0f}% phase: {o.current_phase.value:<8}║")
            
        lines.extend([
            "║                                                           ║",
            "║  [✅ Complete Task]  [📋 Workflow]  [📊 Retention]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - First Impression! ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👋 Initializing Onboarding System...")
    print("=" * 60)
    
    try:
        specialist = OnboardingSpecialist("Saigon Digital Hub")
        # Seed
        o = specialist.start_onboarding("Acme Corp")
        specialist.complete_task(o.id, o.tasks[0].id)
        
        print("\n" + specialist.format_dashboard())
        
    except Exception as e:
        logger.error(f"Onboarding Error: {e}")

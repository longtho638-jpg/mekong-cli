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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class OnboardingPhase(Enum):
    """Onboarding phases."""
    WELCOME = "welcome"
    DISCOVERY = "discovery"
    SETUP = "setup"
    TRAINING = "training"
    HANDOFF = "handoff"
    COMPLETE = "complete"


class TaskPriority(Enum):
    """Task priority."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class OnboardingTask:
    """An onboarding task."""
    id: str
    name: str
    phase: OnboardingPhase
    priority: TaskPriority
    due_day: int
    completed: bool = False
    completed_at: Optional[datetime] = None


@dataclass
class ClientOnboardingRecord:
    """Client onboarding record."""
    id: str
    client_name: str
    specialist: str
    start_date: datetime
    current_phase: OnboardingPhase
    tasks: List[OnboardingTask]
    satisfaction_score: Optional[int] = None


class OnboardingSpecialist:
    """
    Onboarding Specialist System.
    
    Expert client onboarding.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.onboardings: Dict[str, ClientOnboardingRecord] = {}
    
    def _create_task_template(self) -> List[OnboardingTask]:
        """Create standard onboarding tasks."""
        tasks = [
            # Welcome Phase (Day 0-1)
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Welcome email", OnboardingPhase.WELCOME, TaskPriority.HIGH, 0),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Welcome call scheduled", OnboardingPhase.WELCOME, TaskPriority.HIGH, 1),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Send welcome kit", OnboardingPhase.WELCOME, TaskPriority.MEDIUM, 1),
            
            # Discovery Phase (Day 2-5)
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Discovery call", OnboardingPhase.DISCOVERY, TaskPriority.HIGH, 3),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Goals documentation", OnboardingPhase.DISCOVERY, TaskPriority.HIGH, 5),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Access credentials gathered", OnboardingPhase.DISCOVERY, TaskPriority.MEDIUM, 5),
            
            # Setup Phase (Day 5-10)
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Portal account created", OnboardingPhase.SETUP, TaskPriority.HIGH, 6),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Integrations setup", OnboardingPhase.SETUP, TaskPriority.MEDIUM, 8),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Reporting configured", OnboardingPhase.SETUP, TaskPriority.MEDIUM, 10),
            
            # Training Phase (Day 10-15)
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Platform training", OnboardingPhase.TRAINING, TaskPriority.HIGH, 12),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Reporting walkthrough", OnboardingPhase.TRAINING, TaskPriority.MEDIUM, 14),
            
            # Handoff Phase (Day 15-21)
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Introduce CSM", OnboardingPhase.HANDOFF, TaskPriority.HIGH, 16),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Satisfaction survey", OnboardingPhase.HANDOFF, TaskPriority.MEDIUM, 18),
            OnboardingTask(f"T-{uuid.uuid4().hex[:4]}", "Handoff complete", OnboardingPhase.HANDOFF, TaskPriority.HIGH, 21),
        ]
        return tasks
    
    def start_onboarding(
        self,
        client_name: str,
        specialist: str
    ) -> ClientOnboardingRecord:
        """Start client onboarding."""
        record = ClientOnboardingRecord(
            id=f"ONB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            specialist=specialist,
            start_date=datetime.now(),
            current_phase=OnboardingPhase.WELCOME,
            tasks=self._create_task_template()
        )
        self.onboardings[record.id] = record
        return record
    
    def complete_task(self, record: ClientOnboardingRecord, task_id: str):
        """Complete a task."""
        for task in record.tasks:
            if task.id == task_id:
                task.completed = True
                task.completed_at = datetime.now()
                break
        
        # Update phase
        self._update_phase(record)
    
    def _update_phase(self, record: ClientOnboardingRecord):
        """Update current phase based on completed tasks."""
        phases = list(OnboardingPhase)
        for phase in phases:
            phase_tasks = [t for t in record.tasks if t.phase == phase]
            if phase_tasks and not all(t.completed for t in phase_tasks):
                record.current_phase = phase
                return
        record.current_phase = OnboardingPhase.COMPLETE
    
    def get_progress(self, record: ClientOnboardingRecord) -> float:
        """Get onboarding progress."""
        completed = sum(1 for t in record.tasks if t.completed)
        return (completed / len(record.tasks) * 100) if record.tasks else 0
    
    def format_dashboard(self) -> str:
        """Format specialist dashboard."""
        active = sum(1 for o in self.onboardings.values() if o.current_phase != OnboardingPhase.COMPLETE)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 ONBOARDING SPECIALIST                                 ║",
            f"║  {len(self.onboardings)} total │ {active} active onboardings                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE ONBOARDINGS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        phase_icons = {"welcome": "👋", "discovery": "🔍", "setup": "⚙️", "training": "📚", "handoff": "🤝", "complete": "✅"}
        
        for record in list(self.onboardings.values())[:5]:
            progress = self.get_progress(record)
            icon = phase_icons.get(record.current_phase.value, "📋")
            bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))
            
            lines.append(f"║  {icon} {record.client_name[:18]:<18} │ {bar} │ {progress:>3.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 TODAY'S TASKS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Get overdue/due tasks
        priority_icons = {"high": "🔴", "medium": "🟡", "low": "🟢"}
        today_tasks = []
        for record in self.onboardings.values():
            for task in record.tasks:
                if not task.completed:
                    days_since = (datetime.now() - record.start_date).days
                    if days_since >= task.due_day:
                        today_tasks.append((record.client_name, task))
        
        for client, task in today_tasks[:4]:
            icon = priority_icons.get(task.priority.value, "⚪")
            lines.append(f"║    {icon} {client[:12]:<12} │ {task.name[:30]:<30}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [✅ Complete Task]  [📋 Templates]  [📊 Metrics]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Great first impressions!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    specialist = OnboardingSpecialist("Saigon Digital Hub")
    
    print("👋 Onboarding Specialist")
    print("=" * 60)
    print()
    
    # Start onboardings
    onb1 = specialist.start_onboarding("Sunrise Realty", "Sarah")
    onb2 = specialist.start_onboarding("Coffee Lab", "Mike")
    
    # Complete some tasks
    for i, task in enumerate(onb1.tasks[:5]):
        specialist.complete_task(onb1, task.id)
    
    print(specialist.format_dashboard())

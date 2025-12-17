"""
👋 Client Onboarding Flow - Structured Onboarding
===================================================

Streamlined client onboarding.
Great first impressions!

Features:
- Step-by-step onboarding
- Checklist tracking
- Automated reminders
- Progress visualization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class OnboardingStep(Enum):
    """Onboarding steps."""
    WELCOME_CALL = "welcome_call"
    ACCOUNT_SETUP = "account_setup"
    PORTAL_ACCESS = "portal_access"
    KICKOFF_MEETING = "kickoff_meeting"
    STRATEGY_SESSION = "strategy_session"
    DELIVERABLES_START = "deliverables_start"


@dataclass
class OnboardingChecklist:
    """Onboarding checklist item."""
    step: OnboardingStep
    name: str
    description: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    due_days: int = 1


@dataclass
class ClientOnboarding:
    """Client onboarding record."""
    id: str
    client_name: str
    email: str
    checklist: List[OnboardingChecklist]
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class ClientOnboardingFlow:
    """
    Client Onboarding Flow.
    
    Structured onboarding process.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.onboardings: Dict[str, ClientOnboarding] = {}
    
    def _create_checklist(self) -> List[OnboardingChecklist]:
        """Create default checklist."""
        return [
            OnboardingChecklist(OnboardingStep.WELCOME_CALL, "Welcome Call", "Schedule initial call", due_days=1),
            OnboardingChecklist(OnboardingStep.ACCOUNT_SETUP, "Account Setup", "Create client account", due_days=1),
            OnboardingChecklist(OnboardingStep.PORTAL_ACCESS, "Portal Access", "Send portal login", due_days=2),
            OnboardingChecklist(OnboardingStep.KICKOFF_MEETING, "Kickoff Meeting", "Team introduction", due_days=3),
            OnboardingChecklist(OnboardingStep.STRATEGY_SESSION, "Strategy Session", "Define roadmap", due_days=5),
            OnboardingChecklist(OnboardingStep.DELIVERABLES_START, "Start Work", "Begin deliverables", due_days=7),
        ]
    
    def start_onboarding(self, client_name: str, email: str) -> ClientOnboarding:
        """Start client onboarding."""
        onboarding = ClientOnboarding(
            id=f"ONB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            email=email,
            checklist=self._create_checklist()
        )
        self.onboardings[onboarding.id] = onboarding
        return onboarding
    
    def complete_step(self, onboarding: ClientOnboarding, step: OnboardingStep):
        """Complete an onboarding step."""
        for item in onboarding.checklist:
            if item.step == step:
                item.completed = True
                item.completed_at = datetime.now()
                break
        
        # Check if all complete
        if all(item.completed for item in onboarding.checklist):
            onboarding.completed_at = datetime.now()
    
    def get_progress(self, onboarding: ClientOnboarding) -> float:
        """Get onboarding progress."""
        completed = sum(1 for item in onboarding.checklist if item.completed)
        return (completed / len(onboarding.checklist) * 100) if onboarding.checklist else 0
    
    def format_onboarding(self, onboarding: ClientOnboarding) -> str:
        """Format onboarding details."""
        progress = self.get_progress(onboarding)
        bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 CLIENT ONBOARDING                                     ║",
            f"║  {onboarding.client_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Progress: {bar} {progress:.0f}%              ║",
            "║                                                           ║",
            "║  ✅ CHECKLIST                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for item in onboarding.checklist:
            icon = "✅" if item.completed else "⬜"
            due = f"Day {item.due_days}"
            status = "Done" if item.completed else due
            lines.append(f"║    {icon} {item.name:<25} │ {status:<15}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📧 Send Reminder]  [📊 View Details]  [✅ Mark Done]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Great first impression!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_overview(self) -> str:
        """Format onboarding overview."""
        in_progress = sum(1 for o in self.onboardings.values() if not o.completed_at)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 ONBOARDING OVERVIEW                                   ║",
            f"║  {len(self.onboardings)} total │ {in_progress} in progress                       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Client          │ Progress │ Status                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for onboarding in list(self.onboardings.values())[:5]:
            progress = self.get_progress(onboarding)
            bar = "█" * int(progress / 20) + "░" * (5 - int(progress / 20))
            status = "✅ Complete" if onboarding.completed_at else "🔄 Active"
            lines.append(f"║  {onboarding.client_name[:15]:<15} │ {bar} {progress:>3.0f}% │ {status:<10}  ║")
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    flow = ClientOnboardingFlow("Saigon Digital Hub")
    
    print("👋 Client Onboarding Flow")
    print("=" * 60)
    print()
    
    # Start onboarding
    onb1 = flow.start_onboarding("Sunrise Realty", "admin@sunrise.com")
    onb2 = flow.start_onboarding("Coffee Lab", "hello@coffeelab.com")
    
    # Complete some steps
    flow.complete_step(onb1, OnboardingStep.WELCOME_CALL)
    flow.complete_step(onb1, OnboardingStep.ACCOUNT_SETUP)
    flow.complete_step(onb1, OnboardingStep.PORTAL_ACCESS)
    
    print(flow.format_onboarding(onb1))
    print()
    print(flow.format_overview())

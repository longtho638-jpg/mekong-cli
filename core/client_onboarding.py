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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """Onboarding checklist item entity."""
    step: OnboardingStep
    name: str
    description: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    due_days: int = 1


@dataclass
class ClientOnboarding:
    """Client onboarding record entity."""
    id: str
    client_name: str
    email: str
    checklist: List[OnboardingChecklist]
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class ClientOnboardingFlow:
    """
    Client Onboarding Flow System.
    
    Manages the initial stages of the client-agency relationship.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.onboardings: Dict[str, ClientOnboarding] = {}
        logger.info(f"Onboarding Flow initialized for {agency_name}")
    
    def _validate_email(self, email: str) -> bool:
        """Basic email format validation."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _create_default_checklist(self) -> List[OnboardingChecklist]:
        """Generate the standard onboarding roadmap."""
        return [
            OnboardingChecklist(OnboardingStep.WELCOME_CALL, "Welcome Call", "Schedule initial call", due_days=1),
            OnboardingChecklist(OnboardingStep.ACCOUNT_SETUP, "Account Setup", "Create client account", due_days=1),
            OnboardingChecklist(OnboardingStep.PORTAL_ACCESS, "Portal Access", "Send portal login", due_days=2),
            OnboardingChecklist(OnboardingStep.KICKOFF_MEETING, "Kickoff Meeting", "Team introduction", due_days=3),
            OnboardingChecklist(OnboardingStep.STRATEGY_SESSION, "Strategy Session", "Define roadmap", due_days=5),
            OnboardingChecklist(OnboardingStep.DELIVERABLES_START, "Start Work", "Begin deliverables", due_days=7),
        ]
    
    def start_onboarding(self, client_name: str, email: str) -> ClientOnboarding:
        """Initialize onboarding for a new client."""
        if not client_name:
            raise ValueError("Client name required")
        if not self._validate_email(email):
            logger.error(f"Invalid email: {email}")
            raise ValueError(f"Invalid email: {email}")

        onboarding = ClientOnboarding(
            id=f"ONB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            email=email,
            checklist=self._create_default_checklist()
        )
        self.onboardings[onboarding.id] = onboarding
        logger.info(f"Started onboarding for {client_name} ({onboarding.id})")
        return onboarding
    
    def complete_step(self, onboarding_id: str, step: OnboardingStep) -> bool:
        """Mark a specific step as finished."""
        if onboarding_id not in self.onboardings:
            return False
            
        onboarding = self.onboardings[onboarding_id]
        for item in onboarding.checklist:
            if item.step == step:
                if not item.completed:
                    item.completed = True
                    item.completed_at = datetime.now()
                    logger.info(f"Step {step.value} complete for {onboarding.client_name}")
                break
        
        # Auto-complete onboarding if all steps are done
        if all(item.completed for item in onboarding.checklist):
            onboarding.completed_at = datetime.now()
            logger.info(f"ONBOARDING COMPLETE for {onboarding.client_name}!")
        
        return True
    
    def get_progress(self, onboarding: ClientOnboarding) -> float:
        """Calculate the percentage of completed steps."""
        if not onboarding.checklist:
            return 0.0
        completed = sum(1 for item in onboarding.checklist if item.completed)
        return (completed / len(onboarding.checklist) * 100.0)
    
    def format_onboarding_detail(self, onboarding_id: str) -> str:
        """Render detail view for a specific onboarding."""
        if onboarding_id not in self.onboardings:
            return "❌ Onboarding record not found."
            
        onb = self.onboardings[onboarding_id]
        progress = self.get_progress(onb)
        bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 CLIENT ONBOARDING DETAIL{' ' * 31}║",
            f"║  {onb.client_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Progress: {bar} {progress:>3.0f}%{' ' * 21}║",
            "║                                                           ║",
            "║  ✅ CHECKLIST                                             ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for item in onb.checklist:
            icon = "✅" if item.completed else "⬜"
            status = "Done" if item.completed else f"Day {item.due_days}"
            lines.append(f"║    {icon} {item.name:<25} │ {status:<15}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📧 Reminder]  [📊 Details]  [✅ Mark Done]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - First Impression!  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_overview(self) -> str:
        """Render overview of all active onboardings."""
        in_progress = sum(1 for o in self.onboardings.values() if not o.completed_at)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 ONBOARDING OVERVIEW{' ' * 36}║",
            f"║  {len(self.onboardings)} total │ {in_progress} active onboardings{' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Client          │ Progress │ Status                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for onb in list(self.onboardings.values())[:5]:
            progress = self.get_progress(onb)
            bar = "█" * int(progress / 20) + "░" * (5 - int(progress / 20))
            status = "✅ Done  " if onb.completed_at else "🔄 Active"
            name_disp = (onb.client_name[:15] + '..') if len(onb.client_name) > 17 else onb.client_name
            lines.append(f"║  {name_disp:<15} │ {bar} {progress:>3.0f}% │ {status:<10}  ║")
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👋 Initializing Client Onboarding Flow...")
    print("=" * 60)
    
    try:
        flow = ClientOnboardingFlow("Saigon Digital Hub")
        
        # Start onboarding
        o1 = flow.start_onboarding("Sunrise Realty", "admin@sunrise.com")
        o2 = flow.start_onboarding("Coffee Lab", "hello@coffeelab.com")
        
        # Complete some steps
        flow.complete_step(o1.id, OnboardingStep.WELCOME_CALL)
        flow.complete_step(o1.id, OnboardingStep.ACCOUNT_SETUP)
        flow.complete_step(o1.id, OnboardingStep.PORTAL_ACCESS)
        
        print("\n" + flow.format_onboarding_detail(o1.id))
        print("\n" + flow.format_overview())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")

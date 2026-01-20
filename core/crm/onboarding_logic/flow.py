"""
Client Onboarding Flow core logic.
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import ClientOnboarding, OnboardingChecklist, OnboardingStep

logger = logging.getLogger(__name__)

class OnboardingFlowBase:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.onboardings: Dict[str, ClientOnboarding] = {}

    def _validate_email(self, email: str) -> bool:
        """Basic email format validation."""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
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
            raise ValueError(f"Invalid email: {email}")

        onboarding = ClientOnboarding(
            id=f"ONB-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            email=email,
            checklist=self._create_default_checklist(),
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

        if all(item.completed for item in onboarding.checklist):
            onboarding.completed_at = datetime.now()
            logger.info(f"ONBOARDING COMPLETE for {onboarding.client_name}!")

        return True

    def get_progress(self, onboarding: ClientOnboarding) -> float:
        """Calculate the percentage of completed steps."""
        if not onboarding.checklist:
            return 0.0
        completed = sum(1 for item in onboarding.checklist if item.completed)
        return completed / len(onboarding.checklist) * 100.0

"""
Investor interaction and communication management.
"""
import uuid
from datetime import datetime
from typing import Dict, List

from .models import Interaction, InteractionType, Investor, InvestorType, PipelineStage


class CommunicationManager:
    def __init__(self):
        self.investors: Dict[str, Investor] = {}
        self.interactions: Dict[str, List[Interaction]] = {}

    def add_investor(
        self,
        name: str,
        firm: str,
        investor_type: InvestorType,
        check_size_min: float = 0,
        check_size_max: float = 0,
        focus_areas: List[str] = None,
    ) -> Investor:
        """Add an investor to the pipeline."""
        investor = Investor(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            firm=firm,
            investor_type=investor_type,
            check_size_min=check_size_min,
            check_size_max=check_size_max,
            focus_areas=focus_areas or [],
        )
        self.investors[investor.id] = investor
        self.interactions[investor.id] = []
        return investor

    def log_interaction(
        self,
        investor_id: str,
        interaction_type: InteractionType,
        summary: str,
        outcome: str = "",
        next_steps: str = "",
    ) -> Interaction:
        """Log an interaction with an investor."""
        interaction = Interaction(
            id=f"INT-{uuid.uuid4().hex[:6].upper()}",
            investor_id=investor_id,
            interaction_type=interaction_type,
            date=datetime.now(),
            summary=summary,
            outcome=outcome,
            next_steps=next_steps,
        )

        if investor_id in self.interactions:
            self.interactions[investor_id].append(interaction)

        # Update investor's last contact
        if investor_id in self.investors:
            self.investors[investor_id].last_contact = datetime.now()

        return interaction

    def update_stage(self, investor_id: str, stage: PipelineStage):
        """Update investor pipeline stage."""
        if investor_id in self.investors:
            self.investors[investor_id].stage = stage

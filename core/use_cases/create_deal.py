"""
Use Case: Create Deal
Business logic for creating new deals.

Clean Architecture Layer: Use Cases
"""

from datetime import datetime

from core.entities.deal import Deal, DealStage


class CreateDealUseCase:
    """Use case for creating a new deal."""

    def __init__(self, deal_repository=None):
        """Initialize with optional repository."""
        self.deal_repository = deal_repository

    def execute(
        self,
        title: str,
        company: str,
        value: float,
        probability: float = 50.0,
        contact_id: int = None,
    ) -> Deal:
        """
        Create a new deal.

        Business Rules:
        - Title and company are required
        - Value must be positive
        - Probability must be 0-100
        - New deals start in QUALIFIED stage
        """
        # Validate inputs
        if not title or not company:
            raise ValueError("Title and company are required")

        if value <= 0:
            raise ValueError("Value must be positive")

        if not 0 <= probability <= 100:
            raise ValueError("Probability must be between 0 and 100")

        # Create deal entity
        deal = Deal(
            title=title,
            company=company,
            value=value,
            probability=probability,
            stage=DealStage.QUALIFIED,
            contact_id=contact_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Persist if repository available
        if self.deal_repository:
            deal = self.deal_repository.save(deal)

        return deal

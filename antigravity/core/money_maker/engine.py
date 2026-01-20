"""
💰 Money Maker Engine Logic
===========================

Automates commercial operations with built-in security and validation.
Features:
- 📖 13-Chapter Strategic Pricing
- 💂 Tiered Service Levels
- ⚖️ WIN-WIN-WIN Gatekeeper
- 📊 Sales Intelligence
- 🛡️ Input Validation
"""

import logging
from typing import List, Optional, Tuple, Union

from .governance import Win3Governance
from .models import Quote, ServiceTier, Win3Result
from .qualification import LeadQualifier
from .quoting import QuoteGenerator

logger = logging.getLogger(__name__)


class MoneyMaker:
    """
    💰 Money Maker Engine (with Validation)

    Automates commercial operations with built-in security and validation.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        self.data_dir = data_dir
        self.quotes: List[Quote] = []
        self._next_id = 1

        # Sub-components
        self.governance = Win3Governance()
        self.quoter = QuoteGenerator()
        self.qualifier = LeadQualifier()

        logger.info("MoneyMaker initialized with validation")

    def generate_quote(
        self,
        client_name: str,
        chapters: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
        custom_equity: Optional[float] = None,
    ) -> Quote:
        """
        Generate validated client quote.

        Args:
            client_name: Client name (will be sanitized)
            chapters: List of Binh Pháp chapter IDs to include
            tier: Service tier
            custom_equity: Optional custom equity percentage

        Returns:
            Validated Quote object

        Raises:
            ValueError: If input validation fails
        """
        quote = self.quoter.generate_quote(
            quote_id=self._next_id,
            client_name=client_name,
            chapters=chapters,
            tier=tier,
            custom_equity=custom_equity,
        )

        self.quotes.append(quote)
        self._next_id += 1
        return quote

    def validate_win3(self, quote: Quote) -> Win3Result:
        """
        WIN-WIN-WIN Governance Check.

        Ensures the deal benefits Owner, Agency, and Client.
        """
        return self.governance.validate(quote)

    def get_pricing_catalog(self) -> str:
        """Render 13-Chapter pricing menu."""
        return self.quoter.get_pricing_catalog()

    def auto_qualify_lead(
        self, budget: float, authority: int, need: int, urgency: int
    ) -> Tuple[float, str, ServiceTier]:
        """
        Auto-qualify a lead based on BANT scoring.

        Weights:
        - Budget: Dynamic based on value (max 35)
        - Authority: 20% (max 20)
        - Need: 25% (max 25)
        - Urgency: 20% (max 20)

        Returns:
            (score, action_recommendation, suggested_tier)
        """
        return self.qualifier.auto_qualify_lead(budget, authority, need, urgency)

"""
Term Sheet Analyzer (Facade)
"""
from .models import CapTableEntry, DealType, TermCategory, TermSheet, TermSheetTerm
from .presentation.dashboard import TermSheetPresenter


class TermSheetAnalyzer(TermSheetPresenter):
    """
    Term Sheet Analyzer.
    Understand and evaluate term sheets.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        self.common_terms = {
            "liquidation_preference": {
                "name": "Liquidation Preference",
                "founder_friendly": "1x non-participating",
            },
            "anti_dilution": {
                "name": "Anti-Dilution",
                "founder_friendly": "Broad-based weighted average",
            }
        }
        self._init_demo_data()

    def _init_demo_data(self):
        """Initialize demo data."""
        ts = self.create_term_sheet(
            investor_name="Pillar VC",
            deal_type=DealType.PRICED_ROUND,
            pre_money_valuation=20_000_000,
            investment_amount=5_000_000,
        )
        ts.founder_friendly_score = 85

    def detect_red_flags(self, ts: TermSheet) -> list[str]:
        """Detect red flags in term sheet."""
        flags = []
        for term in ts.terms:
            if term.red_flag:
                flags.append(f"🚨 {term.name}: {term.value}")
        return flags

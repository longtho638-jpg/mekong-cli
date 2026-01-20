"""
Term Sheet Analysis core logic.
"""
import uuid
from typing import Any, Dict, List

from .models import CapTableEntry, DealType, TermCategory, TermSheet, TermSheetTerm


class AnalyzerEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.term_sheets: Dict[str, TermSheet] = {}
        self.cap_table: List[CapTableEntry] = []

    def create_term_sheet(
        self,
        investor_name: str,
        deal_type: DealType,
        pre_money_valuation: float,
        investment_amount: float,
    ) -> TermSheet:
        """Create a new term sheet for analysis."""
        ts = TermSheet(
            id=f"TS-{uuid.uuid4().hex[:6].upper()}",
            investor_name=investor_name,
            deal_type=deal_type,
            pre_money_valuation=pre_money_valuation,
            investment_amount=investment_amount,
        )
        self.term_sheets[ts.id] = ts
        return ts

    def calculate_valuation(self, pre_money: float, investment: float) -> Dict[str, float]:
        """Calculate valuation metrics."""
        post_money = pre_money + investment
        ownership_sold = (investment / post_money) * 100

        return {
            "pre_money": pre_money,
            "investment": investment,
            "post_money": post_money,
            "ownership_sold": ownership_sold,
            "price_per_share": post_money / 10_000_000,
        }

    def simulate_dilution(
        self, current_ownership: float, new_round_size: float, pre_money: float
    ) -> Dict[str, float]:
        """Simulate dilution from a new round."""
        post_money = pre_money + new_round_size
        dilution_factor = pre_money / post_money
        new_ownership = current_ownership * dilution_factor
        dilution = current_ownership - new_ownership

        return {
            "current_ownership": current_ownership,
            "new_ownership": new_ownership,
            "dilution": dilution,
            "dilution_percentage": (dilution / current_ownership) * 100,
        }

    def calculate_founder_score(self, ts: TermSheet) -> int:
        """Calculate founder-friendly score (0-100)."""
        if not ts.terms:
            return 50

        friendly_count = sum(1 for t in ts.terms if t.is_founder_friendly)
        red_flags = sum(1 for t in ts.terms if t.red_flag)

        base_score = (friendly_count / len(ts.terms)) * 100
        penalty = red_flags * 15

        return max(0, min(100, int(base_score - penalty)))

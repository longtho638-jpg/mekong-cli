"""
Term Sheet Analysis engine.
"""
import uuid
from typing import Any, Dict, List

from .models import CapTableEntry, DealType, TermCategory, TermSheet, TermSheetTerm


class TermSheetAnalyzer:
    """
    Term Sheet Analyzer.
    Understand and evaluate term sheets.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.term_sheets: Dict[str, TermSheet] = {}
        self.cap_table: List[CapTableEntry] = []
        self.common_terms: Dict[str, Dict[str, Any]] = {}

        self._init_common_terms()
        self._init_demo_data()

    def _init_common_terms(self):
        """Initialize common term definitions."""
        self.common_terms = {
            "liquidation_preference": {
                "name": "Liquidation Preference",
                "description": "Order and amount paid at exit",
                "founder_friendly": "1x non-participating",
                "investor_friendly": "2x+ participating",
                "red_flags": ["participating", "2x or higher"],
            },
            "anti_dilution": {
                "name": "Anti-Dilution",
                "description": "Protection against down rounds",
                "founder_friendly": "Broad-based weighted average",
                "investor_friendly": "Full ratchet",
                "red_flags": ["full ratchet"],
            },
            "board_composition": {
                "name": "Board Composition",
                "description": "Who controls the board",
                "founder_friendly": "Founder majority or mutual",
                "investor_friendly": "Investor majority",
                "red_flags": ["investor majority", "veto rights"],
            },
            "protective_provisions": {
                "name": "Protective Provisions",
                "description": "Investor veto rights",
                "founder_friendly": "Standard only",
                "investor_friendly": "Extensive list",
                "red_flags": ["hiring/firing CEO", "budget approval"],
            },
            "drag_along": {
                "name": "Drag-Along Rights",
                "description": "Force sale of all shares",
                "founder_friendly": "High threshold (80%+)",
                "investor_friendly": "Low threshold (50%+)",
                "red_flags": ["low threshold", "investor-only trigger"],
            },
        }

    def _init_demo_data(self):
        """Initialize demo data."""
        ts = self.create_term_sheet(
            investor_name="Pillar VC",
            deal_type=DealType.PRICED_ROUND,
            pre_money_valuation=20_000_000,
            investment_amount=5_000_000,
        )

        ts.terms = [
            TermSheetTerm("Liquidation Preference", "1x non-participating", TermCategory.ECONOMICS, True),
            TermSheetTerm("Anti-Dilution", "Broad-based weighted average", TermCategory.PROTECTION, True),
            TermSheetTerm("Board Seats", "2 founders, 1 investor, 1 independent", TermCategory.CONTROL, True),
            TermSheetTerm("Pro-Rata Rights", "Yes, for all investors", TermCategory.PROTECTION, True),
            TermSheetTerm("Vesting", "4 years, 1 year cliff", TermCategory.OTHER, True),
            TermSheetTerm("ESOP", "10% post-money", TermCategory.ECONOMICS, True),
        ]

        ts.founder_friendly_score = self.calculate_founder_score(ts)

        self.cap_table = [
            CapTableEntry("Founder A", 4_000_000, 40.0, "common"),
            CapTableEntry("Founder B", 3_000_000, 30.0, "common"),
            CapTableEntry("ESOP Pool", 1_000_000, 10.0, "options"),
            CapTableEntry("Pillar VC", 2_000_000, 20.0, "series_a"),
        ]

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

    def detect_red_flags(self, ts: TermSheet) -> List[str]:
        """Detect red flags in term sheet."""
        flags = []
        for term in ts.terms:
            term_lower = term.value.lower()
            if "participating" in term_lower and "non-participating" not in term_lower:
                flags.append(f"⚠️ Participating liquidation preference: {term.value}")
            if "full ratchet" in term_lower:
                flags.append(f"🚨 Full ratchet anti-dilution: {term.value}")
            if "investor majority" in term_lower:
                flags.append(f"⚠️ Investor board control: {term.value}")
            if term.red_flag:
                flags.append(f"🚨 {term.name}: {term.value}")
        return flags

    def get_stats(self) -> Dict[str, Any]:
        """Get term sheet statistics."""
        total = len(self.term_sheets)
        avg_score = 0
        total_raised = 0
        for ts in self.term_sheets.values():
            avg_score += ts.founder_friendly_score
            total_raised += ts.investment_amount
        avg_score = avg_score / total if total > 0 else 0
        return {
            "total_term_sheets": total,
            "avg_founder_score": avg_score,
            "total_raised": total_raised,
            "cap_table_entries": len(self.cap_table),
        }

    def format_dashboard(self) -> str:
        """Format term sheet dashboard."""
        stats = self.get_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  📋 TERM SHEET ANALYZER                                   ║",
            f"║  {stats['total_term_sheets']} sheets │ {stats['avg_founder_score']:.0f}% founder-friendly  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 ACTIVE TERM SHEETS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        for ts in list(self.term_sheets.values())[:3]:
            score = ts.founder_friendly_score
            score_bar = "🟢" if score >= 70 else "🟡" if score >= 40 else "🔴"
            lines.append(f"║    {score_bar} {ts.investor_name:<16} │ ${ts.investment_amount / 1e6:.1f}M │ {score}%  ║")
        lines.extend([
            "║                                                           ║",
            "║  📈 CAP TABLE                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        for entry in self.cap_table[:4]:
            bar_len = int(entry.percentage / 5)
            bar = "█" * bar_len + "░" * (10 - bar_len)
            lines.append(f"║    {entry.shareholder:<15} │ {bar} {entry.percentage:>5.1f}%  ║")
        lines.extend([
            "║                                                           ║",
            "║  🔍 KEY TERMS TO WATCH                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    ✅ 1x non-participating (good)                        ║",
            "║    ✅ Broad-based weighted average (good)                ║",
            "║    ⚠️ Watch: Board composition                           ║",
            "║    ⚠️ Watch: Protective provisions                       ║",
            "║                                                           ║",
            "║  [📊 Analyze]  [📈 Cap Table]  [💡 Compare]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name} - Know your terms!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)

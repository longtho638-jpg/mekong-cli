"""
Term Sheet Dashboard rendering.
"""
from typing import Any, Dict

from .engine import AnalyzerEngine


class TermSheetPresenter(AnalyzerEngine):
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
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

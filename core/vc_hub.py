"""
💰 VC Hub - Fundraising Command Center
=======================================

Central hub for all fundraising activities.
Integrates pitch decks, investor relations, and term sheets.

Features:
- Fundraising round dashboard
- Pipeline overview
- Pitch success tracking
- Valuation monitoring
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime

# Import VC modules
from core.pitch_deck import PitchDeckGenerator, RoundType
from core.investor_relations import InvestorRelations, PipelineStage
from core.term_sheet import TermSheetAnalyzer


@dataclass
class FundraisingRound:
    """A fundraising round."""
    round_type: str
    target_amount: float
    amount_committed: float
    start_date: datetime
    status: str = "active"  # active, closed, paused


class VCHub:
    """
    VC Hub - Fundraising Command Center.
    
    Integrates all fundraising modules.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize sub-modules
        self.pitch_deck = PitchDeckGenerator(agency_name)
        self.investor_relations = InvestorRelations(agency_name)
        self.term_sheet = TermSheetAnalyzer(agency_name)
        
        # Current round
        self.current_round = FundraisingRound(
            round_type="Series A",
            target_amount=5_000_000,
            amount_committed=2_000_000,
            start_date=datetime.now()
        )
    
    def get_department_stats(self) -> Dict[str, Any]:
        """Get comprehensive VC department stats."""
        pitch_stats = self.pitch_deck.get_stats()
        ir_stats = self.investor_relations.get_stats()
        ts_stats = self.term_sheet.get_stats()
        
        # Calculate pitch success rate
        total_pitches = ir_stats['by_stage'].get('partner_meeting', 0) + \
                       ir_stats['by_stage'].get('due_diligence', 0) + \
                       ir_stats['by_stage'].get('term_sheet', 0) + \
                       ir_stats['by_stage'].get('closed', 0) + \
                       ir_stats['by_stage'].get('passed', 0)
        
        won = ir_stats['closed_count']
        pitch_success_rate = (won / total_pitches * 100) if total_pitches > 0 else 0
        
        return {
            # Round metrics
            "current_round": self.current_round.round_type,
            "target_raise": self.current_round.target_amount,
            "amount_committed": self.current_round.amount_committed,
            "progress": (self.current_round.amount_committed / self.current_round.target_amount * 100)
                       if self.current_round.target_amount > 0 else 0,
            
            # Pitch metrics
            "total_decks": pitch_stats['total_decks'],
            
            # Investor metrics
            "total_investors": ir_stats['total_investors'],
            "pipeline_value": ir_stats['pipeline_value'],
            "pitch_success_rate": pitch_success_rate,
            
            # Term sheet metrics
            "term_sheets": ts_stats['total_term_sheets'],
            "founder_score": ts_stats['avg_founder_score'],
            
            # DD progress
            "dd_progress": ir_stats['dd_progress']
        }
    
    def format_dashboard(self) -> str:
        """Format VC Hub dashboard."""
        stats = self.get_department_stats()
        
        # Progress bar for round
        progress = int(stats['progress'])
        bar_filled = int(progress / 5)
        progress_bar = "█" * bar_filled + "░" * (20 - bar_filled)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 VC HUB - FUNDRAISING CENTER                           ║",
            f"║  {self.agency_name:<45}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CURRENT ROUND                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🎯 {stats['current_round']:<15} Target: ${stats['target_raise']/1e6:.1f}M           ║",
            f"║    💵 Committed: ${stats['amount_committed']/1e6:.1f}M ({progress}%)                      ║",
            f"║    {progress_bar}                        ║",
            "║                                                           ║",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Pitch Decks:           {stats['total_decks']:>8}                  ║",
            f"║    🤝 Investors in Pipeline: {stats['total_investors']:>8}                  ║",
            f"║    💰 Pipeline Value:    ${stats['pipeline_value']:>12,.0f}              ║",
            f"║    📋 Term Sheets:           {stats['term_sheets']:>8}                  ║",
            f"║    ✅ Founder Score:         {stats['founder_score']:>7.0f}%                  ║",
            f"║    📈 Pitch Success:         {stats['pitch_success_rate']:>7.1f}%                  ║",
            "║                                                           ║",
            "║  🔗 VC ROLES                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📊 Pitch Deck Gen   → Decks, storytelling, templates  ║",
            "║    🤝 Investor Relations → Pipeline, outreach, meetings  ║",
            "║    📋 Term Sheet Analyzer → Valuation, dilution, terms   ║",
            "║                                                           ║",
            "║  📋 FUNDRAISING TEAM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Pitch Decks     │ {stats['total_decks']} ready to present       ║",
            f"║    🤝 Investors       │ {stats['total_investors']} in pipeline            ║",
            f"║    📋 Due Diligence   │ {stats['dd_progress']:.0f}% complete             ║",
            "║                                                           ║",
            "║  [📊 Decks]  [🤝 Investors]  [📋 Terms]  [💰 Round]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Raise smarter!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = VCHub("Saigon Digital Hub")
    
    print("💰 VC Hub")
    print("=" * 60)
    print()
    
    print(hub.format_dashboard())

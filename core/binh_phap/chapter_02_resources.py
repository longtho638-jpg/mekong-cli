"""
🏯 Chapter 2: Tác Chiến (作戰) - Resource Management
====================================================

"Chiến tranh kéo dài thì ngân khố cạn kiệt"

War is expensive - manage resources wisely.
Runway, burn rate, living off the land.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class RunwayStatus(Enum):
    """Runway health status."""
    CRITICAL = "critical"      # < 3 months
    WARNING = "warning"        # 3-6 months
    STABLE = "stable"          # 6-12 months
    STRONG = "strong"          # 12-18 months
    FORTRESS = "fortress"      # 18+ months


@dataclass
class WarChest:
    """Financial war chest tracking."""
    cash_balance: float = 0
    monthly_burn: float = 0
    monthly_revenue: float = 0
    accounts_receivable: float = 0
    committed_funding: float = 0
    
    @property
    def net_burn(self) -> float:
        """Net monthly burn after revenue."""
        return self.monthly_burn - self.monthly_revenue
    
    @property
    def runway_months(self) -> float:
        """Months of runway remaining."""
        if self.net_burn <= 0:
            return float('inf')  # Profitable!
        return self.cash_balance / self.net_burn
    
    @property
    def is_profitable(self) -> bool:
        return self.monthly_revenue >= self.monthly_burn


@dataclass
class ResourceAllocation:
    """Resource allocation by category."""
    category: str
    monthly_cost: float
    headcount: int = 0
    is_essential: bool = True
    notes: str = ""


class ChapterTwoResources:
    """
    Chapter 2: Tác Chiến - Resource Management.
    
    "Phàm dụng binh chi pháp, trì xa thiên tứ,
    cách xa thiên thặng, đái giáp thập vạn"
    
    (War requires substantial resources)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.war_chests: Dict[str, WarChest] = {}
        self.allocations: Dict[str, List[ResourceAllocation]] = {}
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        startup_id = "DEMO-001"
        self.war_chests[startup_id] = WarChest(
            cash_balance=500_000,
            monthly_burn=45_000,
            monthly_revenue=12_000,
            accounts_receivable=8_000,
            committed_funding=0
        )
        
        self.allocations[startup_id] = [
            ResourceAllocation("Engineering", 25_000, 3, True),
            ResourceAllocation("Marketing", 8_000, 1, True),
            ResourceAllocation("Operations", 7_000, 1, True),
            ResourceAllocation("Infrastructure", 5_000, 0, True),
        ]
    
    def add_war_chest(self, startup_id: str, war_chest: WarChest):
        """Add or update war chest for a startup."""
        self.war_chests[startup_id] = war_chest
    
    def get_runway_status(self, war_chest: WarChest) -> RunwayStatus:
        """Determine runway status."""
        months = war_chest.runway_months
        if months == float('inf'):
            return RunwayStatus.FORTRESS
        elif months >= 18:
            return RunwayStatus.FORTRESS
        elif months >= 12:
            return RunwayStatus.STRONG
        elif months >= 6:
            return RunwayStatus.STABLE
        elif months >= 3:
            return RunwayStatus.WARNING
        return RunwayStatus.CRITICAL
    
    def calculate_raise_timing(self, war_chest: WarChest) -> Dict[str, Any]:
        """Calculate optimal fundraising timing."""
        runway = war_chest.runway_months
        
        # Should start raising when 6+ months left
        months_until_raise = max(0, runway - 6)
        
        # Time to close a round (typically 3-6 months)
        close_time = 4
        
        return {
            "current_runway": runway,
            "months_until_should_raise": months_until_raise,
            "estimated_close_time": close_time,
            "raise_deadline": datetime.now() + timedelta(days=int(months_until_raise * 30)),
            "urgency": "HIGH" if runway < 9 else "MEDIUM" if runway < 12 else "LOW"
        }
    
    def optimize_burn(self, startup_id: str) -> List[str]:
        """Suggest burn rate optimizations."""
        if startup_id not in self.allocations:
            return []
        
        suggestions = []
        allocations = self.allocations[startup_id]
        total_burn = sum(a.monthly_cost for a in allocations)
        
        for alloc in allocations:
            pct = (alloc.monthly_cost / total_burn) * 100 if total_burn > 0 else 0
            
            if alloc.category == "Marketing" and pct > 25:
                suggestions.append(f"📉 Marketing ({pct:.0f}%): Consider reducing paid ads")
            if alloc.category == "Infrastructure" and pct > 15:
                suggestions.append(f"💻 Infra ({pct:.0f}%): Review cloud costs, right-size")
            if not alloc.is_essential:
                suggestions.append(f"⚠️ {alloc.category}: Non-essential - can cut if needed")
        
        return suggestions
    
    def living_off_the_land(self, war_chest: WarChest) -> Dict[str, Any]:
        """
        Binh Phap strategy: "Sống nhờ địch" - Live off the enemy.
        In startup terms: Generate revenue to extend runway.
        """
        current_runway = war_chest.runway_months
        revenue_ratio = war_chest.monthly_revenue / war_chest.monthly_burn if war_chest.monthly_burn > 0 else 0
        
        # If 50% revenue coverage, runway effectively doubles
        extended_runway = current_runway * (1 + revenue_ratio)
        
        return {
            "current_runway": current_runway,
            "revenue_ratio": revenue_ratio * 100,
            "extended_runway": extended_runway,
            "months_gained": extended_runway - current_runway,
            "strategy": "Increase revenue to extend runway without raising"
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 2 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 2: TÁC CHIẾN (作戰)                            ║",
            "║  Resource Management & Runway                             ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for startup_id, wc in list(self.war_chests.items())[:2]:
            status = self.get_runway_status(wc)
            status_icon = {
                "critical": "🔴", "warning": "🟡", 
                "stable": "🟢", "strong": "💪", "fortress": "🏰"
            }
            
            lines.extend([
                "║  💰 WAR CHEST                                             ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    💵 Cash Balance:    ${wc.cash_balance:>12,.0f}              ║",
                f"║    🔥 Monthly Burn:    ${wc.monthly_burn:>12,.0f}              ║",
                f"║    📈 Monthly Revenue: ${wc.monthly_revenue:>12,.0f}              ║",
                f"║    📊 Net Burn:        ${wc.net_burn:>12,.0f}              ║",
                "║                                                           ║",
                f"║    ⏳ Runway: {wc.runway_months:.1f} months {status_icon.get(status.value, '')} {status.value.upper():<12}    ║",
            ])
            
            # Raise timing
            timing = self.calculate_raise_timing(wc)
            lines.extend([
                "║                                                           ║",
                "║  ⏰ FUNDRAISING TIMING                                    ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    🎯 Start Raising In: {timing['months_until_should_raise']:.1f} months               ║",
                f"║    ⚡ Urgency: {timing['urgency']:<10}                            ║",
            ])
            
            # Living off the land
            lotl = self.living_off_the_land(wc)
            lines.extend([
                "║                                                           ║",
                "║  🌾 SỐNG NHỜ ĐỊCH (Living Off The Land)                   ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    📊 Revenue Coverage: {lotl['revenue_ratio']:.0f}%                          ║",
                f"║    ⏳ Extended Runway:  {lotl['extended_runway']:.1f} months                  ║",
                f"║    💪 Months Gained:    {lotl['months_gained']:.1f}                           ║",
            ])
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Cửu chiến tắc binh bì\"                                ║",
            "║    (Prolonged war exhausts the army)                     ║",
            "║                                                           ║",
            "║  [💰 Budget]  [📊 Optimize]  [⏰ Timeline]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Conserve to conquer!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch2 = ChapterTwoResources("Saigon Digital Hub")
    print("🏯 Chapter 2: Tác Chiến")
    print("=" * 60)
    print()
    print(ch2.format_dashboard())

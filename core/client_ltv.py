"""
💎 Client Lifetime Value - LTV Calculator
===========================================

Calculate and track client lifetime value.
Know your most valuable clients!

Features:
- LTV calculation
- Cohort analysis
- Retention impact
- Revenue prediction
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ClientTier(Enum):
    """Client tiers by LTV."""
    PLATINUM = "platinum"  # Top 10%
    GOLD = "gold"          # Top 25%
    SILVER = "silver"      # Top 50%
    BRONZE = "bronze"      # Bottom 50%


@dataclass
class ClientLTV:
    """Client lifetime value record."""
    id: str
    client_name: str
    start_date: datetime
    total_revenue: float
    avg_monthly: float
    retention_months: int
    predicted_ltv: float
    tier: ClientTier


class ClientLifetimeValue:
    """
    Client Lifetime Value Calculator.
    
    Know your client value.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientLTV] = {}
        self._load_defaults()
    
    def _load_defaults(self):
        """Load sample clients."""
        samples = [
            ("Sunrise Realty", 24, 45000, 3500),
            ("Coffee Lab", 18, 32000, 2800),
            ("Tech Startup VN", 12, 28000, 2500),
            ("Fashion Brand", 6, 12000, 2000),
            ("Restaurant Chain", 36, 85000, 4000),
        ]
        
        for name, months, total, avg_monthly in samples:
            ltv = self.calculate_ltv(avg_monthly, months)
            tier = self.get_tier(ltv)
            
            client = ClientLTV(
                id=f"LTV-{uuid.uuid4().hex[:6].upper()}",
                client_name=name,
                start_date=datetime.now() - timedelta(days=months * 30),
                total_revenue=total,
                avg_monthly=avg_monthly,
                retention_months=months,
                predicted_ltv=ltv,
                tier=tier
            )
            self.clients[client.id] = client
    
    def calculate_ltv(
        self,
        avg_monthly: float,
        months: int = 24,
        churn_rate: float = 0.05
    ) -> float:
        """Calculate predicted LTV."""
        # LTV = (Monthly Revenue * Avg Lifespan) / Churn Rate
        avg_lifespan = 1 / churn_rate if churn_rate > 0 else months
        return avg_monthly * min(avg_lifespan, 36)  # Cap at 3 years
    
    def get_tier(self, ltv: float) -> ClientTier:
        """Get client tier by LTV."""
        if ltv >= 70000:
            return ClientTier.PLATINUM
        elif ltv >= 50000:
            return ClientTier.GOLD
        elif ltv >= 30000:
            return ClientTier.SILVER
        else:
            return ClientTier.BRONZE
    
    def get_totals(self) -> Dict[str, Any]:
        """Get LTV totals."""
        total_ltv = sum(c.predicted_ltv for c in self.clients.values())
        avg_ltv = total_ltv / len(self.clients) if self.clients else 0
        avg_monthly = sum(c.avg_monthly for c in self.clients.values()) / len(self.clients) if self.clients else 0
        
        return {
            "total_ltv": total_ltv,
            "avg_ltv": avg_ltv,
            "avg_monthly": avg_monthly,
            "client_count": len(self.clients)
        }
    
    def format_dashboard(self) -> str:
        """Format LTV dashboard."""
        totals = self.get_totals()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💎 CLIENT LIFETIME VALUE                                 ║",
            f"║  ${totals['total_ltv']:,.0f} total LTV │ ${totals['avg_ltv']:,.0f} avg             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 CLIENT LTV RANKING                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        tier_icons = {"platinum": "💎", "gold": "🥇", "silver": "🥈", "bronze": "🥉"}
        
        for client in sorted(self.clients.values(), key=lambda x: x.predicted_ltv, reverse=True)[:5]:
            icon = tier_icons[client.tier.value]
            bar = "█" * int(client.predicted_ltv / 10000) + "░" * max(0, (7 - int(client.predicted_ltv / 10000)))
            
            lines.append(f"║  {icon} {client.client_name[:15]:<15} │ {bar} │ ${client.predicted_ltv:>10,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 LTV BY TIER                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for tier in ClientTier:
            count = sum(1 for c in self.clients.values() if c.tier == tier)
            total = sum(c.predicted_ltv for c in self.clients.values() if c.tier == tier)
            icon = tier_icons[tier.value]
            
            lines.append(f"║    {icon} {tier.value.capitalize():<10} │ {count:>2} clients │ ${total:>12,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  📈 Avg Monthly Revenue: ${totals['avg_monthly']:>8,.0f}                  ║",
            "║                                                           ║",
            "║  [📊 Cohort Analysis]  [📈 Trends]  [🎯 Improve]          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your value!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ltv = ClientLifetimeValue("Saigon Digital Hub")
    
    print("💎 Client Lifetime Value")
    print("=" * 60)
    print()
    
    print(ltv.format_dashboard())

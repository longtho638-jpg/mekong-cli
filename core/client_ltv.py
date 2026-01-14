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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ClientTier(Enum):
    """Client tiers by LTV."""
    PLATINUM = "platinum"  # Top tier
    GOLD = "gold"          
    SILVER = "silver"      
    BRONZE = "bronze"      


@dataclass
class ClientLTV:
    """Client lifetime value record entity."""
    id: str
    client_name: str
    start_date: datetime
    total_revenue: float
    avg_monthly: float
    retention_months: int
    predicted_ltv: float
    tier: ClientTier

    def __post_init__(self):
        if self.total_revenue < 0 or self.avg_monthly < 0:
            raise ValueError("Revenue cannot be negative")
        if self.retention_months < 0:
            raise ValueError("Retention months cannot be negative")


class ClientLifetimeValue:
    """
    Client Lifetime Value Calculator System.
    
    Provides insights into client value over time and predicts future revenue.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientLTV] = {}
        logger.info(f"Client LTV Calculator initialized for {agency_name}")
        self._load_defaults()
    
    def _load_defaults(self):
        """Pre-populate with sample client data for demonstration."""
        samples = [
            ("Sunrise Realty", 24, 45000.0, 3500.0),
            ("Coffee Lab", 18, 32000.0, 2800.0),
            ("Tech Startup VN", 12, 28000.0, 2500.0),
            ("Fashion Brand", 6, 12000.0, 2000.0),
            ("Restaurant Chain", 36, 85000.0, 4000.0),
        ]
        
        for name, months, total, avg_monthly in samples:
            try:
                ltv_val = self.calculate_ltv(avg_monthly, months)
                tier_val = self.determine_tier(ltv_val)
                
                client = ClientLTV(
                    id=f"LTV-{uuid.uuid4().hex[:6].upper()}",
                    client_name=name,
                    start_date=datetime.now() - timedelta(days=months * 30),
                    total_revenue=total,
                    avg_monthly=avg_monthly,
                    retention_months=months,
                    predicted_ltv=ltv_val,
                    tier=tier_val
                )
                self.clients[client.id] = client
            except ValueError as e:
                logger.error(f"Failed to load sample client {name}: {e}")
    
    def calculate_ltv(
        self,
        avg_monthly: float,
        months: int = 24,
        churn_rate: float = 0.05
    ) -> float:
        """
        Calculate predicted Lifetime Value.
        Formula: (Monthly Revenue / Churn Rate) capped by time or lifespan.
        """
        if avg_monthly < 0:
            raise ValueError("Monthly revenue must be positive")
        
        # Ensure churn rate is within valid bounds
        safe_churn = max(0.01, min(1.0, churn_rate))
        avg_lifespan = 1 / safe_churn
        
        # Calculate LTV, capped at 36 months for realistic agency forecasting
        actual_lifespan = min(avg_lifespan, 36.0)
        return avg_monthly * actual_lifespan
    
    def determine_tier(self, ltv: float) -> ClientTier:
        """Categorize client based on their predicted value."""
        if ltv >= 100000:
            return ClientTier.PLATINUM
        elif ltv >= 60000:
            return ClientTier.GOLD
        elif ltv >= 30000:
            return ClientTier.SILVER
        else:
            return ClientTier.BRONZE
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level LTV metrics."""
        if not self.clients:
            return {"total_ltv": 0.0, "avg_ltv": 0.0, "avg_monthly": 0.0, "count": 0}
            
        total_ltv = sum(c.predicted_ltv for c in self.clients.values())
        avg_ltv = total_ltv / len(self.clients)
        avg_monthly = sum(c.avg_monthly for c in self.clients.values()) / len(self.clients)
        
        return {
            "total_ltv": total_ltv,
            "avg_ltv": avg_ltv,
            "avg_monthly": avg_monthly,
            "count": len(self.clients)
        }
    
    def format_dashboard(self) -> str:
        """Render the Client LTV Dashboard."""
        stats = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💎 CLIENT LIFETIME VALUE{' ' * 41}║",
            f"║  ${stats['total_ltv']:,.0f} total LTV │ ${stats['avg_ltv']:,.0f} avg per client{' ' * 12}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 TOP CLIENT VALUE RANKING                              ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        tier_icons = {
            ClientTier.PLATINUM: "💎", 
            ClientTier.GOLD: "🥇", 
            ClientTier.SILVER: "🥈", 
            ClientTier.BRONZE: "🥉"
        }
        
        # Sort by predicted LTV descending
        sorted_clients = sorted(self.clients.values(), key=lambda x: x.predicted_ltv, reverse=True)[:5]
        
        for c in sorted_clients:
            icon = tier_icons.get(c.tier, "⚪")
            # 10-block progress bar, scaled to $150k max for demo
            bar_len = int(min(10, (c.predicted_ltv / 15000)))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            name_display = (c.client_name[:15] + '..') if len(c.client_name) > 17 else c.client_name
            
            lines.append(f"║  {icon} {name_display:<17} │ {bar} │ ${c.predicted_ltv:>10,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 LTV SEGMENTATION                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for tier in ClientTier:
            tier_clients = [c for c in self.clients.values() if c.tier == tier]
            count = len(tier_clients)
            total = sum(c.predicted_ltv for c in tier_clients)
            icon = tier_icons.get(tier, "⚪")
            
            lines.append(f"║    {icon} {tier.value.capitalize():<10} │ {count:>2} clients │ ${total:>12,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  📈 Portfolio Avg Monthly: ${stats['avg_monthly']:>10,.0f}             ║",
            "║                                                           ║",
            "║  [📊 Cohort Analysis]  [📈 Trends]  [🎯 Upsell Plan]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Maximize Value!    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💎 Initializing Client LTV System...")
    print("=" * 60)
    
    try:
        ltv_system = ClientLifetimeValue("Saigon Digital Hub")
        print("\n" + ltv_system.format_dashboard())
    except Exception as e:
        logger.error(f"Runtime Error: {e}")

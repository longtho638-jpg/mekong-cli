"""
🏯 Master Dashboard - Complete AgencyOS Status

Unified view of the ENTIRE platform:
- Agentic (Agents, Crews, Skills)
- Retention (Moats, Loyalty)
- Revenue (Cashflow, $1M goal)
- Infrastructure (10 layers)

Usage:
    from antigravity.core.master_dashboard import MasterDashboard
    dashboard = MasterDashboard()
    dashboard.print_full()
"""

from typing import Dict, Any
from datetime import datetime

from .unified_dashboard import AgenticDashboard
from .moat_engine import MoatEngine
from .loyalty_rewards import LoyaltyProgram
from .cashflow_engine import CashflowEngine
from .infrastructure import InfrastructureStack


class MasterDashboard:
    """
    🏯 Master Dashboard
    
    Complete platform status in one view.
    """
    
    def __init__(self):
        self.agentic = AgenticDashboard()
        self.moats = MoatEngine()
        self.loyalty = LoyaltyProgram()
        self.cashflow = CashflowEngine()
        self.infra = InfrastructureStack()
    
    def get_platform_score(self) -> int:
        """Get overall platform readiness score (0-100)."""
        agentic_score = self.agentic._calculate_integration_score(self.agentic.get_stats())
        moat_score = self.moats.get_total_strength()
        infra_score = self.infra.get_health_score()
        cashflow_progress = min(100, self.cashflow.get_progress())
        
        # Weighted average
        score = (
            agentic_score * 0.3 +
            moat_score * 0.25 +
            infra_score * 0.25 +
            cashflow_progress * 0.2
        )
        
        return int(score)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get complete platform summary."""
        agentic_stats = self.agentic.get_stats()
        switching_cost = self.moats.calculate_switching_cost()
        
        return {
            # Agentic
            "agents": agentic_stats["agents"],
            "chains": agentic_stats["chains"],
            "crews": agentic_stats["crews"],
            "skills": agentic_stats["skills"],
            "skill_mappings": agentic_stats["skill_mappings"],
            
            # Retention
            "moat_strength": self.moats.get_total_strength(),
            "switching_cost_hours": switching_cost["hours"],
            "switching_cost_money": switching_cost["money_cost"],
            "loyalty_tier": self.loyalty.get_current_tier().name,
            
            # Revenue
            "current_arr": self.cashflow.get_total_arr(),
            "arr_progress": self.cashflow.get_progress(),
            "required_growth": self.cashflow.get_required_growth_rate(),
            
            # Infrastructure
            "infra_layers": 10,
            "infra_health": self.infra.get_health_score(),
            
            # Overall
            "platform_score": self.get_platform_score(),
            "timestamp": datetime.now().isoformat(),
        }
    
    def print_compact(self):
        """Print compact summary."""
        summary = self.get_summary()
        
        print("\n🏯 AGENCYOS MASTER STATUS")
        print("═" * 50)
        print(f"   🤖 Agents: {summary['agents']} | Chains: {summary['chains']} | Crews: {summary['crews']}")
        print(f"   🎯 Skills: {summary['skills']} ({summary['skill_mappings']} mappings)")
        print(f"   🏰 Moats: {summary['moat_strength']}% | Switching: ${summary['switching_cost_money']:,}")
        print(f"   💰 ARR: ${summary['current_arr']:,.0f} ({summary['arr_progress']:.1f}% → $1M)")
        print(f"   🏗️ Infra: {summary['infra_layers']} layers ({summary['infra_health']}% health)")
        print(f"   🏆 Platform Score: {summary['platform_score']}%")
        print("═" * 50)
    
    def print_full(self):
        """Print full master dashboard."""
        summary = self.get_summary()
        score = summary["platform_score"]
        
        print("\n")
        print("╔" + "═" * 58 + "╗")
        print("║" + "🏯 AGENCYOS MASTER DASHBOARD".center(58) + "║")
        print("║" + "Complete Platform Status".center(58) + "║")
        print("╠" + "═" * 58 + "╣")
        
        # 1. AGENTIC SECTION
        print("║" + " 🤖 AGENTIC LAYER".ljust(58) + "║")
        print("║" + f"    Agents: {summary['agents']}".ljust(58) + "║")
        print("║" + f"    Chains: {summary['chains']}".ljust(58) + "║")
        print("║" + f"    Crews: {summary['crews']}".ljust(58) + "║")
        print("║" + f"    Skills: {summary['skills']} ({summary['skill_mappings']} mappings)".ljust(58) + "║")
        
        print("╟" + "─" * 58 + "╢")
        
        # 2. RETENTION SECTION
        print("║" + " 🏰 RETENTION LAYER".ljust(58) + "║")
        print("║" + f"    Moat Strength: {summary['moat_strength']}%".ljust(58) + "║")
        print("║" + f"    Switching Cost: ${summary['switching_cost_money']:,}".ljust(58) + "║")
        print("║" + f"    Loyalty Tier: {summary['loyalty_tier']}".ljust(58) + "║")
        
        print("╟" + "─" * 58 + "╢")
        
        # 3. REVENUE SECTION
        print("║" + " 💰 REVENUE LAYER".ljust(58) + "║")
        print("║" + f"    Current ARR: ${summary['current_arr']:,.0f}".ljust(58) + "║")
        print("║" + f"    Progress: {summary['arr_progress']:.1f}% → $1M".ljust(58) + "║")
        print("║" + f"    Required Growth: {summary['required_growth']:.1f}%/month".ljust(58) + "║")
        
        print("╟" + "─" * 58 + "╢")
        
        # 4. INFRASTRUCTURE SECTION
        print("║" + " 🏗️ INFRASTRUCTURE LAYER".ljust(58) + "║")
        print("║" + f"    Stack Layers: {summary['infra_layers']}/10".ljust(58) + "║")
        print("║" + f"    Health Score: {summary['infra_health']}%".ljust(58) + "║")
        
        print("╠" + "═" * 58 + "╣")
        
        # PLATFORM SCORE
        bar = "█" * (score // 5) + "░" * (20 - score // 5)
        print("║" + f" 🏆 PLATFORM SCORE: [{bar}] {score}%".ljust(58) + "║")
        
        if score >= 90:
            status = "✅ MAX LEVEL ACHIEVED!"
        elif score >= 70:
            status = "⚡ PRODUCTION READY"
        elif score >= 50:
            status = "⚠️ GROWING"
        else:
            status = "🔨 BUILDING"
        
        print("║" + f"    {status}".ljust(58) + "║")
        
        print("╚" + "═" * 58 + "╝")
        
        # WIN-WIN-WIN reminder
        print("\n   🏯 \"Không đánh mà thắng\" - Win Without Fighting")
        print(f"   📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}")


def show_master_dashboard():
    """Quick function to show master dashboard."""
    dashboard = MasterDashboard()
    dashboard.print_full()


def get_platform_score() -> int:
    """Get current platform score."""
    dashboard = MasterDashboard()
    return dashboard.get_platform_score()

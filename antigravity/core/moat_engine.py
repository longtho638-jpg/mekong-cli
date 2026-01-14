"""
🏰 Moat Engine - 5 Immortal Moats for AgencyEr Retention

Makes AgencyOS irreplaceable by tracking accumulated value
that would be lost if AgencyEr switches platforms.

Usage:
    from antigravity.core.moat_engine import MoatEngine
    engine = MoatEngine()
    engine.print_moat_status()
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import json


@dataclass
class Moat:
    """Single moat definition."""
    name: str
    emoji: str
    description: str
    strength: int  # 0-100
    switching_cost: str
    metrics: Dict[str, Any] = field(default_factory=dict)


class MoatEngine:
    """
    🏰 Moat Engine
    
    Tracks the 5 Immortal Moats that make AgencyOS irreplaceable:
    1. Data Moat - All work stored here
    2. Learning Moat - AI personalized for them
    3. Network Moat - Community connections
    4. Workflow Moat - Custom automations
    5. Identity Moat - Agency DNA tied here
    """
    
    def __init__(self, storage_path: str = ".antigravity/moats"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.moats: Dict[str, Moat] = {}
        self._initialize_moats()
        self._load_data()
    
    def _initialize_moats(self):
        """Initialize the 5 Immortal Moats."""
        self.moats = {
            "data": Moat(
                name="Data Moat",
                emoji="📊",
                description="All work, clients, quotes, invoices stored here",
                strength=0,
                switching_cost="Years of data to export",
                metrics={
                    "projects": 0,
                    "clients": 0,
                    "quotes": 0,
                    "invoices": 0,
                    "total_revenue": 0,
                    "years_of_data": 0,
                },
            ),
            "learning": Moat(
                name="Learning Moat",
                emoji="🧠",
                description="AI learns your patterns, style, preferences",
                strength=0,
                switching_cost="All learned patterns lost",
                metrics={
                    "patterns_learned": 0,
                    "success_rate": 0.7,
                    "custom_agents": 0,
                    "commands_run": 0,
                },
            ),
            "network": Moat(
                name="Network Moat",
                emoji="🌐",
                description="Community connections, collaborators, referrals",
                strength=0,
                switching_cost="Lose entire network",
                metrics={
                    "collaborators": 0,
                    "referral_partners": 0,
                    "shared_skills": 0,
                    "community_reputation": "Bronze",
                },
            ),
            "workflow": Moat(
                name="Workflow Moat",
                emoji="⚡",
                description="Custom workflows, automations, integrations",
                strength=0,
                switching_cost="Rebuild all automations",
                metrics={
                    "custom_workflows": 0,
                    "custom_agents": 0,
                    "integrations": 0,
                    "hours_saved_monthly": 0,
                },
            ),
            "identity": Moat(
                name="Identity Moat",
                emoji="🏯",
                description="Agency DNA, brand, templates, personas",
                strength=0,
                switching_cost="Redefine entire identity",
                metrics={
                    "brand_configured": False,
                    "pricing_tiers": 0,
                    "templates": 0,
                    "personas": 0,
                },
            ),
        }
    
    def add_data_point(self, category: str, count: int = 1):
        """Add data to the data moat."""
        if category in self.moats["data"].metrics:
            self.moats["data"].metrics[category] += count
            self._recalculate_strength("data")
            self._save_data()
    
    def add_pattern(self, success: bool = True):
        """Add a learned pattern to the learning moat."""
        self.moats["learning"].metrics["patterns_learned"] += 1
        self.moats["learning"].metrics["commands_run"] += 1
        
        # Update success rate with moving average
        old_rate = self.moats["learning"].metrics["success_rate"]
        new_rate = (old_rate * 0.95) + (1.0 if success else 0.0) * 0.05
        self.moats["learning"].metrics["success_rate"] = new_rate
        
        self._recalculate_strength("learning")
        self._save_data()
    
    def add_connection(self, connection_type: str):
        """Add a network connection."""
        if connection_type in ["collaborators", "referral_partners", "shared_skills"]:
            self.moats["network"].metrics[connection_type] += 1
            self._recalculate_strength("network")
            self._save_data()
    
    def add_workflow(self, workflow_type: str):
        """Add a custom workflow/automation."""
        if workflow_type in self.moats["workflow"].metrics:
            self.moats["workflow"].metrics[workflow_type] += 1
            self._recalculate_strength("workflow")
            self._save_data()
    
    def configure_identity(self, item: str, value: Any = 1):
        """Configure identity moat items."""
        if item in self.moats["identity"].metrics:
            if isinstance(self.moats["identity"].metrics[item], bool):
                self.moats["identity"].metrics[item] = True
            else:
                self.moats["identity"].metrics[item] += value
            self._recalculate_strength("identity")
            self._save_data()
    
    def _recalculate_strength(self, moat_name: str):
        """Recalculate moat strength based on metrics."""
        moat = self.moats[moat_name]
        
        if moat_name == "data":
            # More data = stronger moat
            total_records = sum(
                v for k, v in moat.metrics.items() 
                if isinstance(v, (int, float)) and k != "years_of_data"
            )
            moat.strength = min(100, total_records // 10)
            
        elif moat_name == "learning":
            # More patterns = stronger
            patterns = moat.metrics["patterns_learned"]
            success = moat.metrics["success_rate"]
            moat.strength = min(100, int(patterns / 5 * success))
            
        elif moat_name == "network":
            connections = sum(
                v for v in moat.metrics.values() 
                if isinstance(v, (int, float))
            )
            moat.strength = min(100, connections * 5)
            
        elif moat_name == "workflow":
            automations = sum(
                v for v in moat.metrics.values() 
                if isinstance(v, (int, float))
            )
            moat.strength = min(100, automations * 10)
            
        elif moat_name == "identity":
            configured = sum(
                1 for v in moat.metrics.values() 
                if v and (isinstance(v, bool) or v > 0)
            )
            moat.strength = min(100, configured * 25)
    
    def get_total_strength(self) -> int:
        """Get combined moat strength (0-100)."""
        total = sum(m.strength for m in self.moats.values())
        return min(100, total // 5)
    
    def calculate_switching_cost(self) -> Dict[str, Any]:
        """Calculate the cost of switching away from AgencyOS."""
        data = self.moats["data"].metrics
        learning = self.moats["learning"].metrics
        network = self.moats["network"].metrics
        workflow = self.moats["workflow"].metrics
        
        # Time cost
        hours_to_migrate_data = data.get("projects", 0) * 2 + data.get("clients", 0) * 0.5
        hours_to_rebuild_patterns = learning.get("patterns_learned", 0) * 0.1
        hours_to_rebuild_workflows = workflow.get("custom_workflows", 0) * 8
        total_hours = hours_to_migrate_data + hours_to_rebuild_patterns + hours_to_rebuild_workflows
        
        # Money cost ($100/hour opportunity cost)
        money_cost = int(total_hours * 100)
        
        # Risk cost
        lost_connections = network.get("collaborators", 0) + network.get("referral_partners", 0)
        
        return {
            "hours": int(total_hours),
            "days": int(total_hours / 8),
            "months": round(total_hours / 160, 1),
            "money_cost": money_cost,
            "lost_patterns": learning.get("patterns_learned", 0),
            "lost_connections": lost_connections,
            "lost_workflows": workflow.get("custom_workflows", 0),
            "verdict": self._get_switching_verdict(total_hours),
        }
    
    def _get_switching_verdict(self, hours: float) -> str:
        """Get verdict on switching."""
        if hours > 500:
            return "🚫 SWITCHING = INSANE"
        elif hours > 200:
            return "⚠️ SWITCHING = Very painful"
        elif hours > 50:
            return "😟 SWITCHING = Painful"
        else:
            return "⚡ SWITCHING = Possible (strengthen moats!)"
    
    def _save_data(self):
        """Save moat data to disk."""
        data = {
            name: {
                "strength": moat.strength,
                "metrics": moat.metrics,
            }
            for name, moat in self.moats.items()
        }
        path = self.storage_path / "moats.json"
        path.write_text(json.dumps(data, indent=2))
    
    def _load_data(self):
        """Load moat data from disk."""
        try:
            path = self.storage_path / "moats.json"
            if path.exists():
                data = json.loads(path.read_text())
                for name, saved in data.items():
                    if name in self.moats:
                        self.moats[name].strength = saved.get("strength", 0)
                        self.moats[name].metrics.update(saved.get("metrics", {}))
        except Exception:
            pass
    
    def print_moat_status(self):
        """Print moat status dashboard."""
        total = self.get_total_strength()
        switching = self.calculate_switching_cost()
        
        print("\n" + "═" * 60)
        print("║" + "🏰 AGENCYOS IMMORTAL MOATS".center(58) + "║")
        print("═" * 60)
        
        for name, moat in self.moats.items():
            bar = "█" * (moat.strength // 10) + "░" * (10 - moat.strength // 10)
            print(f"\n{moat.emoji} {moat.name.upper()}: [{bar}] {moat.strength}%")
            print(f"   {moat.description}")
            # Show top metrics
            top_metrics = list(moat.metrics.items())[:3]
            for key, val in top_metrics:
                print(f"   • {key}: {val}")
        
        print("\n" + "─" * 60)
        print("💰 SWITCHING COST:")
        print(f"   • Time: {switching['hours']} hours ({switching['months']} months)")
        print(f"   • Money: ${switching['money_cost']:,}")
        print(f"   • Lost patterns: {switching['lost_patterns']}")
        print(f"   • Lost connections: {switching['lost_connections']}")
        print("\n" + "═" * 60)
        print(f"║ 🏆 TOTAL MOAT STRENGTH: {total}%".ljust(59) + "║")
        print(f"║ {switching['verdict']}".ljust(59) + "║")
        print("═" * 60)


# Global instance
_moat_engine: Optional[MoatEngine] = None

def get_moat_engine() -> MoatEngine:
    """Get global moat engine instance."""
    global _moat_engine
    if _moat_engine is None:
        _moat_engine = MoatEngine()
    return _moat_engine


def track_usage(category: str, action: str, success: bool = True):
    """Track usage to build moats automatically."""
    engine = get_moat_engine()
    
    if category == "data":
        engine.add_data_point(action)
    elif category == "learning":
        engine.add_pattern(success)
    elif category == "workflow":
        engine.add_workflow(action)

"""
🏯 Chapter 5: Thế Trận (兵勢) - Momentum & Energy
=================================================

"Thế như nước chảy" - Momentum like flowing water.

Network effects, viral growth, and flywheel.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class MomentumType(Enum):
    """Types of business momentum."""
    VIRAL = "viral"                  # Users invite users
    NETWORK = "network"              # More users = more value
    FLYWHEEL = "flywheel"            # Self-reinforcing loop
    BRAND = "brand"                  # Reputation momentum
    PRODUCT = "product"              # Product-led growth


@dataclass
class MomentumMetric:
    """A momentum metric."""
    name: str
    current_value: float
    previous_value: float
    unit: str = ""
    
    @property
    def growth_rate(self) -> float:
        if self.previous_value == 0:
            return 100.0 if self.current_value > 0 else 0.0
        return ((self.current_value - self.previous_value) / self.previous_value) * 100


@dataclass
class Flywheel:
    """A business flywheel."""
    name: str
    steps: List[str]
    current_velocity: int = 0  # 0-100
    acceleration: int = 0  # positive = speeding up


class ChapterFiveMomentum:
    """
    Chapter 5: Thế Trận - Momentum & Energy.
    
    "Thiện chiến giả, cầu chi ư thế"
    (The skilled warrior seeks victory through momentum)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.metrics: Dict[str, List[MomentumMetric]] = {}
        self.flywheels: Dict[str, Flywheel] = {}
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Demo metrics
        self.metrics["TechVenture"] = [
            MomentumMetric("MRR", 150_000, 120_000, "$"),
            MomentumMetric("Active Users", 5000, 4200, "users"),
            MomentumMetric("Viral Coefficient", 1.3, 1.1, "K"),
            MomentumMetric("NPS", 72, 65, "score"),
        ]
        
        # Demo flywheel
        self.flywheels["product_led"] = Flywheel(
            name="Product-Led Growth Flywheel",
            steps=[
                "😊 Happy Users",
                "📣 Word of Mouth",
                "👥 New Signups",
                "🎉 Great Onboarding",
                "💡 Value Discovery",
                "💰 Conversion",
            ],
            current_velocity=70,
            acceleration=5
        )
    
    def calculate_viral_coefficient(self, invites_per_user: float, conversion_rate: float) -> float:
        """Calculate viral coefficient (K)."""
        return invites_per_user * conversion_rate
    
    def analyze_momentum(self, startup_name: str) -> Dict[str, Any]:
        """Analyze overall momentum."""
        if startup_name not in self.metrics:
            return {"error": "Startup not found"}
        
        metrics = self.metrics[startup_name]
        
        # Calculate momentum score
        growth_rates = [m.growth_rate for m in metrics]
        avg_growth = sum(growth_rates) / len(growth_rates) if growth_rates else 0
        
        # Momentum interpretation
        if avg_growth > 30:
            momentum_status = "🚀 STRONG - Accelerating"
        elif avg_growth > 15:
            momentum_status = "📈 GOOD - Growing"
        elif avg_growth > 0:
            momentum_status = "➡️ STABLE - Maintaining"
        else:
            momentum_status = "📉 DECLINING - Needs attention"
        
        return {
            "startup": startup_name,
            "avg_growth_rate": avg_growth,
            "momentum_status": momentum_status,
            "metrics": [
                {
                    "name": m.name,
                    "value": m.current_value,
                    "growth": m.growth_rate
                }
                for m in metrics
            ]
        }
    
    def assess_network_effect(self, users: int, value_per_user: float) -> Dict[str, Any]:
        """Assess network effect strength."""
        # Metcalfe's law: value proportional to n²
        network_value = users * users * value_per_user / 1000
        
        return {
            "users": users,
            "network_value": network_value,
            "value_multiplier": users,  # Each user makes platform X times more valuable
            "binh_phap": "Thế như nước chảy - momentum compounds like water"
        }
    
    def analyze_flywheel(self, flywheel: Flywheel) -> Dict[str, Any]:
        """Analyze flywheel health."""
        return {
            "name": flywheel.name,
            "steps": len(flywheel.steps),
            "velocity": flywheel.current_velocity,
            "acceleration": flywheel.acceleration,
            "health": "STRONG" if flywheel.current_velocity > 60 else "BUILDING" if flywheel.current_velocity > 30 else "WEAK",
            "recommendation": "Increase velocity by improving weakest step" if flywheel.current_velocity < 60 else "Maintain and scale"
        }
    
    def identify_momentum_blockers(self, startup_name: str) -> List[str]:
        """Identify what's blocking momentum."""
        if startup_name not in self.metrics:
            return ["❓ No data available"]
        
        blockers = []
        metrics = self.metrics[startup_name]
        
        for metric in metrics:
            if metric.growth_rate < 0:
                blockers.append(f"📉 {metric.name} declining ({metric.growth_rate:.1f}%)")
            elif metric.growth_rate < 10:
                blockers.append(f"⚠️ {metric.name} slow growth ({metric.growth_rate:.1f}%)")
        
        if not blockers:
            blockers.append("✅ No major blockers - maintain momentum!")
        
        return blockers
    
    def format_dashboard(self) -> str:
        """Format Chapter 5 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 5: THẾ TRẬN (兵勢)                             ║",
            "║  Momentum, Energy & Flywheel                              ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Show metrics for first startup
        for startup_name, metrics in list(self.metrics.items())[:1]:
            analysis = self.analyze_momentum(startup_name)
            
            lines.extend([
                f"║  📊 {startup_name} MOMENTUM                     ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    {analysis['momentum_status']:<45}  ║",
                "║                                                           ║",
                "║  📈 KEY METRICS                                           ║",
            ])
            
            for metric in metrics:
                growth_icon = "📈" if metric.growth_rate > 0 else "📉"
                bar = "█" * min(10, max(0, int(metric.growth_rate / 5))) + "░" * max(0, 10 - int(metric.growth_rate / 5))
                lines.append(f"║    {growth_icon} {metric.name:<15} {bar} +{metric.growth_rate:.0f}%  ║")
        
        # Show flywheel
        for flywheel in list(self.flywheels.values())[:1]:
            fw_analysis = self.analyze_flywheel(flywheel)
            
            lines.extend([
                "║                                                           ║",
                f"║  🔄 FLYWHEEL: {flywheel.name[:30]:<30}  ║",
                "║  ─────────────────────────────────────────────────────── ║",
                f"║    ⚡ Velocity: {flywheel.current_velocity}%  │  Accel: +{flywheel.acceleration}  ║",
                f"║    📊 Status: {fw_analysis['health']:<15}                     ║",
                "║                                                           ║",
                "║    🔄 Steps:                                              ║",
            ])
            
            for i, step in enumerate(flywheel.steps[:4]):
                lines.append(f"║       {i+1}. {step:<40}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Thế như nước chảy\"                                   ║",
            "║    (Momentum like water - unstoppable)                   ║",
            "║                                                           ║",
            "║  [📈 Metrics]  [🔄 Flywheel]  [⚡ Accelerate]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Build unstoppable momentum!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch5 = ChapterFiveMomentum("Saigon Digital Hub")
    print("🏯 Chapter 5: Thế Trận")
    print("=" * 60)
    print()
    print(ch5.format_dashboard())

"""
🏯 Chapter 7: Quân Tranh (軍爭) - Speed & Maneuvering
=====================================================

"Binh quý thần tốc" - Speed is the essence of war.

First mover advantage, speed to market, agility.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class SprintStatus(Enum):
    """Sprint status."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


@dataclass
class Sprint:
    """A development sprint."""
    name: str
    goal: str
    start_date: datetime
    end_date: datetime
    status: SprintStatus = SprintStatus.PLANNING
    velocity: int = 0
    completion_rate: float = 0


@dataclass
class SpeedMetric:
    """Speed metric tracking."""
    name: str
    current: float
    target: float
    unit: str
    
    @property
    def performance(self) -> float:
        return (self.current / self.target * 100) if self.target > 0 else 0


class ChapterSevenManeuvering:
    """
    Chapter 7: Quân Tranh - Speed & Maneuvering.
    
    "Kỳ tật như phong" (Swift as the wind)
    "Kỳ từ như lâm" (Quiet as the forest)
    "Xâm lược như hỏa" (Fierce as fire in attack)
    "Bất động như sơn" (Immovable as mountain in defense)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sprints: List[Sprint] = []
        self.speed_metrics: Dict[str, SpeedMetric] = {}
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Speed metrics
        self.speed_metrics = {
            "time_to_market": SpeedMetric("Time to Market", 3, 6, "months"),
            "sprint_velocity": SpeedMetric("Sprint Velocity", 45, 40, "points"),
            "deployment_frequency": SpeedMetric("Deploy Frequency", 12, 4, "per month"),
            "lead_time": SpeedMetric("Lead Time", 2, 5, "days"),
            "mttr": SpeedMetric("MTTR", 0.5, 1, "hours"),
        }
        
        # Sample sprints
        now = datetime.now()
        self.sprints = [
            Sprint("MVP Features", "Core feature completion", 
                   now - timedelta(days=14), now, SprintStatus.COMPLETED, 42, 95),
            Sprint("Beta Launch", "Launch to 100 beta users",
                   now, now + timedelta(days=14), SprintStatus.IN_PROGRESS, 38, 60),
        ]
    
    def assess_speed(self) -> Dict[str, Any]:
        """Assess overall speed and agility."""
        metrics = list(self.speed_metrics.values())
        
        # Calculate speed score
        performances = [m.performance for m in metrics]
        avg_performance = sum(performances) / len(performances) if performances else 0
        
        # Speed classification
        if avg_performance >= 120:
            classification = "🚀 LIGHTNING FAST"
        elif avg_performance >= 100:
            classification = "⚡ FAST"
        elif avg_performance >= 80:
            classification = "🏃 ON PACE"
        else:
            classification = "🐌 TOO SLOW"
        
        return {
            "speed_score": avg_performance,
            "classification": classification,
            "metrics": {m.name: m.performance for m in metrics},
            "binh_phap": "Binh quý thần tốc - speed wins"
        }
    
    def calculate_first_mover_advantage(
        self,
        market_entry_date: datetime,
        competitor_entry_date: Optional[datetime]
    ) -> Dict[str, Any]:
        """Calculate first mover advantage."""
        if competitor_entry_date is None:
            lead_time = 365  # Assume 1 year if no competitor
        else:
            lead_time = (competitor_entry_date - market_entry_date).days
        
        # First mover advantages by lead time
        if lead_time >= 365:
            advantage = "DOMINANT - Build unassailable position"
        elif lead_time >= 180:
            advantage = "STRONG - Establish brand and distribution"
        elif lead_time >= 90:
            advantage = "MODERATE - Move fast to capture market"
        elif lead_time >= 30:
            advantage = "SLIM - Execute flawlessly"
        else:
            advantage = "MINIMAL - Consider differentiation strategy"
        
        return {
            "lead_time_days": lead_time,
            "advantage_level": advantage,
            "recommended_actions": [
                "Lock in key customers with long contracts",
                "Build switching costs rapidly",
                "Capture best distribution channels",
                "Hire key talent before competitor",
            ] if lead_time >= 90 else [
                "Focus on differentiation not speed",
                "Find underserved niche",
                "Partner rather than compete head-on",
            ]
        }
    
    def pivot_decision_matrix(
        self,
        current_traction: float,  # MRR or key metric
        burn_rate: float,
        runway_months: float,
        market_signal: str  # "strong", "weak", "mixed"
    ) -> Dict[str, Any]:
        """Help decide when to pivot."""
        # Simple decision logic
        should_pivot = False
        urgency = "LOW"
        
        if runway_months < 6 and market_signal == "weak":
            should_pivot = True
            urgency = "CRITICAL"
        elif runway_months < 9 and market_signal != "strong":
            should_pivot = True
            urgency = "HIGH"
        elif current_traction < burn_rate * 0.1 and runway_months < 12:
            should_pivot = True
            urgency = "MEDIUM"
        
        return {
            "should_consider_pivot": should_pivot,
            "urgency": urgency,
            "reasoning": [
                f"Runway: {runway_months} months",
                f"Market signal: {market_signal}",
                f"Traction vs burn: {current_traction/burn_rate*100:.0f}%",
            ],
            "binh_phap": "Cửu biến - 9 adaptations for survival",
            "options": [
                "Pivot product focus",
                "Pivot target market",
                "Pivot business model",
                "Pivot pricing",
                "Acqui-hire/merge",
            ] if should_pivot else [
                "Double down on what's working",
                "Optimize conversion funnel",
                "Expand to adjacent market",
            ]
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 7 dashboard."""
        speed = self.assess_speed()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 7: QUÂN TRANH (軍爭)                           ║",
            "║  Speed, Maneuvering & First Mover Advantage               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ⚡ SPEED SCORE: {speed['speed_score']:.0f}% - {speed['classification']:<20}  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # Speed metrics
        for name, metric in list(self.speed_metrics.items())[:5]:
            perf = metric.performance
            status = "🟢" if perf >= 100 else "🟡" if perf >= 80 else "🔴"
            lines.append(f"║    {status} {metric.name:<20} │ {metric.current}/{metric.target} {metric.unit:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏃 CURRENT SPRINTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"planning": "📋", "in_progress": "🔄", "completed": "✅", "blocked": "🚫"}
        for sprint in self.sprints[:3]:
            icon = status_icons.get(sprint.status.value, "⚪")
            lines.append(f"║    {icon} {sprint.name:<20} │ {sprint.completion_rate:.0f}% done  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚡ WIND-FOREST-FIRE-MOUNTAIN                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🌬️ Swift as WIND in execution                         ║",
            "║    🌲 Quiet as FOREST in planning                         ║",
            "║    🔥 Fierce as FIRE in attack                            ║",
            "║    🏔️ Immovable as MOUNTAIN in defense                    ║",
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Binh quý thần tốc\"                                   ║",
            "║    (In war, speed is the essence)                        ║",
            "║                                                           ║",
            "║  [⚡ Speed]  [🏃 Sprints]  [🔄 Pivot]                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Move fast, win wars!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch7 = ChapterSevenManeuvering("Saigon Digital Hub")
    print("🏯 Chapter 7: Quân Tranh")
    print("=" * 60)
    print()
    print(ch7.format_dashboard())

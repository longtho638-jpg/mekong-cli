"""
❤️ Wellness Hub - Health & Wellbeing
======================================

Central hub connecting all Wellness roles.

Integrates:
- Healthcare Marketing (healthcare_marketing.py)
- Wellness Coordinator (wellness_coordinator.py)
- Benefits Tracker (benefits_tracker.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.healthcare_marketing import HealthcareMarketing
from core.wellness_coordinator import WellnessCoordinator
from core.benefits_tracker import BenefitsTracker


@dataclass
class WellnessMetrics:
    """Department-wide metrics."""
    healthcare_clients: int
    hipaa_compliance: float
    team_wellness_score: float
    avg_stress_level: float
    active_benefits: int
    wellness_programs: int


class WellnessHub:
    """
    Wellness Hub.
    
    Health and wellbeing center.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.healthcare = HealthcareMarketing(agency_name)
        self.wellness = WellnessCoordinator(agency_name)
        self.benefits = BenefitsTracker(agency_name)
    
    def get_department_metrics(self) -> WellnessMetrics:
        """Get department-wide metrics."""
        hc_stats = self.healthcare.get_stats()
        well_stats = self.wellness.get_stats()
        ben_stats = self.benefits.get_stats()
        
        return WellnessMetrics(
            healthcare_clients=hc_stats.get("clients", 0),
            hipaa_compliance=hc_stats.get("compliance_rate", 0),
            team_wellness_score=well_stats.get("team_wellness", 0),
            avg_stress_level=well_stats.get("avg_stress", 0),
            active_benefits=ben_stats.get("benefits", 0),
            wellness_programs=well_stats.get("programs", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        wellness_icon = "🟢" if metrics.team_wellness_score >= 75 else "🟡" if metrics.team_wellness_score >= 50 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ❤️ WELLNESS HUB                                          ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🏥 Healthcare Clients: {metrics.healthcare_clients:>5}                          ║",
            f"║    📋 HIPAA Compliance:   {metrics.hipaa_compliance:>5.0f}%                         ║",
            f"║    {wellness_icon} Team Wellness:    {metrics.team_wellness_score:>5.0f}%                         ║",
            f"║    😰 Avg Stress Level:   {metrics.avg_stress_level:>5.0f}%                         ║",
            f"║    💊 Active Benefits:    {metrics.active_benefits:>5}                          ║",
            f"║    📋 Wellness Programs:  {metrics.wellness_programs:>5}                          ║",
            "║                                                           ║",
            "║  🔗 WELLNESS ROLES                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🏥 Healthcare Mktg   → Medical clients, HIPAA, SEO    ║",
            "║    🧘 Wellness Coord    → Programs, mental health        ║",
            "║    💊 Benefits Tracker  → Insurance, allowances          ║",
            "║                                                           ║",
            "║  📋 WELLNESS TEAM                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🏥 Healthcare        │ {metrics.healthcare_clients} clients, {metrics.hipaa_compliance:.0f}% HIPAA   ║",
            f"║    🧘 Wellness          │ {metrics.team_wellness_score:.0f}% score, {metrics.wellness_programs} programs  ║",
            f"║    💊 Benefits          │ {metrics.active_benefits} benefits active      ║",
            "║                                                           ║",
            "║  [🏥 Healthcare]  [🧘 Wellness]  [💊 Benefits]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Health is wealth!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = WellnessHub("Saigon Digital Hub")
    
    print("❤️ Wellness Hub")
    print("=" * 60)
    print()
    
    print(hub.format_hub_dashboard())

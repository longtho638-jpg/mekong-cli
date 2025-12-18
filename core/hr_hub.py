"""
👥 HR Hub - People Operations
===============================

Central hub connecting all HR roles.

Integrates:
- Talent Acquisition
- HR Analytics
- Compensation Manager
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.talent_acquisition import TalentAcquisition, JobType
from core.hr_analytics import HRAnalytics, Department
from core.compensation_manager import CompensationManager, PayGrade


@dataclass
class HRMetrics:
    """Department-wide metrics."""
    headcount: int
    open_jobs: int
    candidates_in_pipeline: int
    hired_this_month: int
    enps_score: float
    avg_salary: float
    attrition_risk_high: int
    benefits_active: int


class HRHub:
    """
    HR Hub.
    
    People operations center.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.talent = TalentAcquisition(agency_name)
        self.analytics = HRAnalytics(agency_name)
        self.compensation = CompensationManager(agency_name)
    
    def get_department_metrics(self) -> HRMetrics:
        """Get department-wide metrics."""
        talent_stats = self.talent.get_stats()
        analytics_stats = self.analytics.get_stats()
        comp_stats = self.compensation.get_stats()
        
        attrition = analytics_stats.get("attrition", {})
        high_risk = attrition.get("high", 0) + attrition.get("critical", 0)
        
        return HRMetrics(
            headcount=analytics_stats.get("headcount", 0),
            open_jobs=talent_stats.get("open_jobs", 0),
            candidates_in_pipeline=talent_stats.get("in_pipeline", 0),
            hired_this_month=talent_stats.get("hired", 0),
            enps_score=analytics_stats.get("enps", 0),
            avg_salary=analytics_stats.get("avg_salary", 0),
            attrition_risk_high=high_risk,
            benefits_active=comp_stats.get("benefits_count", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 HR HUB                                                ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👥 Headcount:          {metrics.headcount:>5}                          ║",
            f"║    📋 Open Jobs:          {metrics.open_jobs:>5}                          ║",
            f"║    🔍 In Pipeline:        {metrics.candidates_in_pipeline:>5}                          ║",
            f"║    ✅ Hired (Month):      {metrics.hired_this_month:>5}                          ║",
            f"║    📈 eNPS Score:         {metrics.enps_score:>+5.0f}                          ║",
            f"║    💰 Avg Salary:         ${metrics.avg_salary:>8,.0f}                    ║",
            f"║    ⚠️ High Risk:          {metrics.attrition_risk_high:>5}                          ║",
            f"║    🎁 Benefits Active:    {metrics.benefits_active:>5}                          ║",
            "║                                                           ║",
            "║  🔗 HR ROLES                                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🔍 Talent Acquisition → Jobs, candidates, hiring      ║",
            "║    📊 HR Analytics       → Metrics, eNPS, attrition      ║",
            "║    💰 Compensation Mgr   → Salary, benefits, rewards     ║",
            "║                                                           ║",
            "║  📋 HR TEAM                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🔍 Recruiting        │ {metrics.open_jobs} jobs, {metrics.candidates_in_pipeline} candidates    ║",
            f"║    📊 Analytics         │ {metrics.headcount} employees, {metrics.enps_score:+.0f} eNPS    ║",
            f"║    💰 Compensation      │ ${metrics.avg_salary:,.0f} avg salary    ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🔍 Recruit]  [👥 Employees]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - People first!                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = HRHub("Saigon Digital Hub")
    
    print("👥 HR Hub")
    print("=" * 60)
    print()
    
    # Add some recruitment data
    j1 = hub.talent.create_job("Developer", "Engineering", JobType.FULL_TIME)
    hub.talent.post_job(j1)
    
    print(hub.format_hub_dashboard())

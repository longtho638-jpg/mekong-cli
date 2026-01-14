"""
👥 HR Hub - People Operations
===============================

Central hub connecting all HR roles with their operational tools.

Integrates:
- Talent Acquisition
- HR Analytics
- Compensation Manager
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.talent_acquisition import TalentAcquisition, JobType
    from core.hr_analytics import HRAnalytics, Department
    from core.compensation_manager import CompensationManager, PayGrade
except ImportError:
    from talent_acquisition import TalentAcquisition, JobType
    from hr_analytics import HRAnalytics, Department
    from compensation_manager import CompensationManager, PayGrade

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class HRMetrics:
    """Department-wide HR metrics container."""
    headcount: int = 0
    open_jobs: int = 0
    candidates_in_pipeline: int = 0
    hired_this_month: int = 0
    enps_score: float = 0.0
    avg_salary: float = 0.0
    attrition_risk_high: int = 0
    benefits_active: int = 0


class HRHub:
    """
    HR Hub System.
    
    Orchestrates talent acquisition, employee analytics, and compensation management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing HR Hub for {agency_name}")
        try:
            self.talent = TalentAcquisition(agency_name)
            self.analytics = HRAnalytics(agency_name)
            self.compensation = CompensationManager(agency_name)
        except Exception as e:
            logger.error(f"HR Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> HRMetrics:
        """Aggregate data from all HR specialized sub-modules."""
        metrics = HRMetrics()
        
        try:
            # 1. Talent Metrics
            t_stats = self.talent.get_stats()
            metrics.open_jobs = t_stats.get("open_jobs", 0)
            metrics.candidates_in_pipeline = t_stats.get("in_pipeline", 0)
            metrics.hired_this_month = t_stats.get("hired", 0)
            
            # 2. Analytics Metrics
            a_stats = self.analytics.get_aggregate_stats()
            metrics.headcount = a_stats.get("headcount", 0)
            metrics.enps_score = float(a_stats.get("avg_enps", 0.0))
            metrics.avg_salary = float(a_stats.get("avg_salary", 0.0))
            # Placeholder for complex attrition logic
            metrics.attrition_risk_high = 0 
            
            # 3. Compensation Metrics
            c_stats = self.compensation.get_aggregate_stats()
            metrics.benefits_active = c_stats.get("total_records", 0) # Assumed key
            
        except Exception as e:
            logger.warning(f"Error aggregating HR metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the HR Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 HR HUB{' ' * 42}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 CONSOLIDATED PEOPLE METRICS                           ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    👥 Headcount:          {m.headcount:>5}                          ║",
            f"║    📋 Open Jobs:          {m.open_jobs:>5}                          ║",
            f"║    🔍 In Pipeline:        {m.candidates_in_pipeline:>5}                          ║",
            f"║    ✅ Hired (Month):      {m.hired_this_month:>5}                          ║",
            f"║    📈 eNPS Score:         {m.enps_score:>+5.0f}                          ║",
            f"║    💰 Avg Salary:         ${m.avg_salary:>8,.0f}                    ║",
            f"║    ⚠️ High Risk:          {m.attrition_risk_high:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🔍 Talent (Hiring) │ 📊 Analytics (eNPS) │ 💰 Comp (Pay)║",
            "║                                                           ║",
            "║  [📊 Reports]  [🔍 Recruit]  [👥 Directory]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - People!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👥 Initializing HR Hub...")
    print("=" * 60)
    
    try:
        hub = HRHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")

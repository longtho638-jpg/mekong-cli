"""
⚙️ Engineering Hub - Department Integration
=============================================

Central hub connecting all Engineering roles with their operational tools.

Integrates:
- Software Engineer
- DevOps Engineer
- QA Engineer
- Data Engineer
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.devops_engineer import DevOpsEngineer, EnvironmentType
    from core.qa_engineer import QAEngineer, BugSeverity
    from core.data_engineer import DataEngineer, PipelineType, DataSource
except ImportError:
    from devops_engineer import DevOpsEngineer, EnvironmentType
    from qa_engineer import QAEngineer, BugSeverity
    from data_engineer import DataEngineer, PipelineType, DataSource

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class EngineeringMetrics:
    """Department-wide metrics container."""
    total_deployments: int = 0
    deployment_success_rate: float = 0.0
    total_bugs: int = 0
    open_bugs: int = 0
    test_pass_rate: float = 0.0
    pipelines: int = 0
    records_processed: int = 0
    services_healthy: int = 0


class EngineeringHub:
    """
    Engineering Hub System.
    
    Orchestrates infrastructure, quality assurance, and data engineering.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Engineering Hub for {agency_name}")
        try:
            self.devops = DevOpsEngineer(agency_name)
            self.qa = QAEngineer(agency_name)
            self.data = DataEngineer(agency_name)
        except Exception as e:
            logger.error(f"Engineering Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> EngineeringMetrics:
        """Aggregate data from all engineering sub-modules."""
        metrics = EngineeringMetrics()
        
        try:
            # 1. DevOps Metrics
            d_stats = self.devops.get_aggregate_stats()
            metrics.total_deployments = d_stats.get("total_deployments", 0)
            metrics.deployment_success_rate = float(d_stats.get("success_rate", 0.0))
            metrics.services_healthy = d_stats.get("healthy_count", 0)
            
            # 2. QA Metrics
            q_stats = self.qa.get_stats()
            metrics.total_bugs = q_stats.get("total_bugs", 0)
            metrics.open_bugs = q_stats.get("open_bugs", 0)
            metrics.test_pass_rate = float(q_stats.get("pass_rate", 0.0))
            
            # 3. Data Metrics
            da_stats = self.data.get_aggregate_stats()
            metrics.pipelines = da_stats.get("pipeline_count", 0)
            metrics.records_processed = da_stats.get("total_records", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating Engineering metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Engineering Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ ENGINEERING HUB{' ' * 41}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PRODUCTION & QUALITY METRICS                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🚀 Deployments:        {m.total_deployments:>5}                          ║",
            f"║    ✅ Deploy Success:     {m.deployment_success_rate:>5.0f}%                         ║",
            f"║    🐛 Open Bugs:          {m.open_bugs:>5}                          ║",
            f"║    🧪 Test Pass Rate:     {m.test_pass_rate:>5.0f}%                         ║",
            f"║    🔄 Data Pipelines:     {m.pipelines:>5}                          ║",
            f"║    📊 Records Processed:  {m.records_processed:>5}                          ║",
            f"║    🟢 Healthy Services:   {m.services_healthy:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🔧 DevOps (Infra)   │ 🧪 QA (Testing)   │ 📊 Data (Pipelines) ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🚀 Deploy]  [🧪 Run Tests]  [⚙️ Setup]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("⚙️ Initializing Engineering Hub...")
    print("=" * 60)
    
    try:
        hub = EngineeringHub("Saigon Digital Hub")
        # Sample interaction
        hub.devops.monitor_service("API", "https://api.vn", 99.9)
        
        print("\n" + hub.format_hub_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")

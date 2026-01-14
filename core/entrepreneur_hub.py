"""
🚀 Entrepreneur Hub - Business Development
=============================================

Central hub connecting all Entrepreneur roles with their operational tools.

Integrates:
- Startup Launcher
- Strategy Officer
- Operations Manager
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.startup_launcher import StartupLauncher, VentureType, VentureStage
    from core.strategy_officer import StrategyOfficer, StrategicPillar, InitiativeStatus
    from core.operations_manager import OperationsManager, OperationalArea, ResourceType
except ImportError:
    from startup_launcher import StartupLauncher, VentureType, VentureStage
    from strategy_officer import StrategyOfficer, StrategicPillar, InitiativeStatus
    from operations_manager import OperationsManager, OperationalArea, ResourceType

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class EntrepreneurMetrics:
    """Department-wide metrics container."""
    ventures: int = 0
    total_users: int = 0
    venture_revenue: float = 0.0
    objectives: int = 0
    okr_progress: float = 0.0
    initiatives: int = 0
    processes: int = 0
    avg_efficiency: float = 0.0
    resource_utilization: float = 0.0


class EntrepreneurHub:
    """
    Entrepreneur Hub System.
    
    Orchestrates business growth, strategic planning, and operational excellence.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Entrepreneur Hub for {agency_name}")
        try:
            self.launcher = StartupLauncher(agency_name)
            self.strategy = StrategyOfficer(agency_name)
            self.operations = OperationsManager(agency_name)
        except Exception as e:
            logger.error(f"Entrepreneur Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> EntrepreneurMetrics:
        """Aggregate data from all business development sub-modules."""
        metrics = EntrepreneurMetrics()
        
        try:
            # 1. Launcher Metrics
            l_stats = self.launcher.get_stats()
            metrics.ventures = l_stats.get("ventures", 0)
            metrics.total_users = l_stats.get("users", 0)
            metrics.venture_revenue = float(l_stats.get("revenue", 0.0))
            
            # 2. Strategy Metrics
            s_stats = self.strategy.get_stats()
            metrics.objectives = s_stats.get("objectives", 0)
            metrics.okr_progress = float(s_stats.get("avg_progress", 0.0))
            metrics.initiatives = s_stats.get("initiatives", 0)
            
            # 3. Operations Metrics
            o_stats = self.operations.get_stats()
            metrics.processes = o_stats.get("processes", 0)
            metrics.avg_efficiency = float(o_stats.get("avg_efficiency", 0.0))
            metrics.resource_utilization = float(o_stats.get("utilization", 0.0))
            
        except Exception as e:
            logger.warning(f"Error aggregating Entrepreneur metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Entrepreneur Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 ENTREPRENEUR HUB{' ' * 39}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 STRATEGIC GROWTH METRICS                              ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🚀 Active Ventures:    {m.ventures:>5}                          ║",
            f"║    👥 Total Users:        {m.total_users:>8,}                       ║",
            f"║    💰 Venture Revenue:    ${m.venture_revenue:>10,.0f}                  ║",
            f"║    🎯 OKR Objectives:     {m.objectives:>5}                          ║",
            f"║    📈 OKR Progress:       {m.okr_progress:>5.0f}%                         ║",
            f"║    ⚡ Initiatives:        {m.initiatives:>5}                          ║",
            f"║    🔄 Processes:          {m.processes:>5}                          ║",
            f"║    ⚙️ Efficiency:         {m.avg_efficiency:>5.0f}%                         ║",
            f"║    📦 Utilization:        {m.resource_utilization:>5.0f}%                         ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🚀 Launcher (MVP) │ 🎯 Strategy (Vision) │ ⚙️ Ops (SOPs) ║",
            "║                                                           ║",
            "║  [📊 Reports]  [🚀 Launch]  [🎯 OKRs]  [⚙️ Operations]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Scale!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🚀 Initializing Entrepreneur Hub...")
    print("=" * 60)
    
    try:
        hub = EntrepreneurHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")

"""
📋 Administrative Hub - Department Integration
================================================

Central hub connecting all Administrative roles.

Integrates:
- AI Executive Assistant
- Virtual Office Manager
- Data Automation Specialist
"""

import sys
import os
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add project root to path for imports if running directly
if __name__ == "__main__":
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from core.ai_executive_assistant import AIExecutiveAssistant, TaskPriority, MeetingType
    from core.virtual_office_manager import VirtualOfficeManager, ResourceType, ExpenseCategory
    from core.data_automation import DataAutomationSpecialist, DataSource, TriggerType
except ImportError:
    # Fallback for direct execution if sys.path hack fails or in different env
    try:
        from ai_executive_assistant import AIExecutiveAssistant, TaskPriority, MeetingType
        from virtual_office_manager import VirtualOfficeManager, ResourceType, ExpenseCategory
        from data_automation import DataAutomationSpecialist, DataSource, TriggerType
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        raise


@dataclass
class AdminMetrics:
    """Department-wide metrics container."""
    pending_tasks: int = 0
    today_meetings: int = 0
    monthly_costs: float = 0.0
    active_resources: int = 0
    automation_workflows: int = 0
    records_processed: int = 0
    error_rate: float = 0.0


class AdministrativeHub:
    """
    Administrative Hub System.
    
    Orchestrates administrative roles and aggregates metrics.
    """
    
    def __init__(self, agency_name: str, executive: str = "CEO"):
        self.agency_name = agency_name
        self.executive = executive
        
        logger.info(f"Initializing Administrative Hub for {agency_name}")
        
        try:
            # Initialize role modules
            self.ea = AIExecutiveAssistant(agency_name, executive)
            self.office = VirtualOfficeManager(agency_name)
            self.automation = DataAutomationSpecialist(agency_name)
        except Exception as e:
            logger.error(f"Error initializing sub-modules: {e}")
            raise

    def get_department_metrics(self) -> AdminMetrics:
        """
        Get aggregated department-wide metrics.
        Handles failures in sub-modules gracefully.
        """
        metrics = AdminMetrics()
        
        # 1. EA Metrics
        try:
            ea_brief = self.ea.get_daily_brief()
            metrics.pending_tasks = ea_brief.get("pending_tasks", 0)
            metrics.today_meetings = ea_brief.get("today_meetings", 0)
        except Exception as e:
            logger.warning(f"Failed to fetch EA metrics: {e}")

        # 2. Office Metrics
        try:
            office_costs = self.office.get_monthly_costs()
            metrics.monthly_costs = office_costs.get("grand_total", 0.0)
            # Safe access to resources dict
            metrics.active_resources = len([
                r for r in getattr(self.office, 'resources', {}).values() 
                if getattr(r, 'is_active', False)
            ])
        except Exception as e:
            logger.warning(f"Failed to fetch Office metrics: {e}")

        # 3. Automation Metrics
        try:
            auto_stats = self.automation.get_stats()
            metrics.automation_workflows = auto_stats.get("total_workflows", 0)
            metrics.records_processed = auto_stats.get("total_records", 0)
            metrics.error_rate = auto_stats.get("error_rate", 0.0)
        except Exception as e:
            logger.warning(f"Failed to fetch Automation metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Hub Dashboard."""
        metrics = self.get_department_metrics()
        
        # Helper for cleaner string building
        def _row(label, value, unit=""):
            return f"║    {label:<20} {value:>10} {unit:<22} ║"

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 ADMINISTRATIVE HUB{' ' * 35}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📋 Pending Tasks:      {metrics.pending_tasks:>5}                          ║",
            f"║    📅 Today's Meetings:   {metrics.today_meetings:>5}                          ║",
            f"║    💰 Monthly Costs:      ${metrics.monthly_costs:>9,.0f}                   ║",
            f"║    💻 Active Resources:   {metrics.active_resources:>5}                          ║",
            f"║    ⚡ Workflows:          {metrics.automation_workflows:>5}                          ║",
            f"║    📊 Records Processed:  {metrics.records_processed:>8,}                       ║",
            f"║    ⚠️ Error Rate:         {metrics.error_rate:>5.1f}%                         ║",
            "║                                                           ║",
            "║  🔗 ADMINISTRATIVE ROLES                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🤖 AI Executive Asst  → Tasks, meetings, emails        ║",
            "║    🏢 Virtual Office Mgr → Resources, expenses            ║",
            "║    ⚡ Data Automation    → Workflows, integrations        ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🤖 EA                 │ {metrics.pending_tasks} tasks, {metrics.today_meetings} meetings   ║",
            f"║    🏢 Office             │ {metrics.active_resources} resources, ${metrics.monthly_costs:,.0f}/mo  ║",
            f"║    ⚡ Automation         │ {metrics.automation_workflows} workflows running     ║",
            "║                                                           ║",
            "║  [📊 Reports]  [⚙️ Settings]  [🤖 Automate]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Operations!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Administrative Hub...")
    print("=" * 60)
    
    try:
        hub = AdministrativeHub("Saigon Digital Hub", "Khoa Nguyen")
        
        # Simulate data creation safely
        try:
            hub.ea.create_task("Review report", TaskPriority.HIGH, 1)
            hub.ea.schedule_meeting("Team Sync", MeetingType.TEAM, ["Team"], 2)
        except AttributeError:
            logger.warning("Simulated EA methods missing or different")

        try:
            hub.office.add_resource("Slack", ResourceType.SOFTWARE, 150, 10)
        except AttributeError:
            logger.warning("Simulated Office methods missing or different")
            
        try:
            hub.automation.create_workflow("Lead Import", DataSource.FORM, DataSource.CRM, TriggerType.WEBHOOK)
        except AttributeError:
            logger.warning("Simulated Automation methods missing or different")
        
        print("\n" + hub.format_hub_dashboard())
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Ensure all dependency modules are present in core/")
    except Exception as e:
        print(f"❌ Runtime Error: {e}")

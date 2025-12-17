"""
📋 Administrative Hub - Department Integration
================================================

Central hub connecting all Administrative roles.

Integrates:
- AI Executive Assistant
- Virtual Office Manager
- Data Automation Specialist
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.ai_executive_assistant import AIExecutiveAssistant, TaskPriority, MeetingType
from core.virtual_office_manager import VirtualOfficeManager, ResourceType, ExpenseCategory
from core.data_automation import DataAutomationSpecialist, DataSource, TriggerType


@dataclass
class AdminMetrics:
    """Department-wide metrics."""
    pending_tasks: int
    today_meetings: int
    monthly_costs: float
    active_resources: int
    automation_workflows: int
    records_processed: int
    error_rate: float


class AdministrativeHub:
    """
    Administrative Hub.
    
    Connects all admin roles.
    """
    
    def __init__(self, agency_name: str, executive: str = "CEO"):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.ea = AIExecutiveAssistant(agency_name, executive)
        self.office = VirtualOfficeManager(agency_name)
        self.automation = DataAutomationSpecialist(agency_name)
    
    def get_department_metrics(self) -> AdminMetrics:
        """Get department-wide metrics."""
        ea_brief = self.ea.get_daily_brief()
        office_costs = self.office.get_monthly_costs()
        auto_stats = self.automation.get_stats()
        
        return AdminMetrics(
            pending_tasks=ea_brief.get("pending_tasks", 0),
            today_meetings=ea_brief.get("today_meetings", 0),
            monthly_costs=office_costs.get("grand_total", 0),
            active_resources=len([r for r in self.office.resources.values() if r.is_active]),
            automation_workflows=auto_stats.get("total_workflows", 0),
            records_processed=auto_stats.get("total_records", 0),
            error_rate=auto_stats.get("error_rate", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 ADMINISTRATIVE HUB                                    ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Pending Tasks:      {metrics.pending_tasks:>5}                          ║",
            f"║    📅 Today's Meetings:   {metrics.today_meetings:>5}                          ║",
            f"║    💰 Monthly Costs:      ${metrics.monthly_costs:>10,.0f}                   ║",
            f"║    💻 Active Resources:   {metrics.active_resources:>5}                          ║",
            f"║    ⚡ Workflows:          {metrics.automation_workflows:>5}                          ║",
            f"║    📊 Records Processed:  {metrics.records_processed:>8,}                       ║",
            f"║    ⚠️ Error Rate:         {metrics.error_rate:>5.1f}%                         ║",
            "║                                                           ║",
            "║  🔗 ADMINISTRATIVE ROLES                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🤖 AI Executive Asst  → Tasks, meetings, emails       ║",
            "║    🏢 Virtual Office Mgr → Resources, expenses           ║",
            "║    ⚡ Data Automation    → Workflows, integrations       ║",
            "║                                                           ║",
            "║  📋 TEAM STATS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🤖 EA                 │ {metrics.pending_tasks} tasks, {metrics.today_meetings} meetings   ║",
            f"║    🏢 Office             │ {metrics.active_resources} resources, ${metrics.monthly_costs:,.0f}/mo  ║",
            f"║    ⚡ Automation         │ {metrics.automation_workflows} workflows running     ║",
            "║                                                           ║",
            "║  [📊 Reports]  [⚙️ Settings]  [🤖 Automate]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Operations excellence!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = AdministrativeHub("Saigon Digital Hub", "Khoa Nguyen")
    
    print("📋 Administrative Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.ea.create_task("Review report", TaskPriority.HIGH, 1)
    hub.ea.schedule_meeting("Team Sync", MeetingType.TEAM, ["Team"], 2)
    hub.office.add_resource("Slack", ResourceType.SOFTWARE, 150, 10)
    hub.automation.create_workflow("Lead Import", DataSource.FORM, DataSource.CRM, TriggerType.WEBHOOK)
    
    print(hub.format_hub_dashboard())

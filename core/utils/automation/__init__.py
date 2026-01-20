"""
Data Automation Specialist Facade and Dashboard.
"""
import logging
from typing import Any, Dict

from .models import (
    AutomationWorkflow,
    DataImport,
    DataSource,
    IntegrationSync,
    TriggerType,
    WorkflowStatus,
)
from .sync import SyncManager
from .workflow import WorkflowManager

logger = logging.getLogger(__name__)

class DataAutomationSpecialist(WorkflowManager, SyncManager):
    """
    Data Automation Specialist System.
    Zero manual data work by orchestrating workflows, imports, and integrations.
    """

    def __init__(self, agency_name: str):
        WorkflowManager.__init__(self, agency_name)
        SyncManager.__init__(self)
        logger.info(f"Data Automation system initialized for {agency_name}")

    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level automation performance metrics."""
        total_runs = sum(w.runs_count for w in self.workflows.values())
        total_errs = sum(w.error_count for w in self.workflows.values())
        total_recs = sum(w.records_processed for w in self.workflows.values())

        return {
            "workflow_count": len(self.workflows),
            "total_records": total_recs,
            "error_rate": (total_errs / total_runs * 100) if total_runs else 0.0,
            "sync_count": len(self.syncs),
        }

    def format_dashboard(self) -> str:
        """Render the Data Automation Dashboard."""
        stats = self.get_aggregate_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚡ DATA AUTOMATION DASHBOARD{' ' * 31}║",
            f"║  {stats['workflow_count']} workflows │ {stats['total_records']:,} records │ {stats['error_rate']:.1f}% error rate{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE WORKFLOWS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        status_icons = {"active": "🟢", "paused": "⏸️", "error": "🔴", "disabled": "⚪"}
        src_icons = {"crm": "👥", "spreadsheet": "📊", "api": "🔌", "email": "📧", "form": "📝", "database": "🗄️"}

        for w in list(self.workflows.values())[:5]:
            s_icon = status_icons.get(w.status.value, "⚪")
            src_icon = src_icons.get(w.source.value, "📦")
            dst_icon = src_icons.get(w.destination.value, "📦")
            name_disp = (w.name[:15] + "..") if len(w.name) > 17 else w.name
            lines.append(f"║  {s_icon} {name_disp:<17} │ {src_icon}→{dst_icon} │ {w.records_processed:>6} recs  ║")

        lines.extend(["║                                                           ║", "║  🔗 APP INTEGRATIONS                                      ║", "║  ───────────────────────────────────────────────────────  ║"])
        for s in list(self.syncs.values())[:3]:
            arr = "↔️" if s.sync_type == "two_way" else "→ "
            lines.append(f"║  🟢 {s.app_a[:10]:<10} {arr} {s.app_b[:10]:<10} │ {s.synced_records:>6} records synced ║")

        lines.extend([
            "║                                                           ║",
            "║  [⚡ Workflows]  [🔗 Syncs]  [📥 Manual Import]          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Automation!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)

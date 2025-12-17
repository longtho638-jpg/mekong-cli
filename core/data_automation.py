"""
⚡ Data Automation Specialist - Smart Data Ops
================================================

Automate data entry and processing.
Zero manual work!

Roles:
- Data import/export
- Automation workflows
- Data validation
- Integration sync
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class WorkflowStatus(Enum):
    """Workflow status."""
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    DISABLED = "disabled"


class DataSource(Enum):
    """Data sources."""
    CRM = "crm"
    SPREADSHEET = "spreadsheet"
    API = "api"
    EMAIL = "email"
    FORM = "form"
    DATABASE = "database"


class TriggerType(Enum):
    """Automation trigger types."""
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"
    MANUAL = "manual"


@dataclass
class AutomationWorkflow:
    """An automation workflow."""
    id: str
    name: str
    source: DataSource
    destination: DataSource
    trigger: TriggerType
    status: WorkflowStatus = WorkflowStatus.ACTIVE
    runs_count: int = 0
    records_processed: int = 0
    last_run: Optional[datetime] = None
    error_count: int = 0


@dataclass
class DataImport:
    """A data import job."""
    id: str
    source: str
    destination: str
    records: int
    success: int = 0
    errors: int = 0
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


@dataclass
class IntegrationSync:
    """An integration sync."""
    id: str
    app_a: str
    app_b: str
    sync_type: str  # one_way, two_way
    last_sync: datetime = field(default_factory=datetime.now)
    synced_records: int = 0
    is_active: bool = True


class DataAutomationSpecialist:
    """
    Data Automation Specialist.
    
    Zero manual data work.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, AutomationWorkflow] = {}
        self.imports: List[DataImport] = []
        self.syncs: Dict[str, IntegrationSync] = {}
    
    def create_workflow(
        self,
        name: str,
        source: DataSource,
        destination: DataSource,
        trigger: TriggerType
    ) -> AutomationWorkflow:
        """Create an automation workflow."""
        workflow = AutomationWorkflow(
            id=f"WFL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            source=source,
            destination=destination,
            trigger=trigger
        )
        self.workflows[workflow.id] = workflow
        return workflow
    
    def run_workflow(self, workflow: AutomationWorkflow, records: int, errors: int = 0):
        """Run a workflow."""
        workflow.runs_count += 1
        workflow.records_processed += records
        workflow.error_count += errors
        workflow.last_run = datetime.now()
        
        if errors > 0:
            workflow.status = WorkflowStatus.ERROR
    
    def create_import(
        self,
        source: str,
        destination: str,
        records: int
    ) -> DataImport:
        """Create a data import."""
        imp = DataImport(
            id=f"IMP-{uuid.uuid4().hex[:6].upper()}",
            source=source,
            destination=destination,
            records=records
        )
        self.imports.append(imp)
        return imp
    
    def complete_import(self, imp: DataImport, success: int, errors: int = 0):
        """Complete an import."""
        imp.success = success
        imp.errors = errors
        imp.completed_at = datetime.now()
    
    def setup_sync(
        self,
        app_a: str,
        app_b: str,
        sync_type: str = "two_way"
    ) -> IntegrationSync:
        """Set up integration sync."""
        sync = IntegrationSync(
            id=f"SNC-{uuid.uuid4().hex[:6].upper()}",
            app_a=app_a,
            app_b=app_b,
            sync_type=sync_type
        )
        self.syncs[sync.id] = sync
        return sync
    
    def run_sync(self, sync: IntegrationSync, records: int):
        """Run a sync."""
        sync.synced_records += records
        sync.last_sync = datetime.now()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get automation statistics."""
        active_workflows = sum(1 for w in self.workflows.values() if w.status == WorkflowStatus.ACTIVE)
        total_records = sum(w.records_processed for w in self.workflows.values())
        total_runs = sum(w.runs_count for w in self.workflows.values())
        error_rate = sum(w.error_count for w in self.workflows.values()) / total_runs if total_runs else 0
        
        return {
            "total_workflows": len(self.workflows),
            "active": active_workflows,
            "total_records": total_records,
            "total_runs": total_runs,
            "error_rate": error_rate * 100,
            "syncs": len(self.syncs),
            "imports": len(self.imports)
        }
    
    def format_dashboard(self) -> str:
        """Format automation dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚡ DATA AUTOMATION SPECIALIST                            ║",
            f"║  {stats['total_workflows']} workflows │ {stats['total_records']:,} records │ {stats['error_rate']:.1f}% errors  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 AUTOMATION WORKFLOWS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"active": "🟢", "paused": "⏸️", "error": "🔴", "disabled": "⚪"}
        source_icons = {"crm": "👥", "spreadsheet": "📊", "api": "🔌",
                       "email": "📧", "form": "📝", "database": "🗄️"}
        
        for workflow in list(self.workflows.values())[:5]:
            s_icon = status_icons.get(workflow.status.value, "⚪")
            src_icon = source_icons.get(workflow.source.value, "📦")
            dst_icon = source_icons.get(workflow.destination.value, "📦")
            
            lines.append(f"║  {s_icon} {workflow.name[:15]:<15} │ {src_icon}→{dst_icon} │ {workflow.records_processed:>6} recs  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🔗 INTEGRATIONS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for sync in list(self.syncs.values())[:4]:
            status = "🟢" if sync.is_active else "🔴"
            arrow = "↔️" if sync.sync_type == "two_way" else "→"
            lines.append(f"║  {status} {sync.app_a[:10]:<10} {arrow} {sync.app_b[:10]:<10} │ {sync.synced_records:>6} synced  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📥 RECENT IMPORTS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for imp in self.imports[-3:]:
            status = "✅" if imp.completed_at else "🔄"
            success_rate = (imp.success / imp.records * 100) if imp.records else 0
            lines.append(f"║  {status} {imp.source[:12]:<12} → {imp.destination[:12]:<12} │ {success_rate:>3.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 AUTOMATION STATS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    ⚡ Total Runs:       {stats['total_runs']:>8}                      ║",
            f"║    📊 Records Processed: {stats['total_records']:>8}                      ║",
            f"║    🔗 Active Syncs:     {stats['syncs']:>8}                      ║",
            "║                                                           ║",
            "║  [⚡ Workflows]  [🔗 Syncs]  [📥 Import]                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Zero manual work!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    das = DataAutomationSpecialist("Saigon Digital Hub")
    
    print("⚡ Data Automation Specialist")
    print("=" * 60)
    print()
    
    w1 = das.create_workflow("Lead Import", DataSource.FORM, DataSource.CRM, TriggerType.WEBHOOK)
    w2 = das.create_workflow("Daily Report", DataSource.DATABASE, DataSource.SPREADSHEET, TriggerType.SCHEDULE)
    w3 = das.create_workflow("Email Parser", DataSource.EMAIL, DataSource.CRM, TriggerType.EVENT)
    
    das.run_workflow(w1, 250, 2)
    das.run_workflow(w2, 1500, 0)
    das.run_workflow(w3, 85, 0)
    
    das.setup_sync("HubSpot", "Slack", "one_way")
    das.setup_sync("Stripe", "QuickBooks", "two_way")
    
    i1 = das.create_import("clients.csv", "HubSpot CRM", 500)
    das.complete_import(i1, 495, 5)
    
    print(das.format_dashboard())

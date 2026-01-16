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

import uuid
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WorkflowStatus(Enum):
    """Execution status of an automation workflow."""
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    DISABLED = "disabled"


class DataSource(Enum):
    """Available data sources and destinations."""
    CRM = "crm"
    SPREADSHEET = "spreadsheet"
    API = "api"
    EMAIL = "email"
    FORM = "form"
    DATABASE = "database"


class TriggerType(Enum):
    """Types of triggers that initiate automation."""
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"
    MANUAL = "manual"


@dataclass
class AutomationWorkflow:
    """An automation workflow entity."""
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
    """A single data import batch entity."""
    id: str
    source: str
    destination: str
    records: int
    success: int = 0
    errors: int = 0
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.records < 0:
            raise ValueError("Record count cannot be negative")


@dataclass
class IntegrationSync:
    """A continuous integration sync between two applications."""
    id: str
    app_a: str
    app_b: str
    sync_type: str  # one_way, two_way
    last_sync: datetime = field(default_factory=datetime.now)
    synced_records: int = 0
    is_active: bool = True


class DataAutomationSpecialist:
    """
    Data Automation Specialist System.
    
    Zero manual data work by orchestrating workflows, imports, and integrations.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.workflows: Dict[str, AutomationWorkflow] = {}
        self.imports: List[DataImport] = []
        self.syncs: Dict[str, IntegrationSync] = {}
        logger.info(f"Data Automation system initialized for {agency_name}")

    def create_workflow(
        self,
        name: str,
        source: DataSource,
        destination: DataSource,
        trigger: TriggerType
    ) -> AutomationWorkflow:
        """Register a new automated data workflow."""
        if not name:
            raise ValueError("Workflow name required")

        workflow = AutomationWorkflow(
            id=f"WFL-{uuid.uuid4().hex[:6].upper()}",
            name=name, source=source, destination=destination, trigger=trigger
        )
        self.workflows[workflow.id] = workflow
        logger.info(f"Workflow created: {name} ({source.value} -> {destination.value})")
        return workflow

    def execute_workflow(self, workflow_id: str, records: int, errors: int = 0) -> bool:
        """Simulate execution of a specific workflow."""
        if workflow_id not in self.workflows:
            return False

        w = self.workflows[workflow_id]
        w.runs_count += 1
        w.records_processed += max(0, records)
        w.error_count += max(0, errors)
        w.last_run = datetime.now()

        if errors > 0:
            w.status = WorkflowStatus.ERROR
            logger.error(f"Workflow {w.name} finished with {errors} errors")
        else:
            logger.info(f"Workflow {w.name} processed {records} records successfully")
        return True

    def setup_sync(self, app_a: str, app_b: str, sync_type: str = "two_way") -> IntegrationSync:
        """Define a persistent sync connection between two external apps."""
        sync = IntegrationSync(
            id=f"SNC-{uuid.uuid4().hex[:6].upper()}",
            app_a=app_a, app_b=app_b, sync_type=sync_type
        )
        self.syncs[sync.id] = sync
        logger.info(f"Sync established: {app_a} {sync_type} {app_b}")
        return sync

    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level automation performance metrics."""
        total_runs = sum(w.runs_count for w in self.workflows.values())
        total_errs = sum(w.error_count for w in self.workflows.values())
        total_recs = sum(w.records_processed for w in self.workflows.values())

        return {
            "workflow_count": len(self.workflows),
            "total_records": total_recs,
            "error_rate": (total_errs / total_runs * 100) if total_runs else 0.0,
            "sync_count": len(self.syncs)
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
            name_disp = (w.name[:15] + '..') if len(w.name) > 17 else w.name

            lines.append(f"║  {s_icon} {name_disp:<17} │ {src_icon}→{dst_icon} │ {w.records_processed:>6} recs  ║")

        lines.extend([
            "║                                                           ║",
            "║  🔗 APP INTEGRATIONS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        for s in list(self.syncs.values())[:3]:
            arr = "↔️" if s.sync_type == "two_way" else "→ "
            lines.append(f"║  🟢 {s.app_a[:10]:<10} {arr} {s.app_b[:10]:<10} │ {s.synced_records:>6} records synced ║")

        lines.extend([
            "║                                                           ║",
            "║  [⚡ Workflows]  [🔗 Syncs]  [📥 Manual Import]          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Automation!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("⚡ Initializing Data Automation System...")
    print("=" * 60)

    try:
        das_system = DataAutomationSpecialist("Saigon Digital Hub")

        # Create and run
        w1 = das_system.create_workflow("Leads", DataSource.FORM, DataSource.CRM, TriggerType.WEBHOOK)
        das_system.execute_workflow(w1.id, 500, 2)

        das_system.setup_sync("Stripe", "QuickBooks")

        print("\n" + das_system.format_dashboard())

    except Exception as e:
        logger.error(f"Automation Error: {e}")

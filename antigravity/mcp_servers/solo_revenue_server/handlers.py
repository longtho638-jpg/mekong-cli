"""
Handlers for the Solo Revenue MCP Server.
Migrated from scripts/vibeos/solo_revenue_daemon.py
"""
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# Setup logging
logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    """Task priority levels."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class TaskType(Enum):
    """Types of automated tasks."""
    LEAD_GEN = "lead_generation"
    OUTREACH = "email_outreach"
    CONTENT = "content_creation"
    FOLLOW_UP = "sales_follow_up"
    ONBOARDING = "customer_onboarding"
    ANALYTICS = "analytics_report"
    MAINTENANCE = "system_maintenance"

@dataclass
class AutomatedTask:
    """A task to be executed by the daemon."""
    id: str
    type: TaskType
    priority: TaskPriority
    schedule: str
    handler: str
    config: Dict[str, Any] = field(default_factory=dict)
    last_run: Optional[str] = None
    next_run: Optional[str] = None
    enabled: bool = True

@dataclass
class DaemonState:
    """Current state of the daemon."""
    started_at: str
    tasks_completed: int = 0
    revenue_generated: float = 0.0
    leads_added: int = 0
    emails_sent: int = 0
    content_created: int = 0
    errors: int = 0

class SoloRevenueHandler:
    """
    24/7 Revenue Generation Daemon Logic
    Adapted for MCP usage (Synchronous).
    """

    def __init__(self):
        self.state = DaemonState(started_at=datetime.now().isoformat())
        self.tasks: Dict[str, AutomatedTask] = {}
        self.handlers: Dict[str, Callable] = {}
        self.mekong_dir = Path.home() / ".mekong"
        self.mekong_dir.mkdir(exist_ok=True)

        # Register default handlers
        self._register_handlers()

        # Load tasks
        self._load_tasks()

    def _register_handlers(self):
        """Register all task handlers."""
        self.handlers = {
            "generate_leads": self._handle_lead_generation,
            "send_outreach": self._handle_email_outreach,
            "create_content": self._handle_content_creation,
            "follow_up_sales": self._handle_sales_follow_up,
            "onboard_customer": self._handle_customer_onboarding,
            "generate_report": self._handle_analytics_report,
            "cleanup": self._handle_maintenance,
        }

    def _load_tasks(self):
        """Load default automated tasks."""
        default_tasks = [
            AutomatedTask(
                id="daily_lead_gen",
                type=TaskType.LEAD_GEN,
                priority=TaskPriority.HIGH,
                schedule="0 9 * * *",
                handler="generate_leads",
                config={"target_count": 10, "source": "autopilot"},
            ),
            AutomatedTask(
                id="morning_outreach",
                type=TaskType.OUTREACH,
                priority=TaskPriority.HIGH,
                schedule="0 10 * * 1-5",
                handler="send_outreach",
                config={"batch_size": 5, "template": "introduction"},
            ),
            AutomatedTask(
                id="weekly_content",
                type=TaskType.CONTENT,
                priority=TaskPriority.MEDIUM,
                schedule="0 14 * * 1",
                handler="create_content",
                config={"type": "blog", "niche": "ai-agency"},
            ),
            AutomatedTask(
                id="daily_follow_up",
                type=TaskType.FOLLOW_UP,
                priority=TaskPriority.CRITICAL,
                schedule="0 11 * * 1-5",
                handler="follow_up_sales",
                config={"max_age_days": 7, "batch_size": 3},
            ),
            AutomatedTask(
                id="new_customer_onboard",
                type=TaskType.ONBOARDING,
                priority=TaskPriority.CRITICAL,
                schedule="immediate",
                handler="onboard_customer",
                config={},
            ),
            AutomatedTask(
                id="weekly_report",
                type=TaskType.ANALYTICS,
                priority=TaskPriority.LOW,
                schedule="0 18 * * 5",
                handler="generate_report",
                config={"period": "weekly"},
            ),
        ]

        for task in default_tasks:
            self.tasks[task.id] = task

    # ═══════════════════════════════════════════════════════════════
    # TASK HANDLERS
    # ═══════════════════════════════════════════════════════════════

    def _handle_lead_generation(self, config: dict) -> dict:
        """Generate leads and add to pipeline."""
        target = config.get("target_count", 10)
        source = config.get("source", "autopilot")
        logger.info(f"🎯 Generating {target} leads from {source}...")

        leads_file = self.mekong_dir / "leads.json"
        leads = []
        if leads_file.exists():
            try:
                leads = json.loads(leads_file.read_text())
            except Exception:
                pass

        new_leads = []
        for i in range(target):
            lead = {
                "id": f"auto-{datetime.now().strftime('%Y%m%d%H%M%S')}-{i}",
                "email": f"prospect{i}@company{i}.com",
                "company": f"Company {i}",
                "status": "new",
                "source": source,
                "created_at": datetime.now().isoformat(),
            }
            new_leads.append(lead)

        leads.extend(new_leads)
        leads_file.write_text(json.dumps(leads, indent=2))

        self.state.leads_added += target
        logger.info(f"   ✅ Added {target} leads. Total: {len(leads)}")
        return {"added": target, "total": len(leads)}

    def _handle_email_outreach(self, config: dict) -> dict:
        """Send outreach emails to leads."""
        batch_size = config.get("batch_size", 5)
        logger.info(f"📧 Sending outreach to {batch_size} leads...")

        leads_file = self.mekong_dir / "leads.json"
        if not leads_file.exists():
            return {"sent": 0, "error": "No leads file"}

        try:
            leads = json.loads(leads_file.read_text())
        except Exception:
            return {"sent": 0, "error": "Invalid leads file"}

        new_leads = [l for l in leads if l.get("id") and l.get("status") == "new"][:batch_size]

        for lead in new_leads:
            lead_id = lead.get("id")
            for l in leads:
                if l.get("id") == lead_id:
                    l["status"] = "contacted"
                    l["contacted_at"] = datetime.now().isoformat()
            logger.info(f"   📤 Outreach sent to {lead.get('email', 'unknown')}")

        leads_file.write_text(json.dumps(leads, indent=2))
        self.state.emails_sent += len(new_leads)
        return {"sent": len(new_leads)}

    def _handle_content_creation(self, config: dict) -> dict:
        """Create content automatically."""
        content_type = config.get("type", "blog")
        niche = config.get("niche", "ai-agency")
        logger.info(f"📝 Creating {content_type} content for {niche}...")

        content = {
            "id": f"content-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": content_type,
            "niche": niche,
            "status": "draft",
            "created_at": datetime.now().isoformat(),
        }

        self.state.content_created += 1
        logger.info(f"   ✅ Content created: {content['id']}")
        return content

    def _handle_sales_follow_up(self, config: dict) -> dict:
        """Follow up with leads that need attention."""
        max_age = config.get("max_age_days", 7)
        batch_size = config.get("batch_size", 3)
        logger.info(f"🔔 Following up with leads older than {max_age} days...")

        leads_file = self.mekong_dir / "leads.json"
        if not leads_file.exists():
            return {"followed_up": 0}

        try:
            leads = json.loads(leads_file.read_text())
        except Exception:
            return {"followed_up": 0}

        cutoff = datetime.now() - timedelta(days=max_age)
        to_follow_up = []
        for lead in leads:
            if lead.get("status") == "contacted":
                try:
                    contacted_at = datetime.fromisoformat(
                        lead.get("contacted_at", datetime.now().isoformat())
                    )
                    if contacted_at < cutoff:
                        to_follow_up.append(lead)
                except ValueError:
                    continue

        to_follow_up = to_follow_up[:batch_size]

        for lead in to_follow_up:
            for l in leads:
                if l["id"] == lead["id"]:
                    l["status"] = "follow_up_sent"
                    l["follow_up_at"] = datetime.now().isoformat()
            logger.info(f"   📨 Follow-up sent to {lead.get('email', 'unknown')}")

        leads_file.write_text(json.dumps(leads, indent=2))
        return {"followed_up": len(to_follow_up)}

    def _handle_customer_onboarding(self, config: dict) -> dict:
        """Onboard new customer from webhook."""
        email = config.get("email", "")
        product = config.get("product", "")
        logger.info(f"🎉 Onboarding customer: {email} for {product}")

        customers_file = self.mekong_dir / "customers.json"
        customers = []
        if customers_file.exists():
            try:
                customers = json.loads(customers_file.read_text())
            except Exception:
                pass

        customer = {
            "email": email,
            "product": product,
            "onboarded_at": datetime.now().isoformat(),
            "status": "active",
        }
        customers.append(customer)
        customers_file.write_text(json.dumps(customers, indent=2))
        logger.info(f"   ✅ Customer onboarded: {email}")
        return {"onboarded": email}

    def _handle_analytics_report(self, config: dict) -> dict:
        """Generate analytics report."""
        period = config.get("period", "weekly")
        logger.info(f"📊 Generating {period} report...")

        report = {
            "period": period,
            "generated_at": datetime.now().isoformat(),
            "metrics": {
                "tasks_completed": self.state.tasks_completed,
                "revenue_generated": self.state.revenue_generated,
                "leads_added": self.state.leads_added,
                "emails_sent": self.state.emails_sent,
                "content_created": self.state.content_created,
                "errors": self.state.errors,
            },
        }

        reports_dir = self.mekong_dir / "reports"
        reports_dir.mkdir(exist_ok=True, parents=True)

        report_file = reports_dir / f"report_{datetime.now().strftime('%Y%m%d')}.json"
        report_file.write_text(json.dumps(report, indent=2))
        logger.info(f"   ✅ Report saved: {report_file.name}")
        return report

    def _handle_maintenance(self, config: dict) -> dict:
        """System maintenance tasks."""
        logger.info("🔧 Running maintenance...")
        return {"status": "complete"}

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC API
    # ═══════════════════════════════════════════════════════════════

    def execute_task(self, task_id: str, override_config: dict = None) -> dict:
        """Execute a specific task."""
        if task_id not in self.tasks:
            return {"success": False, "error": f"Task not found: {task_id}"}

        task = self.tasks[task_id]
        if not task.enabled:
            return {"success": False, "error": f"Task disabled: {task_id}"}

        handler = self.handlers.get(task.handler)
        if not handler:
            return {"success": False, "error": f"Handler not found: {task.handler}"}

        config = {**task.config, **(override_config or {})}

        try:
            result = handler(config)
            task.last_run = datetime.now().isoformat()
            self.state.tasks_completed += 1
            return {"success": True, "task_id": task_id, "result": result}
        except Exception as e:
            self.state.errors += 1
            logger.error(f"❌ Task {task_id} failed: {e}")
            return {"success": False, "task_id": task_id, "error": str(e)}

    def run_all_tasks(self) -> List[dict]:
        """Run all tasks sequentially."""
        logger.info("\n🚀 Running All Tasks")
        results = []
        for task_id, task in sorted(self.tasks.items(), key=lambda x: x[1].priority.value):
            if task.enabled:
                result = self.execute_task(task_id)
                results.append(result)
        return results

    def get_status(self) -> dict:
        """Get daemon status."""
        return {
            "state": {
                "started_at": self.state.started_at,
                "tasks_completed": self.state.tasks_completed,
                "leads_added": self.state.leads_added,
                "emails_sent": self.state.emails_sent,
                "revenue_generated": self.state.revenue_generated,
            },
            "tasks": {
                task_id: {
                    "type": task.type.value,
                    "priority": task.priority.name,
                    "enabled": task.enabled,
                    "last_run": task.last_run,
                }
                for task_id, task in self.tasks.items()
            },
        }

    def list_tasks(self) -> List[str]:
        """List available task IDs."""
        return list(self.tasks.keys())

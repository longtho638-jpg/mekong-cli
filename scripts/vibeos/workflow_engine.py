#!/usr/bin/env python3
"""
🏯 N8N-Style Workflow Automation Engine
Visual workflow builder for solo founders

Features:
- Trigger-based workflows (Gumroad, Stripe, Email, Cron)
- Node-based actions (Email, Slack, API calls)
- Conditional logic and branching
- Workflow templates for common patterns

Run: python3 scripts/vibeos/workflow_engine.py
"""

import json
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class TriggerType(Enum):
    """Workflow trigger types."""

    MANUAL = "manual"
    CRON = "cron"
    WEBHOOK = "webhook"
    GUMROAD_SALE = "gumroad_sale"
    NEW_LEAD = "new_lead"
    EMAIL_RECEIVED = "email_received"


class ActionType(Enum):
    """Workflow action types."""

    SEND_EMAIL = "send_email"
    SEND_SLACK = "send_slack"
    API_CALL = "api_call"
    CREATE_LEAD = "create_lead"
    UPDATE_DATABASE = "update_database"
    GENERATE_CONTENT = "generate_content"
    DELAY = "delay"
    CONDITION = "condition"


@dataclass
class WorkflowNode:
    """Single node in a workflow."""

    id: str
    type: ActionType
    config: Dict[str, Any] = field(default_factory=dict)
    next_nodes: List[str] = field(default_factory=list)
    condition: Optional[str] = None  # For conditional branching


@dataclass
class Workflow:
    """Complete workflow definition."""

    id: str
    name: str
    trigger: TriggerType
    trigger_config: Dict[str, Any] = field(default_factory=dict)
    nodes: List[WorkflowNode] = field(default_factory=list)
    active: bool = True
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class WorkflowEngine:
    """
    🏯 N8N-Style Workflow Engine
    Execute automated workflows with triggers and actions.
    """

    def __init__(self):
        self.workflows_dir = Path.home() / ".mekong" / "workflows"
        self.workflows_dir.mkdir(parents=True, exist_ok=True)
        self.workflows: Dict[str, Workflow] = {}
        self.action_handlers: Dict[ActionType, Callable] = {}
        self._register_handlers()
        self._load_workflows()

    def _register_handlers(self):
        """Register action handlers."""
        self.action_handlers = {
            ActionType.SEND_EMAIL: self._action_send_email,
            ActionType.SEND_SLACK: self._action_send_slack,
            ActionType.API_CALL: self._action_api_call,
            ActionType.CREATE_LEAD: self._action_create_lead,
            ActionType.GENERATE_CONTENT: self._action_generate_content,
            ActionType.DELAY: self._action_delay,
            ActionType.CONDITION: self._action_condition,
        }

    def _load_workflows(self):
        """Load workflows from disk."""
        for wf_file in self.workflows_dir.glob("*.json"):
            try:
                data = json.loads(wf_file.read_text())
                wf = self._dict_to_workflow(data)
                self.workflows[wf.id] = wf
            except Exception as e:
                print(f"⚠️ Error loading {wf_file}: {e}")

    def _dict_to_workflow(self, data: dict) -> Workflow:
        """Convert dict to Workflow object."""
        nodes = [
            WorkflowNode(
                id=n["id"],
                type=ActionType(n["type"]),
                config=n.get("config", {}),
                next_nodes=n.get("next_nodes", []),
                condition=n.get("condition"),
            )
            for n in data.get("nodes", [])
        ]
        return Workflow(
            id=data["id"],
            name=data["name"],
            trigger=TriggerType(data["trigger"]),
            trigger_config=data.get("trigger_config", {}),
            nodes=nodes,
            active=data.get("active", True),
        )

    def save_workflow(self, workflow: Workflow):
        """Save workflow to disk."""
        data = {
            "id": workflow.id,
            "name": workflow.name,
            "trigger": workflow.trigger.value,
            "trigger_config": workflow.trigger_config,
            "nodes": [
                {
                    "id": n.id,
                    "type": n.type.value,
                    "config": n.config,
                    "next_nodes": n.next_nodes,
                    "condition": n.condition,
                }
                for n in workflow.nodes
            ],
            "active": workflow.active,
            "created_at": workflow.created_at,
        }
        wf_file = self.workflows_dir / f"{workflow.id}.json"
        wf_file.write_text(json.dumps(data, indent=2))
        self.workflows[workflow.id] = workflow
        print(f"✅ Saved workflow: {workflow.name}")

    # ═══════════════════════════════════════════════════════════════════════
    # 🎯 WORKFLOW EXECUTION
    # ═══════════════════════════════════════════════════════════════════════

    def execute(self, workflow_id: str, context: Dict[str, Any] = None):
        """Execute a workflow."""
        if workflow_id not in self.workflows:
            print(f"❌ Workflow {workflow_id} not found")
            return

        wf = self.workflows[workflow_id]
        if not wf.active:
            print(f"⏸️ Workflow {wf.name} is inactive")
            return

        print(f"\n🚀 Executing: {wf.name}")
        ctx = context or {}

        # Execute nodes in order
        for node in wf.nodes:
            self._execute_node(node, ctx)

        print(f"✅ Workflow complete: {wf.name}")

    def _execute_node(self, node: WorkflowNode, context: Dict[str, Any]):
        """Execute a single node."""
        print(f"   → {node.type.value}: {node.id}")

        handler = self.action_handlers.get(node.type)
        if handler:
            result = handler(node.config, context)
            context[f"result_{node.id}"] = result

    # ═══════════════════════════════════════════════════════════════════════
    # 🔧 ACTION HANDLERS
    # ═══════════════════════════════════════════════════════════════════════

    def _action_send_email(self, config: dict, ctx: dict) -> dict:
        """Send email action."""
        to = config.get("to", ctx.get("email", ""))
        subject = config.get("subject", "")
        print(f"     📧 Email to: {to}")
        return {"sent": True, "to": to}

    def _action_send_slack(self, config: dict, ctx: dict) -> dict:
        """Send Slack message."""
        channel = config.get("channel", "#general")
        print(f"     💬 Slack to: {channel}")
        return {"sent": True, "channel": channel}

    def _action_api_call(self, config: dict, ctx: dict) -> dict:
        """Make API call."""
        url = config.get("url", "")
        print(f"     🌐 API: {url}")
        return {"called": True, "url": url}

    def _action_create_lead(self, config: dict, ctx: dict) -> dict:
        """Create lead."""
        name = ctx.get("name", config.get("name", ""))
        print(f"     👤 Lead: {name}")
        return {"created": True, "name": name}

    def _action_generate_content(self, config: dict, ctx: dict) -> dict:
        """Generate content."""
        topic = config.get("topic", "marketing")
        print(f"     📝 Content: {topic}")
        return {"generated": True, "topic": topic}

    def _action_delay(self, config: dict, ctx: dict) -> dict:
        """Delay action."""
        seconds = config.get("seconds", 1)
        print(f"     ⏰ Wait: {seconds}s")
        time.sleep(seconds)
        return {"waited": seconds}

    def _action_condition(self, config: dict, ctx: dict) -> dict:
        """Conditional branch."""
        condition = config.get("if", "")
        print(f"     🔀 Condition: {condition}")
        return {"evaluated": True, "condition": condition}

    # ═══════════════════════════════════════════════════════════════════════
    # 📋 WORKFLOW TEMPLATES
    # ═══════════════════════════════════════════════════════════════════════

    def create_gumroad_sale_workflow(self) -> Workflow:
        """Template: Gumroad sale workflow."""
        wf = Workflow(
            id="gumroad_sale_workflow",
            name="🎉 Gumroad Sale Automation",
            trigger=TriggerType.GUMROAD_SALE,
            nodes=[
                WorkflowNode(
                    id="notify_slack",
                    type=ActionType.SEND_SLACK,
                    config={"channel": "#sales", "message": "New sale!"},
                    next_nodes=["send_welcome"],
                ),
                WorkflowNode(
                    id="send_welcome",
                    type=ActionType.SEND_EMAIL,
                    config={"subject": "Welcome to AgencyOS!"},
                    next_nodes=["create_customer"],
                ),
                WorkflowNode(
                    id="create_customer",
                    type=ActionType.CREATE_LEAD,
                    config={"status": "customer"},
                ),
            ],
        )
        return wf

    def create_lead_nurture_workflow(self) -> Workflow:
        """Template: Lead nurture workflow."""
        wf = Workflow(
            id="lead_nurture_workflow",
            name="🎯 Lead Nurture Sequence",
            trigger=TriggerType.NEW_LEAD,
            nodes=[
                WorkflowNode(
                    id="welcome_email",
                    type=ActionType.SEND_EMAIL,
                    config={"subject": "Welcome! Here's your free gift"},
                    next_nodes=["wait_3days"],
                ),
                WorkflowNode(
                    id="wait_3days",
                    type=ActionType.DELAY,
                    config={"seconds": 3 * 24 * 60 * 60},
                    next_nodes=["followup_email"],
                ),
                WorkflowNode(
                    id="followup_email",
                    type=ActionType.SEND_EMAIL,
                    config={"subject": "Quick question..."},
                ),
            ],
        )
        return wf

    def create_content_pipeline_workflow(self) -> Workflow:
        """Template: Content pipeline workflow."""
        wf = Workflow(
            id="content_pipeline_workflow",
            name="📝 Content Pipeline",
            trigger=TriggerType.CRON,
            trigger_config={"schedule": "0 8 * * *"},  # 8 AM daily
            nodes=[
                WorkflowNode(
                    id="generate_ideas",
                    type=ActionType.GENERATE_CONTENT,
                    config={"count": 3, "topic": "marketing"},
                    next_nodes=["notify_founder"],
                ),
                WorkflowNode(
                    id="notify_founder",
                    type=ActionType.SEND_SLACK,
                    config={"channel": "#content", "message": "3 new ideas ready!"},
                ),
            ],
        )
        return wf

    # ═══════════════════════════════════════════════════════════════════════
    # 🎮 CLI INTERFACE
    # ═══════════════════════════════════════════════════════════════════════

    def list_workflows(self):
        """List all workflows."""
        print("\n📋 WORKFLOWS")
        print("=" * 50)
        for wf_id, wf in self.workflows.items():
            status = "✅ Active" if wf.active else "⏸️ Paused"
            print(f"  {wf.name} [{wf_id}] - {status}")
        if not self.workflows:
            print("  No workflows yet")

    def install_templates(self):
        """Install default workflow templates."""
        print("\n🔧 Installing workflow templates...")

        templates = [
            self.create_gumroad_sale_workflow(),
            self.create_lead_nurture_workflow(),
            self.create_content_pipeline_workflow(),
        ]

        for wf in templates:
            self.save_workflow(wf)

        print(f"\n✅ Installed {len(templates)} workflows")


def main():
    engine = WorkflowEngine()

    print("\n🏯 N8N-STYLE WORKFLOW ENGINE")
    print("Choose action:")
    print("  1. List workflows")
    print("  2. Install templates")
    print("  3. Execute workflow")
    print("  4. Create custom workflow")

    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        engine.list_workflows()
    elif choice == "2":
        engine.install_templates()
        engine.list_workflows()
    elif choice == "3":
        engine.list_workflows()
        wf_id = input("\nEnter workflow ID: ").strip()
        engine.execute(wf_id)
    elif choice == "4":
        print("\n💡 Use engine.save_workflow() in Python to create custom workflows")
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()

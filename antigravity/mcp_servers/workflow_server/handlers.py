"""
Handlers for the Workflow MCP Server.
Migrated from scripts/vibeos/workflow_engine.py
"""
import hashlib
import json
import logging
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# Set up logging
logger = logging.getLogger(__name__)

class TriggerType(Enum):
    """Workflow trigger types."""
    MANUAL = "manual"
    CRON = "cron"
    WEBHOOK = "webhook"
    GUMROAD_SALE = "gumroad_sale"
    NEW_LEAD = "new_lead"
    EMAIL_RECEIVED = "email_received"
    # Newsletter-specific triggers
    NEWSLETTER_SUBSCRIBE = "newsletter_subscribe"
    NEWSLETTER_UPGRADE = "newsletter_upgrade"
    NEWSLETTER_LIMIT_HIT = "newsletter_limit_hit"


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
    # Closed-loop specific actions
    GENERATE_LICENSE = "generate_license"
    CREATE_PLATFORM_ACCOUNT = "create_platform_account"
    UPGRADE_SUBSCRIBER_TIER = "upgrade_subscriber_tier"
    SYNC_TO_CRM = "sync_to_crm"


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


class WorkflowEngineHandler:
    """
    N8N-Style Workflow Engine Logic
    Adapted for MCP usage.
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
            # Closed-loop handlers
            ActionType.GENERATE_LICENSE: self._action_generate_license,
            ActionType.CREATE_PLATFORM_ACCOUNT: self._action_create_platform_account,
            ActionType.UPGRADE_SUBSCRIBER_TIER: self._action_upgrade_tier,
            ActionType.SYNC_TO_CRM: self._action_sync_crm,
        }

    def _load_workflows(self):
        """Load workflows from disk."""
        for wf_file in self.workflows_dir.glob("*.json"):
            try:
                data = json.loads(wf_file.read_text())
                wf = self._dict_to_workflow(data)
                self.workflows[wf.id] = wf
            except Exception as e:
                logger.error(f"⚠️ Error loading {wf_file}: {e}")

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
        logger.info(f"✅ Saved workflow: {workflow.name}")
        return {"success": True, "workflow_id": workflow.id}

    # ═══════════════════════════════════════════════════════════════════════
    # 🎯 WORKFLOW EXECUTION
    # ═══════════════════════════════════════════════════════════════════════

    def execute_workflow(self, workflow_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a workflow."""
        if workflow_id not in self.workflows:
            return {"success": False, "error": f"Workflow {workflow_id} not found"}

        wf = self.workflows[workflow_id]
        if not wf.active:
            return {"success": False, "error": f"Workflow {wf.name} is inactive"}

        logger.info(f"🚀 Executing: {wf.name}")
        ctx = context or {}

        # Execute nodes in order
        execution_log = []
        for node in wf.nodes:
            node_result = self._execute_node(node, ctx)
            execution_log.append({
                "node_id": node.id,
                "type": node.type.value,
                "result": node_result
            })

        logger.info(f"✅ Workflow complete: {wf.name}")
        return {
            "success": True,
            "workflow_id": workflow_id,
            "workflow_name": wf.name,
            "execution_log": execution_log,
            "final_context": ctx
        }

    def _execute_node(self, node: WorkflowNode, context: Dict[str, Any]):
        """Execute a single node."""
        logger.info(f"   → {node.type.value}: {node.id}")

        handler = self.action_handlers.get(node.type)
        if handler:
            result = handler(node.config, context)
            context[f"result_{node.id}"] = result
            return result
        return None

    # ═══════════════════════════════════════════════════════════════════════
    # 🔧 ACTION HANDLERS
    # ═══════════════════════════════════════════════════════════════════════

    def _action_send_email(self, config: dict, ctx: dict) -> dict:
        """Send email action."""
        to = config.get("to", ctx.get("email", ""))
        email_subject = config.get("subject", "")
        logger.info(f"     📧 Email to: {to} | Subject: {email_subject}")
        return {"sent": True, "to": to, "subject": email_subject}

    def _action_send_slack(self, config: dict, ctx: dict) -> dict:
        """Send Slack message."""
        channel = config.get("channel", "#general")
        logger.info(f"     💬 Slack to: {channel}")
        return {"sent": True, "channel": channel}

    def _action_api_call(self, config: dict, ctx: dict) -> dict:
        """Make API call."""
        url = config.get("url", "")
        logger.info(f"     🌐 API: {url}")
        return {"called": True, "url": url}

    def _action_create_lead(self, config: dict, ctx: dict) -> dict:
        """Create lead."""
        name = ctx.get("name", config.get("name", ""))
        logger.info(f"     👤 Lead: {name}")
        return {"created": True, "name": name}

    def _action_generate_content(self, config: dict, ctx: dict) -> dict:
        """Generate content."""
        topic = config.get("topic", "marketing")
        logger.info(f"     📝 Content: {topic}")
        return {"generated": True, "topic": topic}

    def _action_delay(self, config: dict, ctx: dict) -> dict:
        """Delay action."""
        seconds = config.get("seconds", 1)
        logger.info(f"     ⏰ Wait: {seconds}s")
        time.sleep(seconds)
        return {"waited": seconds}

    def _action_condition(self, config: dict, ctx: dict) -> dict:
        """Conditional branch."""
        condition = config.get("if", "")
        logger.info(f"     🔀 Condition: {condition}")
        return {"evaluated": True, "condition": condition}

    # ═══════════════════════════════════════════════════════════════════════
    # ☢️ CLOSED-LOOP ACTION HANDLERS (Nuclear Weaponization)
    # ═══════════════════════════════════════════════════════════════════════

    def _action_generate_license(self, config: dict, ctx: dict) -> dict:
        """Generate SHA-256 license key for Gumroad customers."""
        email = ctx.get("email", config.get("email", ""))
        product_id = ctx.get("product_id", config.get("product_id", ""))
        random_hex = secrets.token_hex(8)

        # SHA-256 license key: hash(email + product_id + random)
        raw = f"{email}:{product_id}:{random_hex}"
        license_key = hashlib.sha256(raw.encode()).hexdigest()[:32].upper()
        formatted_key = "-".join([license_key[i : i + 8] for i in range(0, 32, 8)])

        logger.info(f"     🔑 License generated: {formatted_key[:12]}...")

        # Store in context for downstream nodes
        ctx["license_key"] = formatted_key
        ctx["license_raw"] = raw

        return {"generated": True, "license_key": formatted_key, "email": email}

    def _action_create_platform_account(self, config: dict, ctx: dict) -> dict:
        """Create AgencyOS platform account from Gumroad purchase."""
        email = ctx.get("email", config.get("email", ""))
        product = ctx.get("product_name", config.get("product", ""))
        license_key = ctx.get("license_key", "")

        # Determine tier based on product price
        price = float(ctx.get("price", config.get("price", 0)))
        tier = "free"
        if price >= 97:
            tier = "pro"
        elif price >= 27:
            tier = "starter"

        logger.info(f"     👤 Platform account: {email} ({tier})")

        # Store customer data for persistence
        customer_data = {
            "email": email,
            "tier": tier,
            "product": product,
            "license_key": license_key,
            "created_at": datetime.now().isoformat(),
        }

        # Save to local customer store
        customers_file = Path.home() / ".mekong" / "customers.json"
        customers_file.parent.mkdir(parents=True, exist_ok=True)

        customers = []
        if customers_file.exists():
            try:
                customers = json.loads(customers_file.read_text())
            except Exception:
                pass
        customers.append(customer_data)
        customers_file.write_text(json.dumps(customers, indent=2))

        ctx["customer_tier"] = tier
        return {"created": True, "email": email, "tier": tier}

    def _action_upgrade_tier(self, config: dict, ctx: dict) -> dict:
        """Upgrade newsletter subscriber tier."""
        email = ctx.get("email", config.get("email", ""))
        new_tier = config.get("tier", "starter")
        subscriber_limit = config.get("subscriber_limit", 1000)

        logger.info(f"     ⬆️ Tier upgrade: {email} → {new_tier} ({subscriber_limit} subs)")

        # Update customer file
        customers_file = Path.home() / ".mekong" / "customers.json"
        if customers_file.exists():
            customers = json.loads(customers_file.read_text())
            for c in customers:
                if c.get("email") == email:
                    c["tier"] = new_tier
                    c["subscriber_limit"] = subscriber_limit
                    c["upgraded_at"] = datetime.now().isoformat()
            customers_file.write_text(json.dumps(customers, indent=2))

        return {"upgraded": True, "email": email, "tier": new_tier}

    def _action_sync_crm(self, config: dict, ctx: dict) -> dict:
        """Sync customer to CRM (leads.json)."""
        email = ctx.get("email", config.get("email", ""))
        name = ctx.get("name", email.split("@")[0])
        status = config.get("status", "customer")

        logger.info(f"     📊 CRM sync: {name} ({status})")

        # Add to leads.json
        leads_file = Path.home() / ".mekong" / "leads.json"
        leads_file.parent.mkdir(parents=True, exist_ok=True)

        leads = []
        if leads_file.exists():
            try:
                leads = json.loads(leads_file.read_text())
            except Exception:
                pass

        # Check if lead already exists
        existing = next((lead for lead in leads if lead.get("email") == email), None)
        if existing:
            existing["status"] = status
            existing["updated_at"] = datetime.now().isoformat()
        else:
            leads.append(
                {
                    "name": name,
                    "email": email,
                    "status": status,
                    "source": "gumroad",
                    "created_at": datetime.now().isoformat(),
                }
            )

        leads_file.write_text(json.dumps(leads, indent=2))

        return {"synced": True, "email": email, "status": status}

    # ═══════════════════════════════════════════════════════════════════════
    # 📋 PUBLIC API (Exposed via MCP)
    # ═══════════════════════════════════════════════════════════════════════

    def list_workflows(self) -> List[Dict[str, Any]]:
        """List all workflows."""
        return [
            {
                "id": wf.id,
                "name": wf.name,
                "active": wf.active,
                "trigger": wf.trigger.value
            }
            for wf in self.workflows.values()
        ]

    def create_workflow(self, name: str, trigger_type: str, trigger_config: Dict = None) -> Dict[str, Any]:
        """Create a new empty workflow."""
        wf_id = name.lower().replace(" ", "_") + "_" + secrets.token_hex(4)
        try:
            trigger = TriggerType(trigger_type)
        except ValueError:
            return {"success": False, "error": f"Invalid trigger type: {trigger_type}"}

        wf = Workflow(
            id=wf_id,
            name=name,
            trigger=trigger,
            trigger_config=trigger_config or {}
        )
        return self.save_workflow(wf)

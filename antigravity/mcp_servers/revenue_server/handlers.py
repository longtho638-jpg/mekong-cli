"""
Handlers for the Revenue MCP Server.
Migrated from scripts/vibeos/revenue_agent.py
"""
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add project root to path to ensure imports work
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

try:
    from antigravity.core.client_magnet import ClientMagnet
    from antigravity.core.content_factory import ContentFactory
    # Mocking GumroadClient if not found, as it might be in a different path or not set up
    try:
        from core.finance.gateways.gumroad import GumroadClient
    except ImportError:
        class GumroadClient:
            def is_configured(self): return False
            def get_sales(self): return []

except ImportError:
    # Fallback mocks for development/testing if dependencies are missing
    class ClientMagnet:
        pass
    class ContentFactory:
        def generate_ideas(self, count): return [f"Idea {i}" for i in range(count)]
    class GumroadClient:
        def is_configured(self): return False
        def get_sales(self): return []

logger = logging.getLogger(__name__)

class RevenueAgentHandler:
    """
    Autonomous Revenue Agent Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.gumroad = GumroadClient()
        self.content_factory = ContentFactory()
        self.client_magnet = ClientMagnet()
        self.leads_file = Path.home() / ".mekong" / "leads.json"
        self.state_file = Path.home() / ".mekong" / "agent_state.json"
        self.load_state()

    def load_state(self):
        """Load agent state from disk."""
        if self.state_file.exists():
            try:
                self.state = json.loads(self.state_file.read_text())
            except Exception:
                self._init_default_state()
        else:
            self._init_default_state()

    def _init_default_state(self):
        self.state = {
            "last_sales_check": None,
            "total_revenue": 0,
            "emails_sent": 0,
            "content_generated": 0,
            "leads_nurtured": 0,
        }

    def save_state(self):
        """Save agent state to disk."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self.state_file.write_text(json.dumps(self.state, indent=2))

    def _now(self) -> str:
        """Get current timestamp."""
        return datetime.now().strftime("%Y-%m-%d %H:%M")

    # ═══════════════════════════════════════════════════════════════════════
    # 💰 REVENUE MONITORING
    # ═══════════════════════════════════════════════════════════════════════

    def check_sales(self) -> Dict[str, Any]:
        """Check Gumroad for new sales."""
        logger.info(f"💰 [{self._now()}] Checking Gumroad sales...")

        if not self.gumroad.is_configured():
            logger.warning("   ⚠️ Gumroad not configured")
            return {"success": False, "new_sales": 0, "revenue": 0, "status": "not_configured"}

        sales = self.gumroad.get_sales()
        new_sales = []

        # Find sales since last check
        last_check = self.state.get("last_sales_check")
        for sale in sales:
            sale_time = sale.get("created_at", "")
            if last_check and sale_time <= last_check:
                break
            new_sales.append(sale)

        revenue = sum(s.get("price", 0) / 100 for s in new_sales)

        if new_sales:
            logger.info(f"   🎉 {len(new_sales)} NEW SALES! ${revenue:.2f}")
            self.state["total_revenue"] += revenue
            # Notify logic would go here
        else:
            logger.info("   No new sales yet")

        self.state["last_sales_check"] = self._now()
        self.save_state()

        return {
            "success": True,
            "new_sales_count": len(new_sales),
            "new_revenue": revenue,
            "total_revenue": self.state["total_revenue"]
        }

    # ═══════════════════════════════════════════════════════════════════════
    # 🎯 LEAD NURTURE
    # ═══════════════════════════════════════════════════════════════════════

    def nurture_leads(self) -> Dict[str, Any]:
        """Auto-nurture leads based on their stage."""
        logger.info(f"🎯 [{self._now()}] Nurturing leads...")

        if not self.leads_file.exists():
            return {"success": False, "error": "No leads file found", "nurtured": 0}

        try:
            leads = json.loads(self.leads_file.read_text())
        except Exception as e:
            return {"success": False, "error": f"Failed to read leads: {e}", "nurtured": 0}

        nurtured = 0

        for lead in leads:
            status = lead.get("status", "new")
            last_contact = lead.get("last_contact")

            # Check if need follow-up
            if self._needs_followup(status, last_contact):
                self._send_followup(lead)
                nurtured += 1

        self.state["leads_nurtured"] += nurtured
        self.save_state()

        logger.info(f"   Nurtured {nurtured} leads")
        return {"success": True, "nurtured_count": nurtured}

    def _needs_followup(self, status: str, last_contact: Optional[str]) -> bool:
        """Check if lead needs follow-up."""
        if status in ["closed", "lost"]:
            return False

        if not last_contact:
            return status == "contacted"

        try:
            days_since = (datetime.now() - datetime.fromisoformat(last_contact)).days
            return days_since >= 3  # Follow up every 3 days
        except ValueError:
            return False

    def _send_followup(self, lead: dict):
        """Send follow-up to lead."""
        email = lead.get("email", "")
        name = lead.get("name", "")
        logger.info(f"   📧 Following up with {name} <{email}>")
        # Integration with email sending would happen here

    # ═══════════════════════════════════════════════════════════════════════
    # 📝 CONTENT GENERATION
    # ═══════════════════════════════════════════════════════════════════════

    def generate_content(self, count: int = 3) -> Dict[str, Any]:
        """Generate content ideas for marketing."""
        logger.info(f"📝 [{self._now()}] Generating content...")

        ideas = self.content_factory.generate_ideas(count)
        self.state["content_generated"] += len(ideas)
        self.save_state()

        return {"success": True, "ideas": ideas, "count": len(ideas)}

    # ═══════════════════════════════════════════════════════════════════════
    # 📊 REPORTING
    # ═══════════════════════════════════════════════════════════════════════

    def get_report(self) -> Dict[str, Any]:
        """Generate revenue report stats."""
        # Progress to goal
        goal = 1_000_000
        progress = (self.state["total_revenue"] / goal) * 100

        return {
            "timestamp": self._now(),
            "total_revenue": self.state["total_revenue"],
            "progress_percent": progress,
            "emails_sent": self.state["emails_sent"],
            "content_generated": self.state["content_generated"],
            "leads_nurtured": self.state["leads_nurtured"]
        }

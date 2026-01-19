#!/usr/bin/env python3
"""
🏯 MAX LEVEL Revenue Automation Agent
Autonomous revenue engine for solo founders

Features:
- Gumroad sales monitoring
- Lead nurture automation
- Content generation pipeline
- Daily revenue reporting
- Auto follow-up sequences

Run: python3 scripts/vibeos/revenue_agent.py
"""

import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import schedule

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from antigravity.core.client_magnet import ClientMagnet
from antigravity.core.content_factory import ContentFactory

from core.finance.gateways.gumroad import GumroadClient


class RevenueAgent:
    """
    🏯 Autonomous Revenue Agent for Solo Founders
    Runs continuously to maximize revenue with zero manual work.
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
            self.state = json.loads(self.state_file.read_text())
        else:
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

    # ═══════════════════════════════════════════════════════════════════════
    # 💰 REVENUE MONITORING
    # ═══════════════════════════════════════════════════════════════════════

    def check_sales(self) -> dict:
        """Check Gumroad for new sales."""
        print(f"\n💰 [{self._now()}] Checking Gumroad sales...")

        if not self.gumroad.is_configured():
            print("   ⚠️ Gumroad not configured")
            return {"new_sales": 0, "revenue": 0}

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
            print(f"   🎉 {len(new_sales)} NEW SALES! ${revenue:.2f}")
            self.state["total_revenue"] += revenue
            self._notify_sale(new_sales[0])
        else:
            print("   No new sales yet")

        self.state["last_sales_check"] = self._now()
        self.save_state()

        return {"new_sales": len(new_sales), "revenue": revenue}

    def _notify_sale(self, sale: dict):
        """Notify founder of new sale."""
        product = sale.get("product_name", "Unknown")
        price = sale.get("price", 0) / 100
        email = sale.get("email", "")
        print(f"\n   🎊 CHING! {product} sold for ${price:.2f}")
        print(f"   📧 Customer: {email}")
        # Could integrate with Slack/Discord/Email notification

    # ═══════════════════════════════════════════════════════════════════════
    # 🎯 LEAD NURTURE
    # ═══════════════════════════════════════════════════════════════════════

    def nurture_leads(self) -> dict:
        """Auto-nurture leads based on their stage."""
        print(f"\n🎯 [{self._now()}] Nurturing leads...")

        if not self.leads_file.exists():
            print("   No leads file found")
            return {"nurtured": 0}

        leads = json.loads(self.leads_file.read_text())
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

        print(f"   Nurtured {nurtured} leads")
        return {"nurtured": nurtured}

    def _needs_followup(self, status: str, last_contact: Optional[str]) -> bool:
        """Check if lead needs follow-up."""
        if status in ["closed", "lost"]:
            return False

        if not last_contact:
            return status == "contacted"

        days_since = (datetime.now() - datetime.fromisoformat(last_contact)).days
        return days_since >= 3  # Follow up every 3 days

    def _send_followup(self, lead: dict):
        """Send follow-up to lead."""
        email = lead.get("email", "")
        name = lead.get("name", "")
        print(f"   📧 Following up with {name} <{email}>")
        # Integrate with email sending

    # ═══════════════════════════════════════════════════════════════════════
    # 📝 CONTENT GENERATION
    # ═══════════════════════════════════════════════════════════════════════

    def generate_content(self) -> dict:
        """Generate content ideas for marketing."""
        print(f"\n📝 [{self._now()}] Generating content...")

        ideas = self.content_factory.generate_ideas(3)
        self.state["content_generated"] += len(ideas)
        self.save_state()

        for i, idea in enumerate(ideas, 1):
            print(f"   {i}. {idea}")

        return {"ideas": len(ideas)}

    # ═══════════════════════════════════════════════════════════════════════
    # 📊 REPORTING
    # ═══════════════════════════════════════════════════════════════════════

    def daily_report(self) -> dict:
        """Generate daily revenue report."""
        print("\n" + "=" * 60)
        print("  🏯 DAILY REVENUE REPORT")
        print(f"  {self._now()}")
        print("=" * 60)

        # Check Gumroad
        self.check_sales()

        # Load state
        print("\n💰 CUMULATIVE STATS:")
        print(f"   Total Revenue: ${self.state['total_revenue']:.2f}")
        print(f"   Emails Sent: {self.state['emails_sent']}")
        print(f"   Content Generated: {self.state['content_generated']}")
        print(f"   Leads Nurtured: {self.state['leads_nurtured']}")

        # Progress to goal
        goal = 1_000_000
        progress = (self.state["total_revenue"] / goal) * 100
        print(f"\n🎯 PROGRESS: {progress:.2f}% of $1M goal")
        print("=" * 60)

        return {
            "revenue": self.state["total_revenue"],
            "progress": progress,
        }

    # ═══════════════════════════════════════════════════════════════════════
    # 🔄 AUTOMATION LOOP
    # ═══════════════════════════════════════════════════════════════════════

    def run_cycle(self):
        """Run one automation cycle."""
        print("\n" + "=" * 60)
        print("  🏯 REVENUE AGENT CYCLE")
        print("=" * 60)

        self.check_sales()
        self.nurture_leads()
        self.generate_content()

        print("\n✅ Cycle complete")

    def start_daemon(self):
        """Start autonomous daemon mode."""
        print("\n🏯 REVENUE AGENT DAEMON STARTED")
        print("Running every 30 minutes...")

        # Schedule tasks
        schedule.every(30).minutes.do(self.run_cycle)
        schedule.every().day.at("08:00").do(self.daily_report)
        schedule.every().day.at("20:00").do(self.daily_report)

        # Run immediately
        self.run_cycle()

        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)

    def _now(self) -> str:
        """Get current timestamp."""
        return datetime.now().strftime("%Y-%m-%d %H:%M")


def main():
    agent = RevenueAgent()

    print("\n🏯 REVENUE AGENT - MAX LEVEL")
    print("Choose mode:")
    print("  1. Run single cycle")
    print("  2. Start daemon (autonomous)")
    print("  3. Daily report")
    print("  4. Check sales only")

    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        agent.run_cycle()
    elif choice == "2":
        agent.start_daemon()
    elif choice == "3":
        agent.daily_report()
    elif choice == "4":
        agent.check_sales()
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
CC SALES - Sales automation CLI for one-person agencies
CRM-lite with pipeline management, lead tracking, and forecasting
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional


class SalesDB:
    """Simple JSON-based sales database"""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.path.expanduser("~/.cc_sales.json")
        self.data = self._load()

    def _load(self) -> Dict:
        """Load sales data from JSON file"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                return json.load(f)
        return {
            "leads": [],
            "settings": {
                "follow_up_days": 7,  # Days after last contact to flag for follow-up
                "avg_deal_value": 5000,  # Default average deal value
                "close_rate": 0.3  # Default 30% close rate
            }
        }

    def _save(self):
        """Save sales data to JSON file"""
        with open(self.db_path, 'w') as f:
            json.dump(self.data, f, indent=2)

    def add_lead(self, name: str, email: str, company: str = "",
                 value: Optional[float] = None, source: str = "manual") -> Dict:
        """Add a new lead"""
        lead = {
            "id": len(self.data["leads"]) + 1,
            "name": name,
            "email": email,
            "company": company,
            "value": value or self.data["settings"]["avg_deal_value"],
            "source": source,
            "stage": "lead",  # lead, qualified, proposal, negotiation, closed-won, closed-lost
            "created_at": datetime.now().isoformat(),
            "last_contact": datetime.now().isoformat(),
            "notes": [],
            "follow_up_date": (datetime.now() + timedelta(days=3)).isoformat()
        }
        self.data["leads"].append(lead)
        self._save()
        return lead

    def get_leads(self, stage: Optional[str] = None) -> List[Dict]:
        """Get leads, optionally filtered by stage"""
        leads = self.data["leads"]
        if stage:
            leads = [l for l in leads if l["stage"] == stage]
        return leads

    def get_leads_needing_followup(self) -> List[Dict]:
        """Get leads that need follow-up"""
        now = datetime.now()
        follow_up_threshold = now - timedelta(days=self.data["settings"]["follow_up_days"])

        needs_followup = []
        for lead in self.data["leads"]:
            if lead["stage"] in ["closed-won", "closed-lost"]:
                continue

            last_contact = datetime.fromisoformat(lead["last_contact"])
            if last_contact < follow_up_threshold:
                needs_followup.append(lead)

        return sorted(needs_followup, key=lambda x: x["last_contact"])

    def update_lead(self, lead_id: int, **kwargs):
        """Update lead properties"""
        for lead in self.data["leads"]:
            if lead["id"] == lead_id:
                lead.update(kwargs)
                self._save()
                return lead
        raise ValueError(f"Lead {lead_id} not found")

    def add_note(self, lead_id: int, note: str):
        """Add note to lead"""
        for lead in self.data["leads"]:
            if lead["id"] == lead_id:
                lead["notes"].append({
                    "text": note,
                    "timestamp": datetime.now().isoformat()
                })
                lead["last_contact"] = datetime.now().isoformat()
                self._save()
                return lead
        raise ValueError(f"Lead {lead_id} not found")


class SalesCLI:
    """Sales automation CLI"""

    def __init__(self):
        self.db = SalesDB()

    def pipeline(self):
        """Show sales pipeline"""
        stages = {
            "lead": "🔍 Lead",
            "qualified": "✓ Qualified",
            "proposal": "📄 Proposal",
            "negotiation": "💬 Negotiation",
            "closed-won": "✅ Closed Won",
            "closed-lost": "❌ Closed Lost"
        }

        print("\n📊 SALES PIPELINE")
        print("=" * 60)

        total_value = 0
        total_count = 0

        for stage_key, stage_name in stages.items():
            leads = self.db.get_leads(stage=stage_key)
            count = len(leads)
            value = sum(l["value"] for l in leads)

            if stage_key not in ["closed-lost"]:
                total_value += value
                total_count += count

            print(f"\n{stage_name} ({count})")
            print(f"  Value: ${value:,.0f}")

            if leads and stage_key not in ["closed-won", "closed-lost"]:
                print("  Leads:")
                for lead in leads[:5]:  # Show top 5
                    days_ago = (datetime.now() - datetime.fromisoformat(lead["last_contact"])).days
                    print(f"    • {lead['name']} ({lead['company']}) - ${lead['value']:,.0f} - {days_ago}d ago")
                if len(leads) > 5:
                    print(f"    ... and {len(leads) - 5} more")

        print(f"\n{'=' * 60}")
        print(f"Total Pipeline: {total_count} leads, ${total_value:,.0f}")
        print()

    def leads_add(self, name: str, email: str, company: str = "",
                  value: Optional[float] = None, source: str = "manual"):
        """Add new lead"""
        lead = self.db.add_lead(name, email, company, value, source)
        print(f"\n✅ Lead added: {lead['name']} ({lead['email']})")
        print(f"   ID: {lead['id']}")
        print(f"   Company: {lead['company'] or 'N/A'}")
        print(f"   Value: ${lead['value']:,.0f}")
        print(f"   Follow-up: {datetime.fromisoformat(lead['follow_up_date']).strftime('%Y-%m-%d')}\n")

    def leads_followup(self):
        """Show leads needing follow-up"""
        leads = self.db.get_leads_needing_followup()

        print("\n📞 LEADS NEEDING FOLLOW-UP")
        print("=" * 60)

        if not leads:
            print("✅ All leads are up to date!\n")
            return

        print(f"\n{len(leads)} leads need attention:\n")

        for lead in leads:
            days_since = (datetime.now() - datetime.fromisoformat(lead["last_contact"])).days
            print(f"🔔 {lead['name']} ({lead['company']})")
            print(f"   ID: {lead['id']} | Stage: {lead['stage']} | Value: ${lead['value']:,.0f}")
            print(f"   Last contact: {days_since} days ago")
            print(f"   Email: {lead['email']}")
            if lead.get("notes"):
                last_note = lead["notes"][-1]
                print(f"   Last note: {last_note['text'][:50]}...")
            print()

        print("💡 Tip: Use 'cc sales leads update <id> --note \"...\"' to log contact\n")

    def forecast(self):
        """Show revenue forecast"""
        settings = self.db.data["settings"]
        close_rate = settings["close_rate"]

        # Get active pipeline (exclude closed)
        active_leads = [l for l in self.db.get_leads()
                       if l["stage"] not in ["closed-won", "closed-lost"]]

        # Calculate by stage
        stage_weights = {
            "lead": 0.1,
            "qualified": 0.3,
            "proposal": 0.5,
            "negotiation": 0.7
        }

        print("\n💰 REVENUE FORECAST")
        print("=" * 60)

        total_pipeline = sum(l["value"] for l in active_leads)
        weighted_forecast = 0

        print(f"\nPipeline Value: ${total_pipeline:,.0f}")
        print(f"Close Rate: {close_rate * 100:.0f}%\n")

        print("Stage Breakdown:")
        for stage, weight in stage_weights.items():
            stage_leads = [l for l in active_leads if l["stage"] == stage]
            stage_value = sum(l["value"] for l in stage_leads)
            weighted_value = stage_value * weight
            weighted_forecast += weighted_value

            if stage_leads:
                print(f"  {stage.title()}: ${stage_value:,.0f} × {weight*100:.0f}% = ${weighted_value:,.0f}")

        simple_forecast = total_pipeline * close_rate

        print(f"\n{'=' * 60}")
        print(f"Weighted Forecast: ${weighted_forecast:,.0f}")
        print(f"Simple Forecast: ${simple_forecast:,.0f} ({close_rate*100:.0f}% of pipeline)")
        print(f"Best Case (100%): ${total_pipeline:,.0f}")
        print()

    def report_weekly(self):
        """Generate weekly sales report"""
        now = datetime.now()
        week_ago = now - timedelta(days=7)

        # Get leads from this week
        new_leads = [l for l in self.db.get_leads()
                    if datetime.fromisoformat(l["created_at"]) > week_ago]

        # Get closed deals this week
        closed_won = [l for l in self.db.get_leads(stage="closed-won")
                     if "updated_at" in l and datetime.fromisoformat(l.get("updated_at", l["created_at"])) > week_ago]

        print("\n📈 WEEKLY SALES REPORT")
        print("=" * 60)
        print(f"Period: {week_ago.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}\n")

        print(f"📥 New Leads: {len(new_leads)}")
        if new_leads:
            new_value = sum(l["value"] for l in new_leads)
            print(f"   Total Value: ${new_value:,.0f}")
            for lead in new_leads[:5]:
                print(f"   • {lead['name']} ({lead['company']}) - ${lead['value']:,.0f}")

        print(f"\n✅ Closed Deals: {len(closed_won)}")
        if closed_won:
            closed_value = sum(l["value"] for l in closed_won)
            print(f"   Total Revenue: ${closed_value:,.0f}")
            for lead in closed_won:
                print(f"   • {lead['name']} ({lead['company']}) - ${lead['value']:,.0f}")

        # Follow-up needed
        followup = self.db.get_leads_needing_followup()
        print(f"\n📞 Follow-up Needed: {len(followup)}")

        # Current pipeline
        active = [l for l in self.db.get_leads()
                 if l["stage"] not in ["closed-won", "closed-lost"]]
        pipeline_value = sum(l["value"] for l in active)

        print("\n📊 Pipeline Status:")
        print(f"   Active Leads: {len(active)}")
        print(f"   Total Value: ${pipeline_value:,.0f}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="CC Sales - Sales automation CLI for one-person agencies"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Pipeline command
    subparsers.add_parser("pipeline", help="Show sales pipeline")

    # Leads commands
    leads_parser = subparsers.add_parser("leads", help="Manage leads")
    leads_sub = leads_parser.add_subparsers(dest="leads_command")

    add_parser = leads_sub.add_parser("add", help="Add new lead")
    add_parser.add_argument("name", help="Lead name")
    add_parser.add_argument("--email", required=True, help="Email address")
    add_parser.add_argument("--company", default="", help="Company name")
    add_parser.add_argument("--value", type=float, help="Deal value")
    add_parser.add_argument("--source", default="manual", help="Lead source")

    leads_sub.add_parser("follow-up", help="Show leads needing follow-up")

    # Forecast command
    subparsers.add_parser("forecast", help="Revenue forecast")

    # Report command
    report_parser = subparsers.add_parser("report", help="Generate reports")
    report_parser.add_argument("type", choices=["weekly"], help="Report type")

    args = parser.parse_args()

    cli = SalesCLI()

    try:
        if args.command == "pipeline":
            cli.pipeline()

        elif args.command == "leads":
            if args.leads_command == "add":
                cli.leads_add(args.name, args.email, args.company, args.value, args.source)
            elif args.leads_command == "follow-up":
                cli.leads_followup()
            else:
                leads_parser.print_help()

        elif args.command == "forecast":
            cli.forecast()

        elif args.command == "report":
            if args.type == "weekly":
                cli.report_weekly()

        else:
            parser.print_help()

    except Exception as e:
        print(f"\n❌ Error: {e}\n", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

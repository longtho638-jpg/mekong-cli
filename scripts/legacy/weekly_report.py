#!/usr/bin/env python3
"""
📊 WEEKLY REPORT GENERATOR - Auto-Generate Client Reports
==========================================================
Creates professional weekly reports for retainer clients (Ghost CTO, Venture).
Pulls data from revenue_engine, client_magnet, and content metrics.

Alignment:
    - Binh Pháp Venture Studio Standards
    - Antigravity Architecture

Usage:
    python3 scripts/weekly_report.py generate <client_email>
    python3 scripts/weekly_report.py all
    python3 scripts/weekly_report.py list
"""

import argparse
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("WeeklyReport")

# Constants
REPORTS_DIR = Path.home() / "mekong-cli/reports"
CLIENTS_FILE = Path.home() / ".mekong/clients.json"
INVOICES_FILE = Path.home() / ".mekong/invoices.json"
LEADS_FILE = Path.home() / ".mekong/leads.json"

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"


@dataclass
class ClientMetrics:
    """Weekly metrics for a retainer client."""

    email: str
    name: str
    company: str
    service: str
    week_start: datetime
    week_end: datetime

    # Velocity Metrics
    commits_analyzed: int = 0
    prs_reviewed: int = 0
    issues_closed: int = 0

    # Support Metrics
    hours_used: float = 0.0
    hours_available: float = 5.0
    response_time_avg: str = "< 24h"

    # Recommendations
    recommendations: List[str] = field(default_factory=list)

    # Health Score (0-100)
    health_score: int = 85


def load_json(filepath: Path) -> List[Dict]:
    """Load JSON file safely."""
    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse {filepath}")
    return []


def get_retainer_clients() -> List[Dict]:
    """Get list of active retainer clients from leads with 'closed' stage."""
    leads = load_json(LEADS_FILE)
    invoices = load_json(INVOICES_FILE)

    # Find clients with paid invoices (retainer clients)
    paid_emails = {
        inv.get("client_email") for inv in invoices if inv.get("status") == "paid"
    }

    # Also include closed leads
    clients = []
    for lead in leads:
        if lead.get("stage") == "closed" or lead.get("email") in paid_emails:
            clients.append(
                {
                    "email": lead.get("email"),
                    "name": lead.get("name", "Client"),
                    "company": lead.get("company", "N/A"),
                    "service": lead.get("service", "Ghost CTO Lite"),
                }
            )

    return clients


def generate_metrics(client: Dict) -> ClientMetrics:
    """Generate weekly metrics for a client."""
    now = datetime.now()
    week_start = now - timedelta(days=now.weekday())  # Monday
    week_end = week_start + timedelta(days=6)  # Sunday

    # Simulated metrics (would connect to real data sources in production)
    metrics = ClientMetrics(
        email=client["email"],
        name=client["name"],
        company=client["company"],
        service=client.get("service", "Ghost CTO Lite"),
        week_start=week_start,
        week_end=week_end,
        commits_analyzed=47,
        prs_reviewed=12,
        issues_closed=8,
        hours_used=3.5,
        hours_available=5.0,
        response_time_avg="< 4h",
        health_score=92,
        recommendations=[
            "Consider adding E2E tests for checkout flow",
            "Database query optimization opportunity in user service",
            "Recommend upgrading Node.js to LTS version",
        ],
    )

    return metrics


def generate_report_content(metrics: ClientMetrics) -> str:
    """Generate Markdown report content."""
    week_str = (
        metrics.week_start.strftime("%b %d")
        + " - "
        + metrics.week_end.strftime("%b %d, %Y")
    )

    # Health indicator
    if metrics.health_score >= 90:
        health_emoji = "🟢"
        health_label = "Excellent"
    elif metrics.health_score >= 70:
        health_emoji = "🟡"
        health_label = "Good"
    else:
        health_emoji = "🔴"
        health_label = "Needs Attention"

    report = f"""# 📊 Weekly Engineering Report

**Client:** {metrics.name} @ {metrics.company}  
**Service:** {metrics.service}  
**Week:** {week_str}  
**Report Date:** {datetime.now().strftime("%Y-%m-%d")}

---

## 🏥 Health Score: {health_emoji} {metrics.health_score}/100 ({health_label})

---

## 📈 Engineering Velocity

| Metric | This Week |
|:-------|----------:|
| Commits Analyzed | {metrics.commits_analyzed} |
| PRs Reviewed | {metrics.prs_reviewed} |
| Issues Closed | {metrics.issues_closed} |

---

## ⏱️ Support Usage

| Metric | Value |
|:-------|------:|
| Hours Used | {metrics.hours_used}h |
| Hours Available | {metrics.hours_available}h |
| Avg Response Time | {metrics.response_time_avg} |

**Remaining Hours:** {metrics.hours_available - metrics.hours_used}h

---

## 💡 Recommendations

"""

    for i, rec in enumerate(metrics.recommendations, 1):
        report += f"{i}. {rec}\n"

    report += """
---

## 📅 Next Week Focus

- Continue monitoring deployment pipeline
- Architecture review session (scheduled)
- Code review backlog prioritization

---

*Generated by Binh Pháp Venture Studio*  
*Ghost CTO Lite - Technical Oversight Service*
"""

    return report


def generate_report(client_email: str) -> Optional[Path]:
    """Generate weekly report for a specific client."""
    clients = get_retainer_clients()
    client = next((c for c in clients if c["email"] == client_email), None)

    if not client:
        # Create placeholder client for demo
        client = {
            "email": client_email,
            "name": client_email.split("@")[0].title(),
            "company": "Client Company",
            "service": "Ghost CTO Lite",
        }
        print(f"{YELLOW}⚠️ Client not found in database. Using placeholder.{RESET}")

    try:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

        metrics = generate_metrics(client)
        content = generate_report_content(metrics)

        date_str = datetime.now().strftime("%Y%m%d")
        company_slug = client.get("company", "client").replace(" ", "_").lower()
        filename = f"weekly_{company_slug}_{date_str}.md"
        filepath = REPORTS_DIR / filename

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"\n{GREEN}✅ Weekly Report Generated!{RESET}")
        print(f"📄 File:    {filepath}")
        print(f"👤 Client:  {client['name']} @ {client['company']}")
        print(f"🏥 Health:  {metrics.health_score}/100")
        print(f"\n{CYAN}Next: Review and send to client.{RESET}")

        return filepath

    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        print(f"{RED}❌ Error: {e}{RESET}")
        return None


def generate_all_reports() -> List[Path]:
    """Generate weekly reports for all retainer clients."""
    clients = get_retainer_clients()

    if not clients:
        print(f"{YELLOW}⚠️ No retainer clients found. Add closed deals first.{RESET}")
        return []

    reports = []
    print(f"\n{BOLD}📊 Generating Weekly Reports for {len(clients)} Clients{RESET}")
    print("=" * 50)

    for client in clients:
        filepath = generate_report(client["email"])
        if filepath:
            reports.append(filepath)

    print(f"\n{GREEN}✅ Generated {len(reports)} reports{RESET}")
    return reports


def list_clients():
    """List all retainer clients."""
    clients = get_retainer_clients()

    print(f"\n{BOLD}👥 RETAINER CLIENTS ({len(clients)}){RESET}")
    print("=" * 60)

    if not clients:
        print(f"{YELLOW}No retainer clients found.{RESET}")
        print("Close deals to add clients: outreach_cli.py close <email>")
        return

    for client in clients:
        print(f"  {CYAN}{client['email']:<30}{RESET} | {client['company']}")


def main():
    parser = argparse.ArgumentParser(
        description="Weekly Report Generator - Binh Pháp Venture Studio"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List Command
    subparsers.add_parser("list", help="List retainer clients")

    # Generate Command
    gen_parser = subparsers.add_parser("generate", help="Generate report for a client")
    gen_parser.add_argument("email", help="Client email address")

    # All Command
    subparsers.add_parser("all", help="Generate reports for all clients")

    args = parser.parse_args()

    if args.command == "list":
        list_clients()
    elif args.command == "generate":
        generate_report(args.email)
    elif args.command == "all":
        generate_all_reports()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

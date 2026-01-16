"""
🎯 Client Portal Pro - Enhanced Client Experience
===================================================

Give clients their own branded portal.
Professional client experience!

Features:
- Branded login
- Project dashboard
- Document access
- Communication hub
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class PortalSection(Enum):
    """Portal sections."""
    DASHBOARD = "dashboard"
    PROJECTS = "projects"
    INVOICES = "invoices"
    DOCUMENTS = "documents"
    MESSAGES = "messages"
    REPORTS = "reports"


@dataclass
class ClientPortal:
    """A client portal."""
    id: str
    client_name: str
    email: str
    subdomain: str
    logo_url: str = ""
    primary_color: str = "#0EA5E9"
    sections: List[PortalSection] = field(default_factory=lambda: list(PortalSection))
    last_login: Optional[datetime] = None
    logins_count: int = 0


@dataclass
class PortalActivity:
    """Portal activity log."""
    id: str
    portal_id: str
    action: str
    section: PortalSection
    timestamp: datetime = field(default_factory=datetime.now)


class ClientPortalPro:
    """
    Client Portal Pro.
    
    Enhanced client experience.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.portals: Dict[str, ClientPortal] = {}
        self.activities: List[PortalActivity] = []

    def create_portal(
        self,
        client_name: str,
        email: str,
        subdomain: str = "",
        logo_url: str = "",
        primary_color: str = "#0EA5E9"
    ) -> ClientPortal:
        """Create a client portal."""
        portal = ClientPortal(
            id=f"PTL-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            email=email,
            subdomain=subdomain or client_name.lower().replace(" ", "-"),
            logo_url=logo_url,
            primary_color=primary_color
        )
        self.portals[portal.id] = portal
        return portal

    def log_activity(self, portal: ClientPortal, action: str, section: PortalSection):
        """Log portal activity."""
        activity = PortalActivity(
            id=f"ACT-{uuid.uuid4().hex[:6].upper()}",
            portal_id=portal.id,
            action=action,
            section=section
        )
        self.activities.append(activity)
        portal.logins_count += 1
        portal.last_login = datetime.now()

    def format_portal_preview(self, portal: ClientPortal) -> str:
        """Format portal preview."""
        last_login = portal.last_login.strftime("%Y-%m-%d") if portal.last_login else "Never"

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎯 CLIENT PORTAL                                         ║",
            f"║  {portal.client_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🌐 URL: https://{portal.subdomain}.portal.agency          ║",
            f"║  📧 Email: {portal.email:<42}  ║",
            f"║  🎨 Color: {portal.primary_color:<41}  ║",
            "║                                                           ║",
            "║  📋 ENABLED SECTIONS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]

        section_icons = {
            PortalSection.DASHBOARD: "📊",
            PortalSection.PROJECTS: "📁",
            PortalSection.INVOICES: "💳",
            PortalSection.DOCUMENTS: "📄",
            PortalSection.MESSAGES: "💬",
            PortalSection.REPORTS: "📈"
        }

        for section in portal.sections[:6]:
            icon = section_icons.get(section, "•")
            lines.append(f"║    {icon} {section.value.capitalize():<45}  ║")

        lines.extend([
            "║                                                           ║",
            f"║  📅 Last Login: {last_login:<37}  ║",
            f"║  🔢 Total Logins: {portal.logins_count:<34}  ║",
            "║                                                           ║",
            "║  [🔗 Copy Link]  [⚙️ Settings]  [📧 Invite]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Client-first!                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)

    def format_overview(self) -> str:
        """Format portals overview."""
        active = sum(1 for p in self.portals.values() if p.last_login)
        total_logins = sum(p.logins_count for p in self.portals.values())

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎯 CLIENT PORTALS OVERVIEW                               ║",
            f"║  {len(self.portals)} portals │ {active} active │ {total_logins} total logins        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Client         │ Subdomain       │ Status  │ Logins    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]

        for portal in list(self.portals.values())[:5]:
            status = "🟢 Active" if portal.last_login else "⚪ New"
            lines.append(
                f"║  {portal.client_name[:13]:<13} │ {portal.subdomain[:15]:<15} │ {status:<7} │ {portal.logins_count:>9} ║"
            )

        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    pro = ClientPortalPro("Saigon Digital Hub")

    print("🎯 Client Portal Pro")
    print("=" * 60)
    print()

    # Create portals
    portal1 = pro.create_portal("Sunrise Realty", "admin@sunrise.com")
    portal2 = pro.create_portal("Coffee Lab", "manager@coffeelab.com", primary_color="#8B4513")

    # Log activity
    pro.log_activity(portal1, "Viewed dashboard", PortalSection.DASHBOARD)
    pro.log_activity(portal1, "Downloaded invoice", PortalSection.INVOICES)

    print(pro.format_portal_preview(portal1))
    print()
    print(pro.format_overview())

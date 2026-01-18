"""
📚 SOP Library - Standard Operating Procedures
================================================

Centralized storage and management of agency SOPs to ensure operational consistency.
Every team member knows exactly what to do!

Features:
- Categorized procedures
- View tracking
- Version control presets
- Markdown content support
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class SOPCategory(Enum):
    """Business domains for standard procedures."""

    SALES = "sales"
    ONBOARDING = "onboarding"
    PROJECTS = "projects"
    SUPPORT = "support"
    MARKETING = "marketing"
    ADMIN = "admin"


@dataclass
class SOP:
    """A single Standard Operating Procedure entity record."""

    id: str
    title: str
    category: SOPCategory
    content: str
    version: str = "1.0"
    author: str = ""
    views: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.title or not self.content:
            raise ValueError("SOP must have title and content")


class SOPLibrary:
    """
    SOP Management System.

    Orchestrates the creation, categorization, and tracking of agency-wide operating standards.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.procedures: Dict[str, SOP] = {}
        logger.info(f"SOP Library initialized for {agency_name}")
        self._seed_defaults()

    def _seed_defaults(self):
        """Seed the library with core agency standards."""
        logger.info("Seeding default agency SOPs...")
        self.add_sop(
            "Client Onboarding",
            SOPCategory.ONBOARDING,
            "1. Welcome Call\n2. Setup Portal",
            "System",
        )
        self.add_sop(
            "Sales Discovery", SOPCategory.SALES, "1. Research\n2. Call\n3. Qualify", "System"
        )

    def add_sop(
        self, title: str, category: SOPCategory, content: str, author: str = "Expert AI"
    ) -> SOP:
        """Register a new procedure in the library."""
        sop = SOP(
            id=f"SOP-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            category=category,
            content=content,
            author=author,
        )
        self.procedures[sop.id] = sop
        logger.info(f"SOP Registered: {title} ({category.value})")
        return sop

    def track_view(self, sop_id: str) -> bool:
        """Increment the usage/view counter for a specific SOP."""
        if sop_id in self.procedures:
            self.procedures[sop_id].views += 1
            logger.debug(f"SOP {sop_id} viewed.")
            return True
        return False

    def format_dashboard(self) -> str:
        """Render the SOP Library Dashboard."""
        total = len(self.procedures)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 SOP LIBRARY DASHBOARD{' ' * 33}║",
            f"║  {total} standards documented │ Operational Excellence{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📂 CORE OPERATING PROCEDURES                             ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        icons = {SOPCategory.SALES: "💼", SOPCategory.ONBOARDING: "👋", SOPCategory.PROJECTS: "📁"}

        for s in list(self.procedures.values())[:5]:
            icon = icons.get(s.category, "📄")
            lines.append(
                f"║  {icon} {s.title[:20]:<20} │ {s.category.value:<12} │ {s.views:>5} views ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  [➕ New SOP]  [🔍 Search]  [📤 Export All]  [⚙️ Setup]   ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Scale Up!        ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📚 Initializing SOP System...")
    print("=" * 60)

    try:
        lib = SOPLibrary("Saigon Digital Hub")
        # Record views
        for sid in lib.procedures:
            lib.track_view(sid)

        print("\n" + lib.format_dashboard())

    except Exception as e:
        logger.error(f"SOP Error: {e}")

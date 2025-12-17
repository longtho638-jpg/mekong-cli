"""
📚 SOP Library - Standard Operating Procedures
================================================

Store and manage SOPs for consistency.
Every team member knows what to do!

Features:
- SOP categories
- Version control
- Access control
- Usage tracking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class SOPCategory(Enum):
    """SOP categories."""
    SALES = "sales"
    ONBOARDING = "onboarding"
    PROJECTS = "projects"
    SUPPORT = "support"
    MARKETING = "marketing"
    ADMIN = "admin"


@dataclass
class SOP:
    """A Standard Operating Procedure."""
    id: str
    title: str
    category: SOPCategory
    content: str
    version: str = "1.0"
    author: str = ""
    views: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class SOPLibrary:
    """
    SOP Library.
    
    Standard operating procedures.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sops: Dict[str, SOP] = {}
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default SOPs."""
        defaults = [
            ("Client Onboarding", SOPCategory.ONBOARDING, """
# Client Onboarding SOP

## Step 1: Welcome Call
- Schedule within 24 hours
- Gather requirements

## Step 2: Account Setup
- Create portal access
- Set up project

## Step 3: Kickoff
- Present roadmap
- Align expectations
"""),
            ("Sales Discovery Call", SOPCategory.SALES, """
# Discovery Call SOP

## Preparation
- Research company
- Review pain points

## Call Structure
- 5 min: Rapport
- 15 min: Discovery
- 10 min: Present solution
- 5 min: Next steps
"""),
            ("Project Handoff", SOPCategory.PROJECTS, """
# Project Handoff SOP

## Before Handoff
- Complete all deliverables
- QA all work

## During Handoff
- Live walkthrough
- Document access

## After Handoff
- Follow up in 3 days
- Collect feedback
"""),
        ]
        
        for title, category, content in defaults:
            sop = SOP(
                id=f"SOP-{uuid.uuid4().hex[:6].upper()}",
                title=title,
                category=category,
                content=content.strip(),
                author="System"
            )
            self.sops[sop.id] = sop
    
    def create_sop(
        self,
        title: str,
        category: SOPCategory,
        content: str,
        author: str = ""
    ) -> SOP:
        """Create a new SOP."""
        sop = SOP(
            id=f"SOP-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            category=category,
            content=content,
            author=author
        )
        self.sops[sop.id] = sop
        return sop
    
    def view_sop(self, sop: SOP):
        """Mark SOP as viewed."""
        sop.views += 1
    
    def format_library(self) -> str:
        """Format SOP library."""
        category_icons = {"sales": "💼", "onboarding": "👋", "projects": "📁", "support": "🎫", "marketing": "📢", "admin": "⚙️"}
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 SOP LIBRARY                                           ║",
            f"║  {len(self.sops)} procedures documented                          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ID         │ Title              │ Category │ Views    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for sop in self.sops.values():
            icon = category_icons.get(sop.category.value, "•")
            lines.append(
                f"║  {sop.id:<9} │ {sop.title[:18]:<18} │ {icon} {sop.category.value[:6]:<6} │ {sop.views:>8} ║"
            )
        
        lines.extend([
            "║                                                           ║",
            "║  📂 BY CATEGORY                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for cat in SOPCategory:
            count = sum(1 for s in self.sops.values() if s.category == cat)
            icon = category_icons.get(cat.value, "•")
            lines.append(f"║    {icon} {cat.value.capitalize():<15} │ {count} SOPs                      ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New SOP]  [📤 Export]  [🔍 Search]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Consistency wins!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    library = SOPLibrary("Saigon Digital Hub")
    
    print("📚 SOP Library")
    print("=" * 60)
    print()
    
    # View an SOP
    for sop in library.sops.values():
        library.view_sop(sop)
    
    print(library.format_library())

"""
📋 Project Templates - Reusable Project Blueprints
====================================================

Create projects faster with templates.
Consistency across all projects!

Features:
- Pre-built templates
- Custom templates
- Task lists
- Milestone presets
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TemplateCategory(Enum):
    """Template categories."""
    SEO = "seo"
    WEBSITE = "website"
    MARKETING = "marketing"
    CONTENT = "content"
    SOCIAL = "social"
    CUSTOM = "custom"


@dataclass
class TemplateTask:
    """A template task."""
    name: str
    duration_days: int
    dependencies: List[str] = field(default_factory=list)


@dataclass
class TemplateMilestone:
    """A template milestone."""
    name: str
    week: int
    deliverables: List[str] = field(default_factory=list)


@dataclass
class ProjectTemplate:
    """A project template."""
    id: str
    name: str
    category: TemplateCategory
    description: str
    duration_weeks: int
    tasks: List[TemplateTask] = field(default_factory=list)
    milestones: List[TemplateMilestone] = field(default_factory=list)
    times_used: int = 0


class ProjectTemplates:
    """
    Project Templates.
    
    Reusable project blueprints.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.templates: Dict[str, ProjectTemplate] = {}
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default templates."""
        # SEO Template
        seo = ProjectTemplate(
            id="TPL-SEO001",
            name="SEO Campaign",
            category=TemplateCategory.SEO,
            description="Complete SEO optimization campaign",
            duration_weeks=12,
            tasks=[
                TemplateTask("Technical Audit", 5),
                TemplateTask("Keyword Research", 7),
                TemplateTask("On-page Optimization", 14),
                TemplateTask("Content Strategy", 7),
                TemplateTask("Link Building", 30),
            ],
            milestones=[
                TemplateMilestone("Audit Complete", 2, ["Technical report", "Recommendations"]),
                TemplateMilestone("On-page Done", 6, ["Optimized pages", "Meta tags"]),
                TemplateMilestone("Results Report", 12, ["Rankings", "Traffic increase"]),
            ],
            times_used=24
        )
        self.templates[seo.id] = seo
        
        # Website Template
        website = ProjectTemplate(
            id="TPL-WEB001",
            name="Website Redesign",
            category=TemplateCategory.WEBSITE,
            description="Full website redesign project",
            duration_weeks=8,
            tasks=[
                TemplateTask("Discovery", 5),
                TemplateTask("Wireframes", 7),
                TemplateTask("Design", 14),
                TemplateTask("Development", 21),
                TemplateTask("Testing", 7),
            ],
            milestones=[
                TemplateMilestone("Design Approved", 3, ["Final mockups"]),
                TemplateMilestone("Dev Complete", 6, ["Staging site"]),
                TemplateMilestone("Launch", 8, ["Live site"]),
            ],
            times_used=18
        )
        self.templates[website.id] = website
        
        # Social Media Template
        social = ProjectTemplate(
            id="TPL-SOC001",
            name="Social Media Campaign",
            category=TemplateCategory.SOCIAL,
            description="Monthly social media management",
            duration_weeks=4,
            tasks=[
                TemplateTask("Content Calendar", 3),
                TemplateTask("Content Creation", 7),
                TemplateTask("Scheduling", 2),
                TemplateTask("Community Management", 28),
            ],
            milestones=[
                TemplateMilestone("Calendar Approved", 1, ["Monthly calendar"]),
                TemplateMilestone("Monthly Report", 4, ["Analytics", "Insights"]),
            ],
            times_used=32
        )
        self.templates[social.id] = social
    
    def create_template(
        self,
        name: str,
        category: TemplateCategory,
        description: str,
        duration_weeks: int
    ) -> ProjectTemplate:
        """Create a custom template."""
        template = ProjectTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            category=category,
            description=description,
            duration_weeks=duration_weeks
        )
        self.templates[template.id] = template
        return template
    
    def use_template(self, template: ProjectTemplate):
        """Mark template as used."""
        template.times_used += 1
    
    def format_library(self) -> str:
        """Format template library."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 PROJECT TEMPLATES                                     ║",
            f"║  {len(self.templates)} templates available                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ID         │ Name           │ Category │ Weeks │ Used  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        category_icons = {"seo": "🔍", "website": "🌐", "marketing": "📢", "social": "📱", "content": "✍️", "custom": "⚙️"}
        
        for template in self.templates.values():
            icon = category_icons.get(template.category.value, "•")
            lines.append(
                f"║  {template.id:<9} │ {template.name[:14]:<14} │ {icon} {template.category.value[:6]:<6} │ {template.duration_weeks:>5} │ {template.times_used:>5} ║"
            )
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Create Template]  [📂 Import]  [📤 Export]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Work smarter!                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    templates = ProjectTemplates("Saigon Digital Hub")
    
    print("📋 Project Templates")
    print("=" * 60)
    print()
    
    # Use a template
    templates.use_template(templates.templates["TPL-SEO001"])
    
    print(templates.format_library())

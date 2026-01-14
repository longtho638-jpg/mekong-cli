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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TemplateCategory(Enum):
    """Business domains for project templates."""
    SEO = "seo"
    WEBSITE = "website"
    MARKETING = "marketing"
    CONTENT = "content"
    SOCIAL = "social"
    CUSTOM = "custom"


@dataclass
class TemplateTask:
    """A task definition within a template."""
    name: str
    duration_days: int
    dependencies: List[str] = field(default_factory=list)


@dataclass
class TemplateMilestone:
    """A project milestone within a template."""
    name: str
    week: int
    deliverables: List[str] = field(default_factory=list)


@dataclass
class ProjectTemplate:
    """A comprehensive project blueprint entity."""
    id: str
    name: str
    category: TemplateCategory
    description: str
    duration_weeks: int
    tasks: List[TemplateTask] = field(default_factory=list)
    milestones: List[TemplateMilestone] = field(default_factory=list)
    times_used: int = 0

    def __post_init__(self):
        if not self.name:
            raise ValueError("Template name is required")
        if self.duration_weeks <= 0:
            raise ValueError("Duration must be positive")


class ProjectTemplates:
    """
    Project Templates System.
    
    Orchestrates the lifecycle of project blueprints, enabling rapid initialization of standardized services.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.templates: Dict[str, ProjectTemplate] = {}
        logger.info(f"Project Templates system initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Seed the system with high-frequency project blueprints."""
        logger.info("Loading default agency templates...")
        self.register_template(
            "SEO Sprint", TemplateCategory.SEO, "High-intensity SEO audit", 4,
            [TemplateTask("Audit", 7), TemplateTask("Keywords", 7)],
            [TemplateMilestone("Ready", 4, ["Report"])]
        )
    
    def register_template(
        self,
        name: str,
        category: TemplateCategory,
        desc: str,
        weeks: int,
        tasks: Optional[List[TemplateTask]] = None,
        milestones: Optional[List[TemplateMilestone]] = None
    ) -> ProjectTemplate:
        """Create and store a new project blueprint."""
        tpl = ProjectTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name, category=category, description=desc,
            duration_weeks=weeks, tasks=tasks or [],
            milestones=milestones or []
        )
        self.templates[tpl.id] = tpl
        logger.info(f"Template registered: {name} ({category.value})")
        return tpl
    
    def increment_usage(self, tpl_id: str) -> bool:
        """Track how many times a template has been used."""
        if tpl_id in self.templates:
            self.templates[tpl_id].times_used += 1
            logger.debug(f"Template {tpl_id} usage incremented")
            return True
        return False
    
    def format_dashboard(self) -> str:
        """Render the Project Templates Dashboard."""
        total = len(self.templates)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 PROJECT TEMPLATE LIBRARY{' ' * 31}║",
            f"║  {total} templates available │ Shared across the network{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📂 AVAILABLE BLUEPRINTS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {
            TemplateCategory.SEO: "🔍", TemplateCategory.WEBSITE: "🌐", 
            TemplateCategory.MARKETING: "📢", TemplateCategory.SOCIAL: "📱"
        }
        
        for t in list(self.templates.values())[:5]:
            icon = icons.get(t.category, "📄")
            lines.append(f"║  {icon} {t.name[:20]:<20} │ {t.duration_weeks:>2} weeks │ Used: {t.times_used:>3} times ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Template]  [📂 Import]  [📤 Export Library]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Scale Faster!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Templates...")
    print("=" * 60)
    
    try:
        tpl_system = ProjectTemplates("Saigon Digital Hub")
        # Record usage
        if tpl_system.templates:
            tid = list(tpl_system.templates.keys())[0]
            tpl_system.increment_usage(tid)
            
        print("\n" + tpl_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Template Error: {e}")

"""
📚 Knowledge Base - Agency Resources
======================================

Store and organize agency resources and templates.
Everything your team needs in one place!

Features:
- Resource categories
- Template library
- Search functionality
- Quick access commands
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class ResourceCategory(Enum):
    """Resource categories."""
    TEMPLATES = "templates"
    GUIDES = "guides"
    CHECKLISTS = "checklists"
    SCRIPTS = "scripts"
    PROCESSES = "processes"
    TRAINING = "training"


class ResourceType(Enum):
    """Resource types."""
    DOCUMENT = "document"
    VIDEO = "video"
    SPREADSHEET = "spreadsheet"
    PRESENTATION = "presentation"
    CHECKLIST = "checklist"


@dataclass
class Resource:
    """A knowledge base resource."""
    id: str
    title: str
    category: ResourceCategory
    type: ResourceType
    description: str
    content: str
    tags: List[str]
    views: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


class KnowledgeBase:
    """
    Knowledge Base.
    
    Store and organize agency resources.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.resources: Dict[str, Resource] = {}
        
        # Pre-populate with starter resources
        self._add_starter_resources()
    
    def _add_starter_resources(self):
        """Add starter resources."""
        starters = [
            {
                "title": "Client Onboarding Checklist",
                "category": ResourceCategory.CHECKLISTS,
                "type": ResourceType.CHECKLIST,
                "description": "Step-by-step checklist for onboarding new clients",
                "content": """
□ Send welcome email
□ Schedule kickoff call
□ Collect brand assets
□ Set up project in tracker
□ Create shared folder
□ Send contract for signing
□ Collect first payment
□ Assign team members
                """,
                "tags": ["onboarding", "client", "checklist"]
            },
            {
                "title": "Sales Call Script",
                "category": ResourceCategory.SCRIPTS,
                "type": ResourceType.DOCUMENT,
                "description": "Proven script for discovery and sales calls",
                "content": """
OPENING (2 min):
- Introduce yourself and agency
- Confirm time available

DISCOVERY (10 min):
- What are your biggest challenges?
- What have you tried before?
- What would success look like?

SOLUTION (5 min):
- Present relevant case studies
- Explain your approach

CLOSE (3 min):
- Propose next steps
- Schedule follow-up
                """,
                "tags": ["sales", "script", "call"]
            },
            {
                "title": "Monthly Report Template",
                "category": ResourceCategory.TEMPLATES,
                "type": ResourceType.DOCUMENT,
                "description": "Template for client monthly performance reports",
                "content": """
# Monthly Report: [Client Name]
## Month: [Month Year]

### Executive Summary
[Brief overview of performance]

### Key Metrics
- Traffic: X (↑/↓ Y%)
- Leads: X (↑/↓ Y%)
- Conversions: X (↑/↓ Y%)

### Highlights
- [Win 1]
- [Win 2]

### Next Month Focus
- [Priority 1]
- [Priority 2]
                """,
                "tags": ["report", "template", "monthly"]
            },
            {
                "title": "SEO Audit Guide",
                "category": ResourceCategory.GUIDES,
                "type": ResourceType.DOCUMENT,
                "description": "Complete guide for conducting SEO audits",
                "content": """
1. TECHNICAL SEO
   - Site speed analysis
   - Mobile responsiveness
   - Crawl errors
   - Sitemap check

2. ON-PAGE SEO
   - Title tags
   - Meta descriptions
   - Header structure
   - Content quality

3. OFF-PAGE SEO
   - Backlink profile
   - Domain authority
   - Competitor analysis
                """,
                "tags": ["seo", "audit", "guide"]
            },
            {
                "title": "New Hire Training",
                "category": ResourceCategory.TRAINING,
                "type": ResourceType.DOCUMENT,
                "description": "Training materials for new team members",
                "content": """
WEEK 1: Orientation
- Company culture
- Tools & systems
- Meet the team

WEEK 2: Process Training
- Project management
- Client communication
- Quality standards

WEEK 3: Shadowing
- Join client calls
- Observe projects
- Ask questions
                """,
                "tags": ["training", "onboarding", "hr"]
            },
            {
                "title": "Project Kickoff Process",
                "category": ResourceCategory.PROCESSES,
                "type": ResourceType.DOCUMENT,
                "description": "Standard process for starting new projects",
                "content": """
1. PRE-KICKOFF
   □ Review contract scope
   □ Assign project manager
   □ Create project folder

2. KICKOFF MEETING
   □ Introductions
   □ Review goals
   □ Discuss timeline
   □ Set communication cadence

3. POST-KICKOFF
   □ Send meeting notes
   □ Create tasks in tracker
   □ Schedule next meeting
                """,
                "tags": ["process", "kickoff", "project"]
            }
        ]
        
        for starter in starters:
            self.add_resource(**starter)
    
    def add_resource(
        self,
        title: str,
        category: ResourceCategory,
        type: ResourceType,
        description: str,
        content: str,
        tags: List[str]
    ) -> Resource:
        """Add a resource."""
        resource = Resource(
            id=f"KB-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            category=category,
            type=type,
            description=description,
            content=content,
            tags=tags
        )
        
        self.resources[resource.id] = resource
        return resource
    
    def search(self, query: str) -> List[Resource]:
        """Search resources."""
        query_lower = query.lower()
        results = []
        
        for resource in self.resources.values():
            if (query_lower in resource.title.lower() or
                query_lower in resource.description.lower() or
                any(query_lower in tag for tag in resource.tags)):
                results.append(resource)
        
        return results
    
    def format_resource(self, resource: Resource) -> str:
        """Format single resource."""
        type_icons = {
            ResourceType.DOCUMENT: "📄",
            ResourceType.VIDEO: "🎥",
            ResourceType.SPREADSHEET: "📊",
            ResourceType.PRESENTATION: "📽️",
            ResourceType.CHECKLIST: "✅"
        }
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 {resource.title.upper()[:48]:<48}  ║",
            f"║  {type_icons[resource.type]} {resource.type.value.capitalize()} | {resource.category.value.capitalize():<34}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  {resource.description[:53]:<53}  ║",
            "║                                                           ║",
            "║  📋 CONTENT:                                              ║",
        ]
        
        content_lines = resource.content.strip().split('\n')[:8]
        for line in content_lines:
            lines.append(f"║  {line[:53]:<53}  ║")
        
        if len(resource.content.strip().split('\n')) > 8:
            lines.append("║  ... (more content)                                     ║")
        
        tags_str = ", ".join(f"#{tag}" for tag in resource.tags[:4])
        lines.extend([
            "║                                                           ║",
            f"║  🏷️ {tags_str:<48}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_library(self) -> str:
        """Format library overview."""
        # Count by category
        category_counts = {}
        for cat in ResourceCategory:
            count = sum(1 for r in self.resources.values() if r.category == cat)
            if count > 0:
                category_counts[cat] = count
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 KNOWLEDGE BASE                                        ║",
            f"║  Total Resources: {len(self.resources):<35}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        cat_icons = {
            ResourceCategory.TEMPLATES: "📝",
            ResourceCategory.GUIDES: "📖",
            ResourceCategory.CHECKLISTS: "✅",
            ResourceCategory.SCRIPTS: "📜",
            ResourceCategory.PROCESSES: "⚙️",
            ResourceCategory.TRAINING: "🎓"
        }
        
        for cat, count in category_counts.items():
            icon = cat_icons[cat]
            lines.append(f"║  {icon} {cat.value.capitalize():<20} ({count} resources)                 ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🔍 QUICK ACCESS:                                         ║",
            "║    • kb.search('onboarding')                              ║",
            "║    • kb.get_by_category('templates')                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Knowledge is power!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    kb = KnowledgeBase("Saigon Digital Hub")
    
    print("📚 Knowledge Base")
    print("=" * 60)
    print()
    
    print(kb.format_library())
    print()
    
    # Search example
    results = kb.search("onboarding")
    if results:
        print(f"🔍 Search results for 'onboarding': {len(results)} found")
        print()
        print(kb.format_resource(results[0]))

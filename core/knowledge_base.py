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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResourceCategory(Enum):
    """Broad categories for agency intellectual property."""
    TEMPLATES = "templates"
    GUIDES = "guides"
    CHECKLISTS = "checklists"
    SCRIPTS = "scripts"
    PROCESSES = "processes"
    TRAINING = "training"


class ResourceType(Enum):
    """Format of the knowledge asset."""
    DOCUMENT = "document"
    VIDEO = "video"
    SPREADSHEET = "spreadsheet"
    CHECKLIST = "checklist"


@dataclass
class Resource:
    """A single knowledge asset record entity."""
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

    def __post_init__(self):
        if not self.title or not self.content:
            raise ValueError("Title and content are required")


class KnowledgeBase:
    """
    Knowledge Base System.
    
    Orchestrates the storage, retrieval, and categorization of institutional knowledge.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.resources: Dict[str, Resource] = {}
        logger.info(f"Knowledge Base initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Seed the system with essential agency starting resources."""
        logger.info("Loading default knowledge assets...")
        try:
            self.add_resource(
                "Client Onboarding", ResourceCategory.CHECKLISTS, ResourceType.CHECKLIST,
                "Steps for new accounts", "1. Welcome 2. Kickoff 3. Contract", ["setup"]
            )
            self.add_resource(
                "Sales Script", ResourceCategory.SCRIPTS, ResourceType.DOCUMENT,
                "Discovery call guide", "Hello, I am calling from...", ["sales"]
            )
        except Exception as e:
            logger.error(f"Error seeding knowledge base: {e}")
    
    def add_resource(
        self,
        title: str,
        category: ResourceCategory,
        res_type: ResourceType,
        description: str,
        content: str,
        tags: List[str]
    ) -> Resource:
        """Register a new asset into the knowledge base."""
        res = Resource(
            id=f"KB-{uuid.uuid4().hex[:6].upper()}",
            title=title, category=category, type=res_type,
            description=description, content=content, tags=tags
        )
        self.resources[res.id] = res
        logger.info(f"Resource indexed: {title} ({category.value})")
        return res
    
    def search(self, query: str) -> List[Resource]:
        """Keyword search across titles, descriptions, and tags."""
        q = query.lower()
        results = [
            r for r in self.resources.values()
            if q in r.title.lower() or q in r.description.lower() or any(q in t.lower() for t in r.tags)
        ]
        logger.debug(f"Search for '{query}' found {len(results)} matches.")
        return results
    
    def format_dashboard(self) -> str:
        """Render the Knowledge Base Library Dashboard."""
        total = len(self.resources)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 KNOWLEDGE BASE - {self.agency_name.upper()[:30]:<30} ║",
            f"║  {total} total assets indexed{' ' * 36}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📂 ASSET REPOSITORY BY CATEGORY                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {
            ResourceCategory.TEMPLATES: "📝", ResourceCategory.GUIDES: "📖", 
            ResourceCategory.CHECKLISTS: "✅", ResourceCategory.SCRIPTS: "📜",
            ResourceCategory.PROCESSES: "⚙️", ResourceCategory.TRAINING: "🎓"
        }
        
        # Display aggregated counts by category
        cat_counts = {}
        for r in self.resources.values():
            cat_counts[r.category] = cat_counts.get(r.category, 0) + 1
            
        for cat in list(ResourceCategory):
            count = cat_counts.get(cat, 0)
            icon = icons.get(cat, "📁")
            lines.append(f"║  {icon} {cat.value.capitalize():<20} │ {count:>3} assets available      ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Asset]  [🔍 Search KB]  [📂 Export All]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Wisdom!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📚 Initializing Knowledge Base...")
    print("=" * 60)
    
    try:
        kb_system = KnowledgeBase("Saigon Digital Hub")
        print("\n" + kb_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Library Error: {e}")

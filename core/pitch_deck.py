"""
📊 Pitch Deck Generator - Fundraising Storytelling
===================================================

Create compelling pitch decks for VCs.
Inspired by Pillar VC templates.

Features:
- Deck template library (Seed, Series A)
- Slide structure framework
- Storytelling templates
- Investor-ready formatting
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

class RoundType(Enum):
    """Fundraising round categories."""
    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"


class SlideType(Enum):
    """Standard startup pitch deck slide types."""
    COVER = "cover"
    PROBLEM = "problem"
    SOLUTION = "solution"
    MARKET = "market"
    PRODUCT = "product"
    TRACTION = "traction"
    BUSINESS_MODEL = "business_model"
    COMPETITION = "competition"
    TEAM = "team"
    FINANCIALS = "financials"
    ASK = "ask"
    APPENDIX = "appendix"


@dataclass
class PitchSlide:
    """A single slide entity record."""
    slide_type: SlideType
    title: str
    content: Dict[str, Any] = field(default_factory=dict)
    notes: str = ""
    order: int = 0


@dataclass
class PitchDeck:
    """A complete pitch deck entity package."""
    id: str
    company_name: str
    round_type: RoundType
    tagline: str
    slides: List[PitchSlide] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    version: int = 1
    target_raise: float = 0.0
    pre_money_valuation: float = 0.0

    def __post_init__(self):
        if not self.company_name:
            raise ValueError("Company name is mandatory")


class PitchDeckGenerator:
    """
    Pitch Deck Generation System.
    
    Orchestrates the structural design and content layout for high-stakes investor presentations.
    """
    
    TEMPLATES: Dict[RoundType, List[SlideType]] = {
        RoundType.PRE_SEED: [SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION, SlideType.MARKET, SlideType.TEAM, SlideType.ASK],
        RoundType.SEED: [SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION, SlideType.MARKET, SlideType.TRACTION, SlideType.TEAM, SlideType.ASK]
    }
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.decks: Dict[str, PitchDeck] = {}
        logger.info(f"Pitch Deck Generator initialized for {agency_name}")
    
    def create_deck(
        self,
        name: str,
        round_t: RoundType,
        tagline: str,
        goal: float = 0.0
    ) -> PitchDeck:
        """Execute deck creation from standard templates."""
        deck = PitchDeck(
            id=f"DECK-{uuid.uuid4().hex[:6].upper()}",
            company_name=name, round_type=round_t,
            tagline=tagline, target_raise=float(goal)
        )
        
        # Hydrate slides
        template = self.TEMPLATES.get(round_t, self.TEMPLATES[RoundType.SEED])
        for i, stype in enumerate(template):
            deck.slides.append(PitchSlide(stype, stype.value.title(), order=i))
            
        self.decks[deck.id] = deck
        logger.info(f"Deck created: {name} ({round_t.value})")
        return deck
    
    def format_dashboard(self) -> str:
        """Render the Pitch Deck Dashboard."""
        total_goal = sum(d.target_raise for d in self.decks.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 PITCH DECK DASHBOARD{' ' * 33}║",
            f"║  {len(self.decks)} active decks │ ${total_goal:,.0f} total raise target{' ' * 14}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🚀 ACTIVE FUNDRAISING PROJECTS                           ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        round_icons = {RoundType.PRE_SEED: "🌱", RoundType.SEED: "🌾", RoundType.SERIES_A: "🚀"}
        
        for d in list(self.decks.values())[:5]:
            icon = round_icons.get(d.round_type, "📄")
            name_disp = (d.company_name[:18] + '..') if len(d.company_name) > 20 else d.company_name
            lines.append(f"║    {icon} {name_disp:<20} │ {len(d.slides)} slides │ ${d.target_raise:>10,.0f} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 Create Deck]  [📝 Content Editor]  [📤 Export PDF]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Funding!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Deck System...")
    print("=" * 60)
    
    try:
        gen = PitchDeckGenerator("Saigon Digital Hub")
        # Seed
        gen.create_deck("Acme AI", RoundType.SEED, "AI for good", 2000000.0)
        
        print("\n" + gen.format_dashboard())
        
    except Exception as e:
        logger.error(f"Generator Error: {e}")

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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class RoundType(Enum):
    """Fundraising round type."""
    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"


class SlideType(Enum):
    """Standard pitch deck slide types."""
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
    """A single pitch deck slide."""
    slide_type: SlideType
    title: str
    content: Dict[str, Any] = field(default_factory=dict)
    notes: str = ""
    order: int = 0


@dataclass
class PitchDeck:
    """A complete pitch deck."""
    id: str
    company_name: str
    round_type: RoundType
    tagline: str
    slides: List[PitchSlide] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    version: int = 1
    target_raise: float = 0
    pre_money_valuation: float = 0


class PitchDeckGenerator:
    """
    Pitch Deck Generator.
    
    Create compelling fundraising decks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.decks: Dict[str, PitchDeck] = {}
        self.templates: Dict[RoundType, List[SlideType]] = {
            RoundType.PRE_SEED: [
                SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION,
                SlideType.MARKET, SlideType.PRODUCT, SlideType.TEAM, SlideType.ASK
            ],
            RoundType.SEED: [
                SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION,
                SlideType.MARKET, SlideType.PRODUCT, SlideType.TRACTION,
                SlideType.BUSINESS_MODEL, SlideType.TEAM, SlideType.ASK
            ],
            RoundType.SERIES_A: [
                SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION,
                SlideType.MARKET, SlideType.PRODUCT, SlideType.TRACTION,
                SlideType.BUSINESS_MODEL, SlideType.COMPETITION,
                SlideType.TEAM, SlideType.FINANCIALS, SlideType.ASK
            ],
            RoundType.SERIES_B: [
                SlideType.COVER, SlideType.PROBLEM, SlideType.SOLUTION,
                SlideType.MARKET, SlideType.PRODUCT, SlideType.TRACTION,
                SlideType.BUSINESS_MODEL, SlideType.COMPETITION,
                SlideType.TEAM, SlideType.FINANCIALS, SlideType.ASK, SlideType.APPENDIX
            ]
        }
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Create a sample Series A deck
        deck = self.create_deck(
            company_name="TechVenture AI",
            round_type=RoundType.SERIES_A,
            tagline="AI-powered productivity for teams",
            target_raise=5_000_000,
            pre_money_valuation=20_000_000
        )
        
        # Add content to some slides
        for slide in deck.slides:
            if slide.slide_type == SlideType.PROBLEM:
                slide.content = {
                    "headline": "Teams waste 30% of time on repetitive tasks",
                    "pain_points": ["Manual data entry", "Meeting overload", "Context switching"]
                }
            elif slide.slide_type == SlideType.TRACTION:
                slide.content = {
                    "mrr": 150_000,
                    "growth": "25% MoM",
                    "customers": 50,
                    "nps": 72
                }
            elif slide.slide_type == SlideType.ASK:
                slide.content = {
                    "raise": 5_000_000,
                    "use_of_funds": {
                        "Engineering": "50%",
                        "Sales": "30%",
                        "Marketing": "15%",
                        "G&A": "5%"
                    }
                }
    
    def create_deck(
        self,
        company_name: str,
        round_type: RoundType,
        tagline: str,
        target_raise: float = 0,
        pre_money_valuation: float = 0
    ) -> PitchDeck:
        """Create a new pitch deck from template."""
        deck = PitchDeck(
            id=f"DECK-{uuid.uuid4().hex[:6].upper()}",
            company_name=company_name,
            round_type=round_type,
            tagline=tagline,
            target_raise=target_raise,
            pre_money_valuation=pre_money_valuation
        )
        
        # Generate slides from template
        template = self.templates.get(round_type, self.templates[RoundType.SEED])
        for i, slide_type in enumerate(template):
            slide = PitchSlide(
                slide_type=slide_type,
                title=self._get_slide_title(slide_type),
                order=i
            )
            deck.slides.append(slide)
        
        self.decks[deck.id] = deck
        return deck
    
    def _get_slide_title(self, slide_type: SlideType) -> str:
        """Get default title for slide type."""
        titles = {
            SlideType.COVER: "Welcome",
            SlideType.PROBLEM: "The Problem",
            SlideType.SOLUTION: "Our Solution",
            SlideType.MARKET: "Market Opportunity",
            SlideType.PRODUCT: "Product",
            SlideType.TRACTION: "Traction",
            SlideType.BUSINESS_MODEL: "Business Model",
            SlideType.COMPETITION: "Competition",
            SlideType.TEAM: "Team",
            SlideType.FINANCIALS: "Financial Projections",
            SlideType.ASK: "The Ask",
            SlideType.APPENDIX: "Appendix"
        }
        return titles.get(slide_type, slide_type.value.title())
    
    def get_storytelling_framework(self, round_type: RoundType) -> List[str]:
        """Get storytelling framework for round type."""
        frameworks = {
            RoundType.PRE_SEED: [
                "🎯 Vision: What world are you creating?",
                "😰 Problem: What pain are you solving?",
                "💡 Insight: What do you know others don't?",
                "🚀 Solution: How does it work?",
                "👥 Team: Why are you the ones to build this?",
                "💰 Ask: What do you need to get started?"
            ],
            RoundType.SEED: [
                "🎯 Hook: One sentence that captures everything",
                "😰 Problem: Quantify the pain",
                "💡 Solution: Show, don't tell",
                "📈 Traction: Early validation",
                "💰 Business: How you'll make money",
                "👥 Team: Unfair advantages",
                "🎯 Ask: Clear use of funds"
            ],
            RoundType.SERIES_A: [
                "📊 Proof: You've found product-market fit",
                "📈 Growth: Show the trajectory",
                "💰 Unit Economics: LTV/CAC story",
                "🏆 Competition: Why you'll win",
                "🗺️ Roadmap: 18-month plan",
                "💵 Financials: Path to profitability",
                "🎯 Ask: Scale the machine"
            ]
        }
        return frameworks.get(round_type, frameworks[RoundType.SEED])
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pitch deck statistics."""
        total_decks = len(self.decks)
        by_round = {}
        total_raise = 0
        
        for deck in self.decks.values():
            round_name = deck.round_type.value
            by_round[round_name] = by_round.get(round_name, 0) + 1
            total_raise += deck.target_raise
        
        return {
            "total_decks": total_decks,
            "by_round": by_round,
            "total_raise_target": total_raise,
            "templates_available": len(self.templates)
        }
    
    def format_dashboard(self) -> str:
        """Format pitch deck dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 PITCH DECK GENERATOR                                  ║",
            f"║  {stats['total_decks']} decks │ ${stats['total_raise_target']:,.0f} target  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE DECKS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for deck in list(self.decks.values())[:4]:
            round_icon = {"pre_seed": "🌱", "seed": "🌾", "series_a": "🚀", "series_b": "🔥"}
            icon = round_icon.get(deck.round_type.value, "📄")
            slides = len(deck.slides)
            lines.append(f"║    {icon} {deck.company_name:<18} │ {slides} slides │ ${deck.target_raise/1e6:.1f}M  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📝 STORYTELLING FRAMEWORK                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for tip in self.get_storytelling_framework(RoundType.SEED)[:4]:
            lines.append(f"║    {tip:<53}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 DECK TEMPLATES                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🌱 Pre-Seed       │  7 slides                        ║",
            "║    🌾 Seed           │  9 slides                        ║",
            "║    🚀 Series A       │ 11 slides                        ║",
            "║    🔥 Series B       │ 12 slides                        ║",
            "║                                                           ║",
            "║  [📊 Create]  [📝 Edit]  [📤 Export]                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Tell your story!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    pdg = PitchDeckGenerator("Saigon Digital Hub")
    
    print("📊 Pitch Deck Generator")
    print("=" * 60)
    print()
    
    print(pdg.format_dashboard())

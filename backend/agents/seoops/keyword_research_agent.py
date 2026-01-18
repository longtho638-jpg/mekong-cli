"""
Keyword Research Agent - Search Volume & Rankings
Manages keyword research, difficulty scoring, and SERP analysis.
"""

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class SERPFeature(Enum):
    FEATURED_SNIPPET = "featured_snippet"
    PEOPLE_ASK = "people_also_ask"
    LOCAL_PACK = "local_pack"
    IMAGE_PACK = "image_pack"
    VIDEO = "video"
    KNOWLEDGE_PANEL = "knowledge_panel"


@dataclass
class Keyword:
    """SEO Keyword"""

    keyword: str
    search_volume: int
    difficulty: int  # 0-100
    cpc: float
    current_rank: Optional[int] = None
    previous_rank: Optional[int] = None
    serp_features: List[SERPFeature] = field(default_factory=list)

    @property
    def rank_change(self) -> int:
        if self.current_rank and self.previous_rank:
            return self.previous_rank - self.current_rank  # Positive = improved
        return 0

    @property
    def opportunity_score(self) -> float:
        # High volume, low difficulty = high opportunity
        if self.difficulty == 0:
            return 0
        return (self.search_volume / 1000) * (100 - self.difficulty) / 100


class KeywordResearchAgent:
    """
    Keyword Research Agent - Nghiên cứu Từ khóa

    Responsibilities:
    - Search volume analysis
    - Keyword difficulty scoring
    - SERP feature detection
    - Competitor gap analysis
    """

    def __init__(self):
        self.name = "Keyword Research"
        self.status = "ready"
        self.keywords: Dict[str, Keyword] = {}

    def research_keyword(self, keyword: str) -> Keyword:
        """Research a keyword"""
        kw = Keyword(
            keyword=keyword,
            search_volume=random.randint(100, 50000),
            difficulty=random.randint(10, 90),
            cpc=random.uniform(0.5, 15.0),
            current_rank=random.randint(1, 100) if random.random() > 0.3 else None,
            previous_rank=random.randint(1, 100) if random.random() > 0.3 else None,
        )

        # Add random SERP features
        all_features = list(SERPFeature)
        num_features = random.randint(0, 3)
        kw.serp_features = random.sample(all_features, num_features)

        self.keywords[keyword] = kw
        return kw

    def bulk_research(self, keywords: List[str]) -> List[Keyword]:
        """Research multiple keywords"""
        return [self.research_keyword(k) for k in keywords]

    def get_opportunities(self, min_volume: int = 500, max_difficulty: int = 50) -> List[Keyword]:
        """Find keyword opportunities"""
        opportunities = []
        for kw in self.keywords.values():
            if kw.search_volume >= min_volume and kw.difficulty <= max_difficulty:
                opportunities.append(kw)
        return sorted(opportunities, key=lambda k: k.opportunity_score, reverse=True)

    def get_rankings(self) -> List[Keyword]:
        """Get ranked keywords"""
        return sorted(
            [kw for kw in self.keywords.values() if kw.current_rank], key=lambda k: k.current_rank
        )

    def get_stats(self) -> Dict:
        """Get keyword research statistics"""
        keywords = list(self.keywords.values())
        ranked = [k for k in keywords if k.current_rank]
        top10 = [k for k in ranked if k.current_rank <= 10]

        return {
            "total_keywords": len(keywords),
            "ranked_keywords": len(ranked),
            "top_10": len(top10),
            "avg_difficulty": sum(k.difficulty for k in keywords) / len(keywords)
            if keywords
            else 0,
            "total_volume": sum(k.search_volume for k in keywords),
        }


# Demo
if __name__ == "__main__":
    agent = KeywordResearchAgent()

    print("🔍 Keyword Research Agent Demo\n")

    # Research keywords
    keywords = ["marketing automation", "crm software", "lead generation", "email marketing tools"]
    agent.bulk_research(keywords)

    print(f"📋 Researched: {len(keywords)} keywords")

    # Show rankings
    rankings = agent.get_rankings()
    print("\n📊 Rankings:")
    for kw in rankings[:3]:
        change = (
            f"↑{kw.rank_change}"
            if kw.rank_change > 0
            else f"↓{abs(kw.rank_change)}"
            if kw.rank_change < 0
            else "→"
        )
        print(f"   #{kw.current_rank} '{kw.keyword}' ({change})")
        print(f"      Vol: {kw.search_volume:,} | Diff: {kw.difficulty}%")

    # Opportunities
    opps = agent.get_opportunities()
    print(f"\n💡 Opportunities: {len(opps)}")

    # Stats
    stats = agent.get_stats()
    print("\n📈 Stats:")
    print(f"   Top 10: {stats['top_10']}")
    print(f"   Avg Difficulty: {stats['avg_difficulty']:.0f}%")

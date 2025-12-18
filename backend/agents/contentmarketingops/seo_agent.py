"""
SEO Agent - Search Engine Optimization
Manages keyword research, rankings, and technical SEO.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, date
from enum import Enum
import random


class KeywordDifficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


@dataclass
class Keyword:
    """SEO keyword"""
    id: str
    term: str
    volume: int
    difficulty: KeywordDifficulty
    current_rank: int = 0
    previous_rank: int = 0
    target_url: str = ""
    
    @property
    def rank_change(self) -> int:
        return self.previous_rank - self.current_rank


@dataclass
class Backlink:
    """Backlink"""
    id: str
    source_url: str
    target_url: str
    anchor_text: str
    domain_authority: int
    discovered_at: datetime = None


class SEOAgent:
    """
    SEO Agent - Tối ưu Công cụ Tìm kiếm
    
    Responsibilities:
    - Keyword research
    - Ranking tracking
    - Backlink analysis
    - Technical SEO audits
    """
    
    def __init__(self):
        self.name = "SEO"
        self.status = "ready"
        self.keywords: Dict[str, Keyword] = {}
        self.backlinks: Dict[str, Backlink] = {}
        
    def add_keyword(
        self,
        term: str,
        volume: int,
        difficulty: KeywordDifficulty,
        target_url: str = ""
    ) -> Keyword:
        """Add keyword to track"""
        keyword_id = f"kw_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        keyword = Keyword(
            id=keyword_id,
            term=term,
            volume=volume,
            difficulty=difficulty,
            target_url=target_url
        )
        
        self.keywords[keyword_id] = keyword
        return keyword
    
    def update_ranking(self, keyword_id: str, new_rank: int) -> Keyword:
        """Update keyword ranking"""
        if keyword_id not in self.keywords:
            raise ValueError(f"Keyword not found: {keyword_id}")
            
        keyword = self.keywords[keyword_id]
        keyword.previous_rank = keyword.current_rank
        keyword.current_rank = new_rank
        
        return keyword
    
    def add_backlink(
        self,
        source_url: str,
        target_url: str,
        anchor_text: str,
        domain_authority: int
    ) -> Backlink:
        """Add backlink"""
        backlink_id = f"bl_{random.randint(100,999)}"
        
        backlink = Backlink(
            id=backlink_id,
            source_url=source_url,
            target_url=target_url,
            anchor_text=anchor_text,
            domain_authority=domain_authority,
            discovered_at=datetime.now()
        )
        
        self.backlinks[backlink_id] = backlink
        return backlink
    
    def get_top_keywords(self, limit: int = 10) -> List[Keyword]:
        """Get top ranking keywords"""
        ranked = [k for k in self.keywords.values() if k.current_rank > 0]
        return sorted(ranked, key=lambda x: x.current_rank)[:limit]
    
    def get_stats(self) -> Dict:
        """Get SEO statistics"""
        keywords = list(self.keywords.values())
        backlinks = list(self.backlinks.values())
        
        ranked = [k for k in keywords if k.current_rank > 0]
        top10 = [k for k in ranked if k.current_rank <= 10]
        
        return {
            "total_keywords": len(keywords),
            "ranked_keywords": len(ranked),
            "top_10": len(top10),
            "avg_rank": sum(k.current_rank for k in ranked) / len(ranked) if ranked else 0,
            "total_backlinks": len(backlinks),
            "avg_da": sum(b.domain_authority for b in backlinks) / len(backlinks) if backlinks else 0
        }


# Demo
if __name__ == "__main__":
    agent = SEOAgent()
    
    print("🔍 SEO Agent Demo\n")
    
    # Add keywords
    k1 = agent.add_keyword("content marketing", 5000, KeywordDifficulty.MEDIUM, "/blog/content-marketing")
    k2 = agent.add_keyword("seo tips", 3000, KeywordDifficulty.EASY, "/blog/seo-tips")
    k3 = agent.add_keyword("marketing automation", 8000, KeywordDifficulty.HARD, "/features")
    
    print(f"📊 Keyword: {k1.term}")
    print(f"   Volume: {k1.volume}")
    print(f"   Difficulty: {k1.difficulty.value}")
    
    # Update rankings
    agent.update_ranking(k1.id, 5)
    agent.update_ranking(k2.id, 3)
    agent.update_ranking(k3.id, 15)
    
    # Backlinks
    agent.add_backlink("techblog.com", "/blog/content", "content marketing", 65)
    agent.add_backlink("marketingweek.com", "/features", "automation tool", 72)
    
    print("\n📈 Rankings:")
    for kw in agent.get_top_keywords():
        print(f"   #{kw.current_rank}: {kw.term}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Top 10: {stats['top_10']}")
    print(f"   Backlinks: {stats['total_backlinks']}")

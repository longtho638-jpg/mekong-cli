"""
Copy Agent - Copywriting & A/B Testing
Manages copy creation, variants, and performance.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class CopyType(Enum):
    HEADLINE = "headline"
    TAGLINE = "tagline"
    CTA = "cta"
    BODY = "body"
    EMAIL_SUBJECT = "email_subject"
    AD_COPY = "ad_copy"
    SOCIAL = "social"


class CopyStatus(Enum):
    DRAFT = "draft"
    TESTING = "testing"
    WINNER = "winner"
    ARCHIVED = "archived"


@dataclass
class CopyVariant:
    """Copy variant for A/B testing"""
    id: str
    text: str
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    
    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0
    
    @property
    def cvr(self) -> float:
        return (self.conversions / self.clicks * 100) if self.clicks > 0 else 0


@dataclass
class Copy:
    """Copy piece"""
    id: str
    name: str
    copy_type: CopyType
    status: CopyStatus = CopyStatus.DRAFT
    variants: List[CopyVariant] = field(default_factory=list)
    winner_id: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class CopyAgent:
    """
    Copy Agent - Quản lý Copywriting
    
    Responsibilities:
    - Copy creation
    - Headline variants
    - A/B testing
    - Performance tracking
    """
    
    def __init__(self):
        self.name = "Copy"
        self.status = "ready"
        self.copies: Dict[str, Copy] = {}
        
    def create_copy(
        self,
        name: str,
        copy_type: CopyType,
        initial_text: str
    ) -> Copy:
        """Create copy with initial variant"""
        copy_id = f"copy_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        variant = CopyVariant(
            id="var_A",
            text=initial_text
        )
        
        copy = Copy(
            id=copy_id,
            name=name,
            copy_type=copy_type,
            variants=[variant]
        )
        
        self.copies[copy_id] = copy
        return copy
    
    def add_variant(self, copy_id: str, text: str) -> Copy:
        """Add variant for A/B testing"""
        if copy_id not in self.copies:
            raise ValueError(f"Copy not found: {copy_id}")
            
        copy = self.copies[copy_id]
        variant_letter = chr(ord('A') + len(copy.variants))
        
        variant = CopyVariant(
            id=f"var_{variant_letter}",
            text=text
        )
        
        copy.variants.append(variant)
        return copy
    
    def start_test(self, copy_id: str) -> Copy:
        """Start A/B test"""
        if copy_id not in self.copies:
            raise ValueError(f"Copy not found: {copy_id}")
            
        copy = self.copies[copy_id]
        copy.status = CopyStatus.TESTING
        
        return copy
    
    def record_metrics(self, copy_id: str, variant_id: str, impressions: int, clicks: int, conversions: int) -> Copy:
        """Record variant metrics"""
        if copy_id not in self.copies:
            raise ValueError(f"Copy not found: {copy_id}")
            
        copy = self.copies[copy_id]
        
        for variant in copy.variants:
            if variant.id == variant_id:
                variant.impressions += impressions
                variant.clicks += clicks
                variant.conversions += conversions
        
        return copy
    
    def pick_winner(self, copy_id: str) -> Copy:
        """Pick winning variant based on CVR"""
        if copy_id not in self.copies:
            raise ValueError(f"Copy not found: {copy_id}")
            
        copy = self.copies[copy_id]
        
        winner = max(copy.variants, key=lambda v: v.cvr)
        copy.winner_id = winner.id
        copy.status = CopyStatus.WINNER
        
        return copy
    
    def get_stats(self) -> Dict:
        """Get copy statistics"""
        copies = list(self.copies.values())
        
        return {
            "total_copies": len(copies),
            "testing": len([c for c in copies if c.status == CopyStatus.TESTING]),
            "winners": len([c for c in copies if c.status == CopyStatus.WINNER]),
            "total_variants": sum(len(c.variants) for c in copies)
        }


# Demo
if __name__ == "__main__":
    agent = CopyAgent()
    
    print("✍️ Copy Agent Demo\n")
    
    # Create copy
    c1 = agent.create_copy("Homepage Hero", CopyType.HEADLINE, "Transform Your Business Today")
    agent.add_variant(c1.id, "Grow Your Business 10x Faster")
    agent.add_variant(c1.id, "The Future of Business Starts Here")
    
    print(f"📝 Copy: {c1.name}")
    print(f"   Type: {c1.copy_type.value}")
    print(f"   Variants: {len(c1.variants)}")
    
    # Test
    agent.start_test(c1.id)
    agent.record_metrics(c1.id, "var_A", 1000, 50, 5)
    agent.record_metrics(c1.id, "var_B", 1000, 80, 12)
    agent.record_metrics(c1.id, "var_C", 1000, 60, 8)
    
    print("\n📊 Results:")
    for v in c1.variants:
        print(f"   {v.id}: CTR {v.ctr:.1f}% | CVR {v.cvr:.1f}%")
    
    # Winner
    agent.pick_winner(c1.id)
    print(f"\n🏆 Winner: {c1.winner_id}")

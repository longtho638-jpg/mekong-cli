"""
Brand Identity Agent - Brand Guidelines & Visual Identity
Manages brand guidelines, tone of voice, and brand health.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


@dataclass
class ColorPalette:
    """Brand color palette"""
    primary: str
    secondary: str
    accent: str
    background: str
    text: str


@dataclass
class Typography:
    """Brand typography"""
    heading_font: str
    body_font: str
    display_font: str


@dataclass
class ToneOfVoice:
    """Brand tone of voice"""
    personality: List[str]
    dos: List[str]
    donts: List[str]


@dataclass
class BrandGuideline:
    """Brand guidelines"""
    id: str
    name: str
    version: str
    colors: ColorPalette
    typography: Typography
    tone: ToneOfVoice
    logo_usage: List[str] = field(default_factory=list)
    brand_health_score: float = 0


class BrandIdentityAgent:
    """
    Brand Identity Agent - Quản lý Nhận diện Thương hiệu
    
    Responsibilities:
    - Brand guidelines
    - Visual identity
    - Tone of voice
    - Brand health tracking
    """
    
    def __init__(self):
        self.name = "Brand Identity"
        self.status = "ready"
        self.guidelines: Dict[str, BrandGuideline] = {}
        
    def create_guidelines(
        self,
        name: str,
        version: str = "1.0"
    ) -> BrandGuideline:
        """Create brand guidelines"""
        guide_id = f"brand_{random.randint(100,999)}"
        
        guideline = BrandGuideline(
            id=guide_id,
            name=name,
            version=version,
            colors=ColorPalette(
                primary="#00ff41",
                secondary="#00bfff",
                accent="#ffd700",
                background="#050505",
                text="#ffffff"
            ),
            typography=Typography(
                heading_font="JetBrains Mono",
                body_font="Inter",
                display_font="Outfit"
            ),
            tone=ToneOfVoice(
                personality=["Professional", "Approachable", "Innovative"],
                dos=["Be clear", "Be helpful", "Be confident"],
                donts=["Don't use jargon", "Don't be pushy"]
            )
        )
        
        self.guidelines[guide_id] = guideline
        return guideline
    
    def update_colors(self, guide_id: str, colors: ColorPalette) -> BrandGuideline:
        """Update brand colors"""
        if guide_id not in self.guidelines:
            raise ValueError(f"Guidelines not found: {guide_id}")
            
        self.guidelines[guide_id].colors = colors
        return self.guidelines[guide_id]
    
    def set_brand_health(self, guide_id: str, score: float) -> BrandGuideline:
        """Set brand health score"""
        if guide_id not in self.guidelines:
            raise ValueError(f"Guidelines not found: {guide_id}")
            
        self.guidelines[guide_id].brand_health_score = score
        return self.guidelines[guide_id]
    
    def add_logo_rule(self, guide_id: str, rule: str) -> BrandGuideline:
        """Add logo usage rule"""
        if guide_id not in self.guidelines:
            raise ValueError(f"Guidelines not found: {guide_id}")
            
        self.guidelines[guide_id].logo_usage.append(rule)
        return self.guidelines[guide_id]
    
    def get_stats(self) -> Dict:
        """Get brand statistics"""
        guidelines = list(self.guidelines.values())
        
        return {
            "total_guidelines": len(guidelines),
            "avg_health": sum(g.brand_health_score for g in guidelines) / len(guidelines) if guidelines else 0
        }


# Demo
if __name__ == "__main__":
    agent = BrandIdentityAgent()
    
    print("🎨 Brand Identity Agent Demo\n")
    
    # Create guidelines
    g1 = agent.create_guidelines("Mekong-CLI Brand", "2.0")
    
    print(f"📋 Guidelines: {g1.name}")
    print(f"   Version: {g1.version}")
    
    print(f"\n🎨 Colors:")
    print(f"   Primary: {g1.colors.primary}")
    print(f"   Secondary: {g1.colors.secondary}")
    
    print(f"\n📝 Typography:")
    print(f"   Heading: {g1.typography.heading_font}")
    print(f"   Body: {g1.typography.body_font}")
    
    print(f"\n🎯 Tone:")
    print(f"   Personality: {', '.join(g1.tone.personality)}")
    
    # Logo rules
    agent.add_logo_rule(g1.id, "Minimum spacing: 20px")
    agent.add_logo_rule(g1.id, "Don't distort or rotate")
    
    # Brand health
    agent.set_brand_health(g1.id, 85)
    
    print(f"\n💚 Brand Health: {g1.brand_health_score}%")

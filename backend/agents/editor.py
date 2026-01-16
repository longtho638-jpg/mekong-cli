"""
Editor Agent - Content Creation
Transforms intel briefs into polished content.
"""

from dataclasses import dataclass
from typing import List
from datetime import datetime
import sys
import os

# Import VibeTuner for localized content
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from core.vibe_tuner import VibeTuner, VibeRegion


@dataclass
class ContentDraft:
    """Generated content piece"""
    title: str
    body: str
    platform: str  # facebook, zalo, blog, twitter
    pillar: str
    hashtags: List[str]
    vibe: str
    word_count: int = 0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.word_count == 0:
            self.word_count = len(self.body.split())


class EditorAgent:
    """
    Editor Agent - Biên tập nội dung
    
    Responsibilities:
    - Transform briefs into content
    - Apply Vibe Tuning
    - Format for platforms
    - Generate hashtags
    """
    
    PLATFORM_FORMATS = {
        "facebook": {"max_chars": 2000, "hashtags": 5},
        "zalo": {"max_chars": 1000, "hashtags": 3},
        "twitter": {"max_chars": 280, "hashtags": 3},
        "blog": {"max_chars": 5000, "hashtags": 10},
    }
    
    def __init__(self, vibe: str = "mien-tay"):
        self.name = "Editor"
        self.status = "ready"
        self.vibe_tuner = VibeTuner(VibeRegion(vibe))
        
    def create_post(
        self, 
        topic: str, 
        pillar: str,
        platform: str = "facebook"
    ) -> ContentDraft:
        """
        Create a social media post.
        
        Args:
            topic: Topic to write about
            pillar: Content pillar (Code-to-Cashflow, etc.)
            platform: Target platform
        """
        config = self.vibe_tuner.config
        
        # Generate content with vibe
        templates = {
            "Code-to-Cashflow": f"""
🚀 {topic}

Hôm nay mình chia sẻ cách tiết kiệm chi phí khi build agency {config.local_words[0] if config.local_words else ''}!

💡 Key takeaways:
• Hybrid Router giúp tiết kiệm 70% chi phí AI
• Mekong-CLI deploy trong 15 phút
• Không cần thuê developer

Bạn đã thử chưa? Comment bên dưới {config.local_words[1] if len(config.local_words) > 1 else ''} 👇
""",
            "Solopreneur Mindset": f"""
💪 {topic}

{config.tone} - đó là phong cách của Solopreneur!

🎯 3 điều mình học được:
1. Bán sản phẩm, không bán thời gian
2. Automation là teammate tốt nhất
3. $5k doanh thu, $50 chi phí = Possible!

Ai đang làm agency 1 người? 🙋‍♂️
""",
            "Local AI": f"""
🌊 {topic}

Tại sao AI cần nói giọng địa phương?

Demo: ChatGPT nói "Anh ơi" vs Mekong-CLI nói "{config.local_words[0] if config.local_words else 'nghen'}"

→ Kết nối với khách hàng tốt hơn!

#VibeTuning #MekongCLI #LocalAI
""",
        }
        
        body = templates.get(pillar, f"📝 {topic}\n\n{config.tone}")
        
        # Generate hashtags
        base_hashtags = ["MekongCLI", "AgencyAutomation", "AIVietnam"]
        pillar_tags = {
            "Code-to-Cashflow": ["DevVN", "TechStartup"],
            "Solopreneur Mindset": ["Solopreneur", "DigitalNomad"],
            "Local AI": ["VibeTuning", "LocalAI"],
        }
        hashtags = base_hashtags + pillar_tags.get(pillar, [])
        
        return ContentDraft(
            title=topic,
            body=body.strip(),
            platform=platform,
            pillar=pillar,
            hashtags=hashtags[:self.PLATFORM_FORMATS[platform]["hashtags"]],
            vibe=self.vibe_tuner.current_vibe.value
        )
    
    def batch_create(
        self, 
        topics: List[str], 
        pillar: str,
        platforms: List[str] = ["facebook"]
    ) -> List[ContentDraft]:
        """Create multiple content pieces"""
        drafts = []
        for topic in topics:
            for platform in platforms:
                drafts.append(self.create_post(topic, pillar, platform))
        return drafts


# Demo
if __name__ == "__main__":
    editor = EditorAgent(vibe="mien-tay")
    
    print("✏️ Editor Agent Demo\n")
    
    # Create post
    post = editor.create_post(
        topic="Tiết kiệm $500/tháng với Hybrid Router",
        pillar="Code-to-Cashflow",
        platform="facebook"
    )
    
    print(f"📝 Platform: {post.platform}")
    print(f"📌 Pillar: {post.pillar}")
    print(f"🎤 Vibe: {post.vibe}")
    print(f"📊 Words: {post.word_count}")
    print(f"#️⃣ Tags: {post.hashtags}")
    print(f"\n--- Content ---\n{post.body}")

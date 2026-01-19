"""
Director Agent - Video Production
Creates video scripts and manages voiceover/rendering.
"""

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import random


@dataclass
class VideoScript:
    """Video script with scenes"""
    title: str
    hook: str  # First 3 seconds
    scenes: List[str]
    cta: str
    duration_sec: int
    platform: str  # youtube, tiktok, reels
    voiceover_text: str


@dataclass
class VideoAsset:
    """Generated video asset"""
    script: VideoScript
    voiceover_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str = "draft"  # draft, rendering, ready
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class DirectorAgent:
    """
    Director Agent - Đạo diễn Video
    
    Responsibilities:
    - Create video scripts
    - Generate voiceover (ElevenLabs)
    - Render video (FFmpeg)
    - Create thumbnails
    """

    PLATFORMS = {
        "tiktok": {"ratio": "9:16", "max_sec": 60},
        "reels": {"ratio": "9:16", "max_sec": 90},
        "youtube": {"ratio": "16:9", "max_sec": 600},
        "shorts": {"ratio": "9:16", "max_sec": 60},
    }

    def __init__(self):
        self.name = "Director"
        self.status = "ready"

    def create_script(
        self,
        topic: str,
        platform: str = "tiktok",
        duration: int = 30
    ) -> VideoScript:
        """
        Create video script for given topic.
        
        Args:
            topic: Video topic
            platform: Target platform
            duration: Target duration in seconds
        """
        # Hook templates (first 3 seconds)
        hooks = [
            f"Bạn có biết {topic}?",
            f"Stop! Đây là cách {topic}...",
            f"99% người không biết điều này về {topic}",
            f"1 phút để master {topic}",
        ]

        # Scene templates
        scene_templates = [
            f"Vấn đề: Nhiều người gặp khó khăn với {topic}",
            f"Giải pháp: Mekong-CLI giúp bạn {topic} trong 15 phút",
            "Demo: Gõ 'mekong init' và xem kết quả",
            "Kết quả: Tiết kiệm 70% chi phí, tự động hóa hoàn toàn",
        ]

        # CTA templates
        ctas = [
            "Follow để xem thêm tips! 🔥",
            "Comment 'CLI' để nhận hướng dẫn! 👇",
            "Link trong bio để bắt đầu ngay! 🚀",
        ]

        # Build voiceover text
        hook = random.choice(hooks)
        scenes = scene_templates[:min(4, duration // 10)]
        cta = random.choice(ctas)

        voiceover_parts = [hook] + scenes + [cta]
        voiceover_text = " ".join(voiceover_parts)

        return VideoScript(
            title=topic,
            hook=hook,
            scenes=scenes,
            cta=cta,
            duration_sec=duration,
            platform=platform,
            voiceover_text=voiceover_text
        )

    def generate_asset(self, script: VideoScript) -> VideoAsset:
        """
        Generate video asset from script.
        In production: calls ElevenLabs + FFmpeg
        """
        # Simulate generation
        return VideoAsset(
            script=script,
            voiceover_url=f"https://storage.example.com/voice_{script.title[:10]}.mp3",
            video_url=f"https://storage.example.com/video_{script.title[:10]}.mp4",
            thumbnail_url=f"https://storage.example.com/thumb_{script.title[:10]}.jpg",
            status="ready"
        )


# Demo
if __name__ == "__main__":
    director = DirectorAgent()

    print("🎬 Director Agent Demo\n")

    # Create script
    script = director.create_script(
        topic="Tiết kiệm chi phí AI",
        platform="tiktok",
        duration=30
    )

    print(f"📝 Script: {script.title}")
    print(f"🎯 Platform: {script.platform} ({script.duration_sec}s)")
    print(f"\n🪝 Hook: {script.hook}")
    print("\n📍 Scenes:")
    for i, scene in enumerate(script.scenes, 1):
        print(f"   {i}. {scene}")
    print(f"\n🔔 CTA: {script.cta}")
    print(f"\n🎤 Voiceover ({len(script.voiceover_text)} chars):")
    print(f"   {script.voiceover_text[:100]}...")

    # Generate asset
    asset = director.generate_asset(script)
    print(f"\n✅ Asset Status: {asset.status}")
    print(f"   Video: {asset.video_url}")

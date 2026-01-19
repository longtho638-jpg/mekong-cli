"""
Vibe Tuner - AI Voice Localization
Mekong-CLI Core Module

USP: Adapts AI tone and vocabulary to specific Vietnamese regions.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List


class VibeRegion(Enum):
    """Supported regional vibes."""

    MIEN_TAY = "mien-tay"
    MIEN_BAC = "mien-bac"
    MIEN_TRUNG = "mien-trung"
    GEN_Z = "gen-z"
    PROFESSIONAL = "professional"
    NEUTRAL = "neutral"


@dataclass
class VibeConfig:
    """Configuration for a specific vibe profile."""

    region: VibeRegion
    tone: str
    style: str
    local_words: List[str]
    avoid_words: List[str]
    system_prompt: str
    replacements: Dict[str, str]


class VibeTuner:
    """
    Manages AI persona adaptation for local Vietnamese contexts.
    """

    # Static configuration for all vibes
    VIBES: Dict[VibeRegion, VibeConfig] = {
        VibeRegion.MIEN_TAY: VibeConfig(
            region=VibeRegion.MIEN_TAY,
            tone="Thân thiện, chân thành, ấm áp",
            style="Giọng miền Tây Nam Bộ",
            local_words=["hen", "nghen", "dạ", "tui", "bà con"],
            avoid_words=["nhé", "ạ"],
            system_prompt="Bạn là người miền Tây chính gốc. Nói chuyện thân thiện, dùng từ địa phương tự nhiên.",
            replacements={"tôi": "tui", "nhé": "nghen", "không": "hổng"},
        ),
        VibeRegion.MIEN_BAC: VibeConfig(
            region=VibeRegion.MIEN_BAC,
            tone="Lịch sự, trang trọng",
            style="Giọng Hà Nội",
            local_words=["ạ", "nhé", "vâng"],
            avoid_words=["hen", "nghen"],
            system_prompt="Bạn nói giọng Hà Nội chuẩn mực. Dùng kính ngữ phù hợp.",
            replacements={"nghen": "nhé", "tui": "tôi"},
        ),
        VibeRegion.MIEN_TRUNG: VibeConfig(
            region=VibeRegion.MIEN_TRUNG,
            tone="Mộc mạc, thật thà",
            style="Giọng miền Trung",
            local_words=["mô", "tê", "răng", "rứa"],
            avoid_words=[],
            system_prompt="Bạn là người miền Trung thật thà.",
            replacements={"đâu": "mô", "kia": "tê", "sao": "răng", "vậy": "rứa"},
        ),
        VibeRegion.GEN_Z: VibeConfig(
            region=VibeRegion.GEN_Z,
            tone="Trendy, năng động",
            style="Ngôn ngữ Gen Z",
            local_words=["chill", "vibe", "flex", "no cap"],
            avoid_words=["kính thưa"],
            system_prompt="Bạn là Gen Z authentic. Nói chuyện trendy, mix tiếng Anh-Việt.",
            replacements={"đồng ý": "chốt đơn", "tuyệt vời": "đỉnh chóp"},
        ),
        VibeRegion.PROFESSIONAL: VibeConfig(
            region=VibeRegion.PROFESSIONAL,
            tone="Chuyên nghiệp",
            style="Doanh nghiệp",
            local_words=["giải pháp", "hiệu quả"],
            avoid_words=["slang"],
            system_prompt="Bạn là chuyên gia tư vấn chuyên nghiệp.",
            replacements={},
        ),
        VibeRegion.NEUTRAL: VibeConfig(
            region=VibeRegion.NEUTRAL,
            tone="Trung lập",
            style="Tiếng Việt chuẩn",
            local_words=[],
            avoid_words=[],
            system_prompt="Bạn nói tiếng Việt chuẩn phổ thông.",
            replacements={},
        ),
    }

    LOCATIONS_MAP = {
        VibeRegion.MIEN_TAY: ["cần thơ", "can tho", "mekong", "long an"],
        VibeRegion.MIEN_BAC: ["hà nội", "ha noi", "hải phòng"],
        VibeRegion.MIEN_TRUNG: ["đà nẵng", "da nang", "huế"],
    }

    def __init__(self, default_vibe: VibeRegion = VibeRegion.NEUTRAL):
        self.current_vibe = default_vibe
        self.config = self.VIBES[default_vibe]

    def set_vibe(self, region: VibeRegion) -> VibeConfig:
        """Switch the current vibe."""
        if region not in self.VIBES:
            raise ValueError(f"Unknown region: {region}")
        self.current_vibe = region
        self.config = self.VIBES[region]
        return self.config

    def get_system_prompt(self, additional_context: str = "") -> str:
        """Construct the full system prompt."""
        prompt = self.config.system_prompt
        if additional_context:
            prompt += f"\n\nBối cảnh thêm: {additional_context}"
        return prompt

    def enhance_text(self, text: str) -> str:
        """
        Simulate the vibe by replacing common words with local variants.
        Useful for quick previews without LLM.
        """
        enhanced = text
        for original, replacement in self.config.replacements.items():
            # Simple case-insensitive replacement
            pattern = re.compile(re.escape(original), re.IGNORECASE)
            enhanced = pattern.sub(replacement, enhanced)
        return enhanced

    @classmethod
    def from_location(cls, location: str) -> "VibeTuner":
        """Factory method to create a tuner based on a location string."""
        loc_lower = location.lower()
        for region, keywords in cls.LOCATIONS_MAP.items():
            if any(k in loc_lower for k in keywords):
                return cls(region)
        return cls(VibeRegion.NEUTRAL)

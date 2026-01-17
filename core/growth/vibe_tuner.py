"""
Vibe Tuner - AI Voice Localization
Mekong-CLI Core Module

USP: Adapts AI tone and vocabulary to specific Vietnamese regions.
- Miền Tây: Friendly, warm, local dialect.
- Miền Bắc: Formal, polite, standard Hanoi style.
- Gen Z: Trendy, slang-heavy.
"""

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

class VibeTuner:
    """
    Manages AI persona adaptation for local Vietnamese contexts.
    """

    # Static configuration for all vibes
    VIBES: Dict[VibeRegion, VibeConfig] = {
        VibeRegion.MIEN_TAY: VibeConfig(
            region=VibeRegion.MIEN_TAY,
            tone="Thân thiện, chân thành, ấm áp",
            style="Giọng miền Tây Nam Bộ, gần gũi như hàng xóm",
            local_words=["hen", "nghen", "nhen", "dạ", "hổng", "chớ", "bển", "tui", "bà con", "số dzách"],
            avoid_words=["nhé", "ạ", "đấy", "thế"],
            system_prompt=(
                "Bạn là người miền Tây chính gốc. Nói chuyện thân thiện, chân thành, dùng từ địa phương tự nhiên "
                "(hen, nghen, tui, bà con). Tránh giọng văn cứng nhắc."
            )
        ),
        VibeRegion.MIEN_BAC: VibeConfig(
            region=VibeRegion.MIEN_BAC,
            tone="Lịch sự, trang trọng, chỉn chu",
            style="Giọng Hà Nội, chuẩn mực và tinh tế",
            local_words=["ạ", "nhé", "đấy", "thế", "vâng", "kính thưa", "xin phép"],
            avoid_words=["hen", "nghen", "hổng"],
            system_prompt=(
                "Bạn nói giọng Hà Nội chuẩn mực. Dùng kính ngữ phù hợp (ạ, vâng). "
                "Giọng văn tinh tế, chỉn chu, lịch sự."
            )
        ),
        VibeRegion.MIEN_TRUNG: VibeConfig(
            region=VibeRegion.MIEN_TRUNG,
            tone="Mộc mạc, thật thà, kiên cường",
            style="Giọng miền Trung, chất phác và thẳng thắn",
            local_words=["mô", "tê", "răng", "rứa", "chi", "tau", "mi", "eng"],
            avoid_words=[],
            system_prompt=(
                "Bạn là người miền Trung thật thà. Dùng từ địa phương nhẹ nhàng (mô, tê, răng, rứa). "
                "Giọng văn chất phác, thẳng thắn."
            )
        ),
        VibeRegion.GEN_Z: VibeConfig(
            region=VibeRegion.GEN_Z,
            tone="Trendy, năng động, hài hước",
            style="Ngôn ngữ Gen Z, slang",
            local_words=["ô kê", "slay", "chill", "vibe", "flex", "đỉnh chóp", "xịn xò", "no cap"],
            avoid_words=["kính thưa", "trịnh trọng"],
            system_prompt=(
                "Bạn là Gen Z authentic. Nói chuyện trendy, mix tiếng Anh-Việt tự nhiên (chill, vibe). "
                "Hài hước nhưng không cringe."
            )
        ),
        VibeRegion.PROFESSIONAL: VibeConfig(
            region=VibeRegion.PROFESSIONAL,
            tone="Chuyên nghiệp, thuyết phục",
            style="Doanh nghiệp, formal",
            local_words=["triển khai", "tối ưu", "giải pháp", "chiến lược", "hiệu quả"],
            avoid_words=["slang"],
            system_prompt=(
                "Bạn là chuyên gia tư vấn chuyên nghiệp. Giọng văn rõ ràng, mạch lạc, thuyết phục. "
                "Formal nhưng thân thiện."
            )
        ),
        VibeRegion.NEUTRAL: VibeConfig(
            region=VibeRegion.NEUTRAL,
            tone="Trung lập",
            style="Tiếng Việt chuẩn",
            local_words=[],
            avoid_words=[],
            system_prompt=(
                "Bạn nói tiếng Việt chuẩn phổ thông. Giọng văn trung lập, dễ hiểu, tự nhiên."
            )
        )
    }

    # Location mappings for auto-detection
    LOCATIONS_MAP = {
        VibeRegion.MIEN_TAY: [
            "cần thơ", "can tho", "an giang", "đồng tháp", "vĩnh long", "bến tre",
            "tiền giang", "sóc trăng", "bạc liêu", "cà mau", "kiên giang", "hậu giang",
            "sa đéc", "long an", "mekong"
        ],
        VibeRegion.MIEN_BAC: [
            "hà nội", "ha noi", "hải phòng", "quảng ninh", "bắc ninh", "hải dương",
            "hưng yên", "nam định", "thái bình", "ninh bình"
        ],
        VibeRegion.MIEN_TRUNG: [
            "đà nẵng", "da nang", "huế", "quảng nam", "quảng ngãi", "bình định",
            "phú yên", "khánh hòa", "nghệ an", "hà tĩnh", "thanh hóa"
        ]
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

    def enhance_prompt(self, user_prompt: str) -> str:
        """Wrap user prompt with vibe context hints."""
        return (
            f"[Vibe: {self.config.tone}]\n"
            f"[Style: {self.config.style}]\n"
            f"[Keywords: {', '.join(self.config.local_words[:4])}... ]\n\n"
            f"{user_prompt}"
        )

    @classmethod
    def from_location(cls, location: str) -> "VibeTuner":
        """Factory method to create a tuner based on a location string."""
        loc_lower = location.lower()

        for region, keywords in cls.LOCATIONS_MAP.items():
            if any(k in loc_lower for k in keywords):
                return cls(region)

        return cls(VibeRegion.NEUTRAL)

if __name__ == "__main__":
    print("🎤 Mekong-CLI Vibe Tuner Demo\n")

    tuner = VibeTuner.from_location("Can Tho")
    print(f"Detected: {tuner.current_vibe.name}")
    print(f"Prompt: {tuner.get_system_prompt()}")

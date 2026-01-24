"""
Vibe Service - Business logic for vibe operations
"""

import logging
from typing import Dict, List, Optional, TypedDict

from backend.models.vibe import VibeRequest, VibeResponse

logger = logging.getLogger(__name__)


class VibeConfig(TypedDict):
    """Configuration for a specific vibe"""
    tone: str
    style: str
    local_words: List[str]


class VibeListResponse(TypedDict):
    """Response structure for listing vibes"""
    vibes: List[str]
    current: str


class VibePromptResponse(TypedDict):
    """Response structure for vibe prompts"""
    vibe: str
    system_prompt: str


class VibeService:
    """Service for managing vibe configurations"""

    def __init__(self):
        self.available_vibes = [
            "saigon",
            "hanoi",
            "mekong",
            "dalat",
            "vungtau",
            "haiduong",
            "binhduong",
            "dongnai",
            "cantho",
            "angiang",
        ]
        self.current_vibe = "neutral"

    async def get_available_vibes(self) -> VibeListResponse:
        """Get list of available vibes"""
        return {"vibes": self.available_vibes, "current": self.current_vibe}

    async def set_vibe(self, request: VibeRequest) -> VibeResponse:
        """Set vibe based on region or location"""
        if request.location:
            logger.info(f"Detecting vibe for location: {request.location}")
            # Auto-detect from location (simulated)
            detected_vibe = self._detect_vibe_from_location(request.location)
            config = self._generate_config(detected_vibe)

            return VibeResponse(
                location=request.location, detected_vibe=detected_vibe, config=config
            )

        # Set by region ID
        if request.region not in self.available_vibes:
            logger.error(f"Unknown vibe requested: {request.region}")
            raise ValueError(f"Unknown vibe: {request.region}")

        logger.info(f"Setting vibe to: {request.region}")
        self.current_vibe = request.region
        config = self._generate_config(request.region)

        return VibeResponse(vibe=request.region, config=config)

    async def get_vibe_prompt(self, context: str = "") -> VibePromptResponse:
        """Get system prompt for current vibe"""
        prompt = self._generate_system_prompt(context)

        return {"vibe": self.current_vibe, "system_prompt": prompt}

    def _detect_vibe_from_location(self, location: str) -> str:
        """Detect vibe from location name (simplified)"""
        location_lower = location.lower()

        if "saigon" in location_lower or "hcmc" in location_lower:
            return "saigon"
        elif "hanoi" in location_lower:
            return "hanoi"
        elif "mekong" in location_lower or "cantho" in location_lower:
            return "mekong"
        elif "dalat" in location_lower:
            return "dalat"
        else:
            return "neutral"

    def _generate_config(self, vibe: str) -> VibeConfig:
        """Generate configuration for a vibe"""
        configs: Dict[str, VibeConfig] = {
            "saigon": {
                "tone": "energetic",
                "style": "modern",
                "local_words": ["dữ", "đỉnh", "xịn", "chất"],
            },
            "hanoi": {
                "tone": "elegant",
                "style": "traditional",
                "local_words": ["phải", "trời", "ơ", "gì"],
            },
            "mekong": {
                "tone": "warm",
                "style": "rustic",
                "local_words": ["tui", "mầy", "ngắt", "miền"],
            },
            "neutral": {"tone": "balanced", "style": "standard", "local_words": []},
        }

        return configs.get(vibe, configs["neutral"])

    def _generate_system_prompt(self, context: str) -> str:
        """Generate system prompt for current vibe"""
        config = self._generate_config(self.current_vibe)

        return f"""
You are communicating with {self.current_vibe} vibe users.

Tone: {config["tone"]}
Style: {config["style"]}
Local words to use: {", ".join(config["local_words"])}

Context: {context}

Respond naturally while maintaining the local flavor.
        """.strip()

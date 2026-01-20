import logging
import uuid
from datetime import datetime
from typing import List

from .models import (
    AgencyConfig,
    AgencyNiche,
    BrandIdentity,
    BrandStyle,
)

logger = logging.getLogger(__name__)

class EmpireEngine:
    """
    Core engine for building agency empires.
    """

    PALETTES = {
        BrandStyle.CYBER: {"primary": "#00ff41", "secondary": "#0d1117", "accent": "#00bfff"},
        BrandStyle.MINIMAL: {"primary": "#1a1a1a", "secondary": "#ffffff", "accent": "#6366f1"},
        BrandStyle.BOLD: {"primary": "#ff5f56", "secondary": "#1f2937", "accent": "#fbbf24"},
        BrandStyle.PROFESSIONAL: {
            "primary": "#1e40af",
            "secondary": "#f8fafc",
            "accent": "#0ea5e9",
        },
        BrandStyle.CREATIVE: {"primary": "#ec4899", "secondary": "#1e1b4b", "accent": "#a855f7"},
    }

    FONTS = {
        BrandStyle.CYBER: ("JetBrains Mono", "Inter"),
        BrandStyle.MINIMAL: ("Inter", "Inter"),
        BrandStyle.BOLD: ("Outfit", "Plus Jakarta Sans"),
        BrandStyle.PROFESSIONAL: ("Roboto", "Open Sans"),
        BrandStyle.CREATIVE: ("Poppins", "Nunito"),
    }

    NICHE_AGENTS = {
        AgencyNiche.SAAS_MARKETING: ["SEOAgent", "PPCAgent", "AnalyticsAgent"],
        AgencyNiche.ECOMMERCE: ["ProductAgent", "OrderAgent", "InventoryAgent"],
        AgencyNiche.LOCAL_BUSINESS: ["LocalSEOAgent", "GMBAgent", "ReviewAgent"],
    }

    def __init__(self):
        self.agencies_created: List[AgencyConfig] = []

    def generate_brand(
        self, name: str, niche: AgencyNiche, style: BrandStyle = BrandStyle.CYBER
    ) -> BrandIdentity:
        """Generate a complete brand kit based on niche and style."""
        palette = self.PALETTES.get(style, self.PALETTES[BrandStyle.PROFESSIONAL])
        fonts = self.FONTS.get(style, self.FONTS[BrandStyle.PROFESSIONAL])

        return BrandIdentity(
            name=name,
            tagline=f"Empowering {niche.value.replace('_', ' ').title()} with AI",
            primary_color=palette["primary"],
            secondary_color=palette["secondary"],
            accent_color=palette["accent"],
            font_heading=fonts[0],
            font_body=fonts[1],
            style=style,
            logo_concept=f"Modern {style.value} monogram",
        )

    def build_empire(
        self, name: str, niche: AgencyNiche, style: BrandStyle = BrandStyle.CYBER
    ) -> AgencyConfig:
        """Execute the full agency setup pipeline."""
        if not name:
            raise ValueError("Agency name is required")

        start = datetime.now()
        logger.info(f"Building empire: {name} in {niche.value}...")

        brand = self.generate_brand(name, niche, style)
        agents = self.NICHE_AGENTS.get(niche, ["GeneralAgent"])

        config = AgencyConfig(
            id=f"AGY-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            niche=niche,
            brand=brand,
            agents_activated=agents,
            legal_docs=[],
            created_at=datetime.now(),
            setup_time_seconds=int((datetime.now() - start).total_seconds()),
        )

        self.agencies_created.append(config)
        logger.info(f"Empire built successfully for {name} in {config.setup_time_seconds}s")
        return config

"""
🎨 White-Label Branding - Custom Agency Branding
==================================================

Customize Agency OS with your own branding.
Make it truly yours!

Features:
- Custom colors
- Logo upload
- Brand fonts
- Email templates
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class BrandColors:
    """Brand color scheme."""

    primary: str = "#2563EB"  # Blue
    secondary: str = "#7C3AED"  # Purple
    accent: str = "#F59E0B"  # Amber
    background: str = "#FFFFFF"  # White
    text: str = "#1F2937"  # Gray-800
    success: str = "#10B981"  # Green
    warning: str = "#F59E0B"  # Amber
    error: str = "#EF4444"  # Red


@dataclass
class BrandAssets:
    """Brand assets."""

    logo_url: str = ""
    favicon_url: str = ""
    cover_image_url: str = ""


@dataclass
class BrandConfig:
    """Complete brand configuration."""

    agency_name: str
    tagline: str
    colors: BrandColors
    assets: BrandAssets
    font_primary: str = "Inter"
    font_secondary: str = "Roboto"
    email_footer: str = ""
    created_at: datetime = field(default_factory=datetime.now)


class WhiteLabelBranding:
    """
    White-Label Branding System.

    Customize Agency OS with your brand.
    """

    # Pre-built color themes
    THEMES = {
        "ocean": BrandColors(primary="#0EA5E9", secondary="#06B6D4", accent="#F97316"),
        "forest": BrandColors(primary="#22C55E", secondary="#10B981", accent="#F59E0B"),
        "sunset": BrandColors(primary="#F97316", secondary="#EF4444", accent="#8B5CF6"),
        "midnight": BrandColors(primary="#1E293B", secondary="#334155", accent="#3B82F6"),
        "royal": BrandColors(primary="#7C3AED", secondary="#8B5CF6", accent="#EC4899"),
    }

    def __init__(self, agency_name: str, tagline: str = ""):
        self.config = BrandConfig(
            agency_name=agency_name,
            tagline=tagline or f"{agency_name} - Powered by Agency OS",
            colors=BrandColors(),
            assets=BrandAssets(),
        )

    def apply_theme(self, theme_name: str):
        """Apply a pre-built theme."""
        if theme_name in self.THEMES:
            self.config.colors = self.THEMES[theme_name]

    def set_colors(self, **kwargs):
        """Set custom colors."""
        for key, value in kwargs.items():
            if hasattr(self.config.colors, key):
                setattr(self.config.colors, key, value)

    def set_logo(self, logo_url: str):
        """Set logo URL."""
        self.config.assets.logo_url = logo_url

    def generate_css_variables(self) -> str:
        """Generate CSS custom properties."""
        return f""":root {{
  --color-primary: {self.config.colors.primary};
  --color-secondary: {self.config.colors.secondary};
  --color-accent: {self.config.colors.accent};
  --color-background: {self.config.colors.background};
  --color-text: {self.config.colors.text};
  --color-success: {self.config.colors.success};
  --color-warning: {self.config.colors.warning};
  --color-error: {self.config.colors.error};
  --font-primary: '{self.config.font_primary}', sans-serif;
  --font-secondary: '{self.config.font_secondary}', sans-serif;
}}"""

    def format_preview(self) -> str:
        """Format brand preview."""
        c = self.config.colors

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎨 WHITE-LABEL BRANDING                                  ║",
            f"║  {self.config.agency_name:<51}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📝 Tagline: {self.config.tagline[:40]:<40}  ║",
            "║                                                           ║",
            "║  🎨 COLOR SCHEME                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Primary:   ██ {c.primary:<15}                        ║",
            f"║    Secondary: ██ {c.secondary:<15}                        ║",
            f"║    Accent:    ██ {c.accent:<15}                        ║",
            f"║    Success:   ██ {c.success:<15}                        ║",
            f"║    Error:     ██ {c.error:<15}                        ║",
            "║                                                           ║",
            "║  🔤 TYPOGRAPHY                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Primary Font:   {self.config.font_primary:<35}  ║",
            f"║    Secondary Font: {self.config.font_secondary:<35}  ║",
            "║                                                           ║",
            "║  🖼️ ASSETS                                                ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]

        logo_status = "✅ Uploaded" if self.config.assets.logo_url else "⬜ Not set"
        favicon_status = "✅ Uploaded" if self.config.assets.favicon_url else "⬜ Not set"

        lines.extend(
            [
                f"║    Logo:    {logo_status:<43}  ║",
                f"║    Favicon: {favicon_status:<43}  ║",
                "║                                                           ║",
                "║  🎭 AVAILABLE THEMES                                      ║",
                "║  ─────────────────────────────────────────────────────── ║",
                "║    🌊 Ocean  │  🌲 Forest  │  🌅 Sunset                   ║",
                "║    🌙 Midnight  │  👑 Royal                              ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.config.agency_name} - Your brand, your way!     ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    branding = WhiteLabelBranding("Saigon Digital Hub", "Transform your business with AI")

    print("🎨 White-Label Branding")
    print("=" * 60)
    print()

    # Apply theme
    branding.apply_theme("ocean")
    branding.set_logo("https://example.com/logo.png")

    print(branding.format_preview())
    print()
    print("📄 Generated CSS:")
    print(branding.generate_css_variables())

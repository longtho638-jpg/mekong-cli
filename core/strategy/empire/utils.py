from .models import AgencyConfig

def format_empire_summary(config: AgencyConfig) -> str:
    """Render a text summary of the new empire."""
    lines = [
        "╔═══════════════════════════════════════════════════════════╗",
        f"║  🏯 EMPIRE CREATED: {config.name.upper()[:30]:<30}  ║",
        f"║  ID: {config.id} │ Style: {config.brand.style.value:<15}  ║",
        "╠═══════════════════════════════════════════════════════════╣",
        f"║  🎯 Niche: {config.niche.value:<47}  ║",
        f"║  🎨 Colors: {config.brand.primary_color} / {config.brand.accent_color} {' ' * 22} ║",
        f"║  🤖 Agents: {len(config.agents_activated)} active {' ' * 36} ║",
        "╠═══════════════════════════════════════════════════════════╣",
        "║  ✅ INFRASTRUCTURE READY                                  ║",
        "║  [🌐 Website] [📧 Email] [💼 CRM] [🔒 Legal] [🤖 AI]      ║",
        "╚═══════════════════════════════════════════════════════════╝",
    ]
    return "\n".join(lines)

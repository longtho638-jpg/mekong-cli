from .models import LicenseTier


def format_pricing_table(pricing_config: dict) -> str:
    """Render the pricing options table."""
    lines = [
        "╔═══════════════════════════════════════════════════════════╗",
        "║  🎫 AGENCY OS - FRANCHISE PRICING                         ║",
        "╠═══════════════════════════════════════════════════════════╣",
    ]

    for tier in LicenseTier:
        p = pricing_config[tier]
        cost = "FREE" if p["monthly"] == 0 else f"${p['monthly']:,.0f}/mo"
        terr = f"{p['territories']} terr" if p["territories"] < 99 else "Unlimited"
        lines.append(f"║  {tier.value.upper():<12} │ {cost:<10} │ {terr:<15} ║")

    lines.append("╚═══════════════════════════════════════════════════════════╝")
    return "\n".join(lines)

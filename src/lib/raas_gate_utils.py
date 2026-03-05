"""
RaaS License Gate - Utilities

Helper functions for license messaging and formatting.
"""

from typing import Optional


def get_upgrade_message(command: str) -> str:
    """Generate upgrade message for denied commands."""
    return f"""
╔══════════════════════════════════════════════════════════════╗
║  🔒 RaaS License Required                                    ║
╠══════════════════════════════════════════════════════════════╣
║  Command '{command}' requires RaaS License Key.            ║
║                                                              ║
║  Get your license: https://raas.mekong.dev/license           ║
║                                                              ║
║  Quick Start:                                                ║
║  1. Visit https://raas.mekong.dev/pricing                    ║
║  2. Choose plan (Trial: FREE, Pro: $29/mo, Enterprise: Custom)║
║  3. Copy your RAAS_LICENSE_KEY                               ║
║  4. Add to .env: RAAS_LICENSE_KEY=raas-pro-xxxxx             ║
║                                                              ║
║  Already have a key?                                         ║
║  → Add to .env: RAAS_LICENSE_KEY=raas-[tier]-[hash]          ║
╚══════════════════════════════════════════════════════════════╝
""".strip()


def format_license_preview(license_key: Optional[str]) -> str:
    """Format license key for display (masked)."""
    if not license_key:
        return "Not set"
    if len(license_key) < 12:
        return "***"
    return f"{license_key[:8]}...{license_key[-4:]}"


__all__ = ["get_upgrade_message", "format_license_preview"]

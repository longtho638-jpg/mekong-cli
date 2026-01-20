"""
🏯 Empire Builder - Core Strategy (Proxy)
========================================

This file is now a proxy for the modularized version in ./empire/
Please import from core.strategy.empire instead.
"""
import warnings
import logging

from .empire.models import AgencyNiche, BrandStyle, BrandIdentity, LegalDocument, AgencyConfig
from .empire.engine import EmpireEngine
from .empire.utils import format_empire_summary

# Issue a deprecation warning
warnings.warn(
    "core.strategy.empire_builder is deprecated. "
    "Use core.strategy.empire instead.",
    DeprecationWarning,
    stacklevel=2
)

# Preserve legacy class name for backward compatibility
class EmpireBuilder(EmpireEngine):
    """
    Deprecated: Use core.strategy.empire.engine.EmpireEngine instead.
    This class is kept for backward compatibility.
    """
    def format_summary(self, config: AgencyConfig) -> str:
        return format_empire_summary(config)

# Preserve main block for testing/CLI compatibility
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("🏯 Empire Builder Startup (Proxy Mode)...")
    print("=" * 60)

    try:
        builder = EmpireBuilder()
        empire = builder.build_empire(
            "Saigon Digital", AgencyNiche.SAAS_MARKETING, BrandStyle.MINIMAL
        )
        print("\n" + builder.format_summary(empire))

    except Exception as e:
        logging.getLogger(__name__).error(f"Empire Error: {e}")

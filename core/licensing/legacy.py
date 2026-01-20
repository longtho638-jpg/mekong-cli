"""
🎫 License System - Franchise Activation (Proxy)
==============================================

This file is now a proxy for the modularized version in ./legacy_logic/
Please import from core.licensing.legacy_logic instead.
"""
import warnings
import logging

from .legacy_logic.models import LicenseTier, LicenseStatus, License
from .legacy_logic.manager import LicenseEngine
from .legacy_logic.utils import format_pricing_table

# Issue a deprecation warning
warnings.warn(
    "core.licensing.legacy is deprecated. "
    "Use core.licensing.legacy_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

# Preserve legacy class name for backward compatibility
class LicenseManager(LicenseEngine):
    """
    Deprecated: Use core.licensing.legacy_logic.manager.LicenseEngine instead.
    This class is kept for backward compatibility.
    """
    def format_pricing_table(self) -> str:
        return format_pricing_table(self.PRICING)

# Preserve main block for testing/CLI compatibility
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("🎫 Initializing License System (Proxy Mode)...")
    print("=" * 60)

    try:
        mgr = LicenseManager()
        lic = mgr.activate_license("partner@agency.com", "Partner One", LicenseTier.FRANCHISE)

        print("\n" + mgr.format_pricing_table())
        print(f"\n✅ Active License: {lic.key}")

    except Exception as e:
        logging.getLogger(__name__).error(f"License Error: {e}")

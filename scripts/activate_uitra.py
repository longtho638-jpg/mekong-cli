#!/usr/bin/env python3
"""
🏯 UItra License Activation Script
===================================

Activates UItra (PRO tier) license for specified email.
Stores license in ~/.mekong/license.json for offline CLI usage.

Usage:
    python3 scripts/activate_uitra.py <email>
    python3 scripts/activate_uitra.py billwill.mentor@gmail.com

WIN-WIN-WIN: User gets PRO features, system tracks licensed users correctly.
"""

import argparse
import sys
import logging
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("activate_uitra")

def setup_path() -> None:
    """
    Ensure the project root is in sys.path to allow imports.
    """
    current_dir = Path(__file__).resolve().parent
    project_root = current_dir.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

setup_path()

try:
    from license import LicenseValidator, LicenseTier
except ImportError:
    logger.error("❌ Critical Error: Could not import 'license' module.")
    logger.error("   Ensure you are running this from the project root or 'scripts/' directory.")
    sys.exit(1)


def activate_uitra(email: str) -> Dict[str, Any]:
    """
    Activate UItra (PRO tier) license for email using the core LicenseValidator.
    
    Args:
        email: User's email address.
        
    Returns:
        Dict: Activation result containing key, tier, etc.
    """
    logger.info(f"🔄 Connecting to License Core for {email}...")
    validator = LicenseValidator()
    
    # Activate using the standardized logic in license.py
    # This ensures the key format matches what the validator expects
    try:
        license_data = validator.activate_by_email(email, tier=LicenseTier.PRO)
        return license_data
    except Exception as e:
        logger.error(f"❌ Activation Logic Failed: {e}")
        raise


def display_success(email: str, result: Dict[str, Any]) -> None:
    """
    Display formatted success message and quota details.
    """
    validator = LicenseValidator()
    
    print("\n" + "=" * 50)
    print(f"🏯  AGENCY OS: LICENSE ACTIVATED")
    print("=" * 50)
    print(f"✅  Status:   ACTIVE")
    print(f"📧  Email:    {email}")
    print(f"🔑  Key:      {result.get('key', 'N/A')}")
    print(f"🏆  Tier:     {result.get('tier', 'UNKNOWN').upper()}")
    print("-" * 50)
    
    print("\n📊  PRO Tier Limits (Live Check):")
    
    features_to_check = [
        ("max_daily_video", "Max Daily Video"),
        ("niches", "Niches"),
        ("monthly_api_calls", "API Calls/Month"),
        ("monthly_commands", "Commands/Month"),
        ("team_members", "Team Members"),
        ("white_label", "White Label"),
    ]
    
    for feature_key, display_name in features_to_check:
        quota = validator.check_quota(feature_key)
        limit = quota['limit']
        
        # Format limit for display
        limit_str = "Unlimited" if limit == -1 else str(limit)
        if feature_key == "white_label":
             limit_str = "✅ Yes" if quota['allowed'] else "❌ No"
             
        print(f"   • {display_name:<20}: {limit_str}")

    print("\n" + "=" * 50)
    print("📁  License saved to: ~/.mekong/license.json")
    print("🚀  Now restart Antigravity IDE to apply changes!")
    print("=" * 50 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Activate UItra (PRO) license for Mekong-CLI.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python3 scripts/activate_uitra.py user@example.com"
    )
    parser.add_argument("email", help="Email address to associate with the license")
    
    args = parser.parse_args()

    try:
        result = activate_uitra(args.email)
        display_success(args.email, result)
    except Exception as e:
        # detailed error is already logged in activate_uitra
        sys.exit(1)


if __name__ == "__main__":
    main()
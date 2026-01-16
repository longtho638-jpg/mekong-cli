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

import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path


def generate_license_key(email: str, tier: str = "pro") -> str:
    """Generate deterministic license key from email."""
    hash_input = f"{email}-{tier}-agencyos"
    hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
    return f"AGENCYOS-{tier.upper()}-{hash_suffix}"


def activate_uitra(email: str) -> dict:
    """
    Activate UItra (PRO tier) license for email.

    PRO Tier Limits:
    - 10,000 API calls/month
    - 500 commands/month
    - 5 team members
    - API access enabled
    - Priority support
    """
    license_dir = Path.home() / ".mekong"
    license_file = license_dir / "license.json"

    # Ensure directory exists
    license_dir.mkdir(parents=True, exist_ok=True)

    # Generate license key
    license_key = generate_license_key(email, "pro")

    # Create license data
    license_data = {
        "key": license_key,
        "tier": "pro",
        "email": email,
        "activated_at": datetime.now().isoformat(),
        "status": "active",
        "features": {
            "monthly_api_calls": 10000,
            "monthly_commands": 500,
            "team_members": 5,
            "api_access": True,
            "priority_support": True,
            "max_daily_video": 10,
        },
    }

    # Save to file
    with open(license_file, "w", encoding="utf-8") as f:
        json.dump(license_data, f, indent=2)

    return license_data


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 activate_uitra.py <email>")
        print("Example: python3 activate_uitra.py billwill.mentor@gmail.com")
        sys.exit(1)

    email = sys.argv[1]

    print(f"🏯 Activating UItra (PRO) license for: {email}")
    print("=" * 50)

    result = activate_uitra(email)

    print("✅ License activated!")
    print(f"   Key: {result['key']}")
    print(f"   Tier: {result['tier'].upper()}")
    print(f"   Email: {result['email']}")
    print(f"   Status: {result['status']}")
    print()
    print("📊 PRO Tier Limits:")
    print(f"   API Calls: {result['features']['monthly_api_calls']:,}/month")
    print(f"   Commands: {result['features']['monthly_commands']:,}/month")
    print(f"   Team Members: {result['features']['team_members']}")
    print(f"   API Access: {'✅' if result['features']['api_access'] else '❌'}")
    print(
        f"   Priority Support: {'✅' if result['features']['priority_support'] else '❌'}"
    )
    print()
    print("📁 License saved to: ~/.mekong/license.json")
    print()
    print("🚀 Now restart Antigravity IDE to apply changes!")


if __name__ == "__main__":
    main()

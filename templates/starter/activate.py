#!/usr/bin/env python3
"""
AgencyOS License Activation Script
===================================
Activates your AgencyOS license and unlocks all 85+ commands.

Usage:
    python activate.py YOUR-LICENSE-KEY

Example:
    python activate.py AGENCYOS-ABCD-1234-WXYZ
"""

import sys
import os
import json
from datetime import datetime

# Configuration
AGENCYOS_API = "https://agencyos.network/api"
CONFIG_DIR = ".agencyos"
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Print AgencyOS banner"""
    print(f"""
{Colors.CYAN}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏯 AgencyOS - AI-Native Agency Operating System        ║
║                                                          ║
║   Activating your license...                             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝{Colors.RESET}
    """)

def validate_license_format(license_key: str) -> bool:
    """Validate license key format: AGENCYOS-XXXX-XXXX-XXXX"""
    import re
    pattern = r'^AGENCYOS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'
    return bool(re.match(pattern, license_key.upper()))

def activate_license(license_key: str) -> dict:
    """
    Activate license with AgencyOS API
    For now, we validate locally (offline mode)
    """
    # Offline validation for demo
    # In production, this would call the API
    
    if not validate_license_format(license_key):
        return {
            "success": False,
            "error": "Invalid license key format. Expected: AGENCYOS-XXXX-XXXX-XXXX"
        }
    
    # Check for special first-100 codes (18-char format)
    if license_key.startswith("AGENCYOS-") and len(license_key) == 18:
        # Old format: AGENCYOS-XXXX-XXXX (18 chars) = 100% off
        return {
            "success": True,
            "plan": "lifetime",
            "discount": 100,
            "message": "🎉 Lifetime FREE access activated!"
        }
    
    # New format: AGENCYOS-XXXX-XXXX-XXXX (23 chars)
    return {
        "success": True,
        "plan": "pro",
        "discount": 0,
        "message": "✅ Pro license activated!"
    }

def save_config(license_key: str, activation_result: dict):
    """Save activation config to .agencyos/config.json"""
    
    # Create config directory if not exists
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    
    config = {
        "license_key": license_key,
        "plan": activation_result.get("plan", "pro"),
        "activated_at": datetime.now().isoformat(),
        "status": "active",
        "features": {
            "marketing": True,
            "sales": True,
            "finance": True,
            "operations": True,
            "strategy": True,
            "agents": True
        }
    }
    
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    
    return config

def print_success(result: dict):
    """Print success message with next steps"""
    print(f"""
{Colors.GREEN}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ✅ LICENSE ACTIVATED SUCCESSFULLY!                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BOLD}Plan:{Colors.RESET} {result.get('plan', 'pro').upper()}
{Colors.BOLD}Status:{Colors.RESET} {Colors.GREEN}Active{Colors.RESET}

{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.RESET}

{Colors.BOLD}🚀 Next Steps:{Colors.RESET}

  1. Run your first command:
     {Colors.YELLOW}/help{Colors.RESET}

  2. Try marketing automation:
     {Colors.YELLOW}/marketing-plan{Colors.RESET}

  3. Generate a proposal:
     {Colors.YELLOW}/proposal{Colors.RESET}

{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.RESET}

{Colors.BOLD}📚 Resources:{Colors.RESET}
  • Documentation: https://agencyos.network/docs
  • Commands: https://agencyos.network/commands
  • Support: support@agencyos.network

{Colors.GREEN}🏯 Welcome to AgencyOS! Time to automate your agency.{Colors.RESET}
    """)

def print_error(message: str):
    """Print error message"""
    print(f"""
{Colors.RED}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ❌ ACTIVATION FAILED                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.BOLD}Error:{Colors.RESET} {message}

{Colors.BOLD}Need help?{Colors.RESET}
  • Get a license: https://agencyos.network/pricing
  • Contact support: support@agencyos.network
    """)

def main():
    """Main activation flow"""
    print_banner()
    
    # Get license key from args or prompt
    if len(sys.argv) > 1:
        license_key = sys.argv[1].upper()
    else:
        print(f"{Colors.BOLD}Enter your license key:{Colors.RESET}")
        license_key = input("> ").strip().upper()
    
    if not license_key:
        print_error("No license key provided.")
        sys.exit(1)
    
    print(f"\n{Colors.CYAN}Validating license...{Colors.RESET}")
    
    # Activate
    result = activate_license(license_key)
    
    if result["success"]:
        # Save config
        save_config(license_key, result)
        print_success(result)
    else:
        print_error(result.get("error", "Unknown error"))
        sys.exit(1)

if __name__ == "__main__":
    main()

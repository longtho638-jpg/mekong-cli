import json
import os
import sys
import datetime

def activate_license(email):
    license_dir = os.path.expanduser("~/.mekong")
    license_file = os.path.join(license_dir, "license.json")
    
    if not os.path.exists(license_dir):
        os.makedirs(license_dir)
        
    print(f"Activating UItra (PRO) license for: {email}")
    
    # Define PRO license structure
    license_data = {
        "email": email,
        "tier": "PRO",
        "plan_name": "Antigravity Ultra",
        "limit_monthly": 10000,
        "activated_at": datetime.datetime.now().isoformat(),
        "expires_at": "2099-12-31T23:59:59", # Vĩnh cửu
        "features": [
            "antigravity_ide",
            "proxy_access",
            "agent_teams",
            "unlimited_context"
        ],
        "signature": "valid_uitra_signature_v1"
    }
    
    with open(license_file, 'w') as f:
        json.dump(license_data, f, indent=2)
        
    print("\u2705 License activated!")
    print("   Tier: PRO")
    print("   Limit: 10,000 API calls/month")
    print("\nPLEASE RESTART YOUR IDE OR TERMINAL TO APPLY CHANGES.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 activate_uitra.py <email>")
        sys.exit(1)
        
    activate_license(sys.argv[1])

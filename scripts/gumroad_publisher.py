#!/usr/bin/env python3
"""
🛒 Gumroad Publisher & Venture Asset Distributor (VentureOS)
Usage:
    python gumroad_publisher.py --setup         # First time setup
    python gumroad_publisher.py --publish       # Publish specific product
    python gumroad_publisher.py --batch         # 🚀 Auto-publish ALL products
    python gumroad_publisher.py --license <id>  # 🔑 Generate Enterprise License
    python gumroad_publisher.py --list          # List portfolio assets
"""

import json
import os
import secrets
import string
import sys
from datetime import datetime
from pathlib import Path

import requests

# Config paths
CONFIG_DIR = Path.home() / ".mekong"
CONFIG_FILE = CONFIG_DIR / "gumroad.json"
LICENSES_FILE = CONFIG_DIR / "venture_licenses.json"
VENTURE_MANIFEST = CONFIG_DIR / "venture_manifest.json"

GUMROAD_API = "https://api.gumroad.com/v2"


def get_config():
    """Load Gumroad config."""
    if not CONFIG_FILE.exists():
        return None
    with open(CONFIG_FILE) as f:
        return json.load(f)


def save_config(config):
    """Save Gumroad config."""
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    print(f"✅ Config saved to {CONFIG_FILE}")


class VentureLicenseManager:
    """Manages Enterprise Licenses for the Venture Studio."""

    def __init__(self):
        self.load_licenses()

    def load_licenses(self):
        if LICENSES_FILE.exists():
            with open(LICENSES_FILE) as f:
                self.licenses = json.load(f)
        else:
            self.licenses = {}

    def save_licenses(self):
        CONFIG_DIR.mkdir(exist_ok=True)
        with open(LICENSES_FILE, "w") as f:
            json.dump(self.licenses, f, indent=2)

    def generate_key(self, prefix="VEN"):
        """Generate a secure license key."""
        alphabet = string.ascii_uppercase + string.digits
        key = "".join(secrets.choice(alphabet) for _ in range(16))
        return f"{prefix}-{key[:4]}-{key[4:8]}-{key[8:12]}-{key[12:]}"

    def issue_license(self, product_id, client_name, tier="enterprise"):
        """Issue a new license for a client."""
        key = self.generate_key()
        license_data = {
            "key": key,
            "product_id": product_id,
            "client": client_name,
            "tier": tier,
            "issued_at": datetime.now().isoformat(),
            "status": "active",
        }
        self.licenses[key] = license_data
        self.save_licenses()
        return license_data

    def list_licenses(self):
        return self.licenses


def setup():
    """Interactive setup for Gumroad API with environment variable support."""
    print()
    print("🛒 Gumroad Publisher & VentureOS Setup")
    print("=" * 50)
    print()

    # Check for environment variable first (more secure)
    token = os.getenv("GUMROAD_ACCESS_TOKEN")

    if not token:
        print("To get your Access Token:")
        print("1. Go to: https://app.gumroad.com/settings/advanced")
        print("2. Scroll to 'Applications'")
        print("3. Click 'Create Application' or use existing")
        print("4. Copy 'Access Token'")
        print(
            "5. Set as environment variable: export GUMROAD_ACCESS_TOKEN='your_token'"
        )
        print()
        print("Or enter manually (less secure):")
        token = input("Paste your Access Token: ").strip()

    if not token:
        print("❌ Token is required. Set GUMROAD_ACCESS_TOKEN environment variable.")
        return False

    # Verify token
    print("\n🔍 Verifying token...")
    try:
        resp = requests.get(f"{GUMROAD_API}/user?access_token={token}", timeout=10)
    except requests.RequestException as e:
        print(f"❌ Network error: {e}")
        return False

    if resp.status_code != 200:
        print(f"❌ Invalid token: {resp.text}")
        return False

    user = resp.json().get("user", {})
    email = user.get("email", "Unknown")
    name = user.get("name", "Unknown")

    print(f"✅ Authenticated as: {name} ({email})")

    # Save config (for backward compatibility)
    config = {"access_token": token, "email": email, "name": name}
    save_config(config)
    return True


def enable_product(product_id: str):
    """Enable/publish a product on Gumroad."""
    token = os.getenv("GUMROAD_ACCESS_TOKEN") or get_config().get("access_token")
    if not token:
        return False

    print(f"\n🚀 Publishing product: {product_id}")
    resp = requests.put(
        f"{GUMROAD_API}/products/{product_id}/enable", data={"access_token": token}
    )

    if resp.status_code == 200 and resp.json().get("success"):
        product = resp.json().get("product", {})
        print("✅ Product published!")
        print(f"   URL: {product.get('short_url')}")
        return True
    else:
        print(f"❌ Failed to publish: {resp.text}")
        return False


def publish_product(
    name: str,
    description: str,
    price: int,  # in cents
    file_path: str,
    preview_url: str = None,
    is_private: bool = False,
):
    """Publish a product to Gumroad."""
    token = os.getenv("GUMROAD_ACCESS_TOKEN") or get_config().get("access_token")
    if not token:
        return None

    # Create product
    print(f"\n📦 Creating Venture Asset: {name} {'(Private)' if is_private else ''}")

    data = {
        "name": name,
        "description": description,
        "price": price,
        "currency": "usd",
    }

    if preview_url:
        data["preview_url"] = preview_url

    data["access_token"] = token

    # Note: Gumroad API doesn't have a simple 'private' flag on create,
    # but we handle visibility by not sharing the link publically
    # and potentially unlisting it in a future update.

    resp = requests.post(f"{GUMROAD_API}/products", data=data)

    if resp.status_code != 200:
        print(f"❌ Failed to create product: {resp.text}")
        return None

    product = resp.json().get("product", {})
    product_id = product.get("id")
    short_url = product.get("short_url")

    print(f"✅ Asset created: {short_url}")

    # Upload file
    if os.path.exists(file_path):
        print(f"📤 Uploading payload: {file_path}")
        with open(file_path, "rb") as f:
            files = {"file": f}
            resp = requests.post(
                f"{GUMROAD_API}/products/{product_id}/files",
                data={"access_token": token},
                files=files,
            )
            if resp.status_code == 200:
                print("✅ Payload uploaded!")
            else:
                print(f"⚠️ payload upload failed: {resp.text}")

    return {"id": product_id, "url": short_url, "name": name, "price": price / 100}


def batch_publish_all(products_dir: str = "products"):
    """🚀 Auto-publish ALL products from products/ folder."""
    from pathlib import Path

    products_path = Path(products_dir)
    if not products_path.exists():
        print(f"❌ Products folder not found: {products_path}")
        return []

    token = os.getenv("GUMROAD_ACCESS_TOKEN") or get_config().get("access_token")
    if not token:
        return []

    # Get existing products
    resp = requests.get(f"{GUMROAD_API}/products?access_token={token}")
    existing = {}
    if resp.status_code == 200:
        for p in resp.json().get("products", []):
            existing[p["name"].lower()] = p

    # Venture Studio Catalog
    CATALOG = {
        "agencyos-core": {
            "name": "AgencyOS Core (Venture License)",
            "price": 250000,  # $2,500
            "desc": "Full Venture Operating System Source Code. Enterprise License.",
            "private": True,
        },
        "agencyos-enterprise": {
            "name": "AgencyOS Enterprise",
            "price": 49700,
            "desc": "Enterprise agency management suite",
            "private": False,
        },
        "agencyos-pro": {
            "name": "AgencyOS Pro Bundle",
            "price": 19700,
            "desc": "Complete AgencyOS professional bundle",
            "private": False,
        },
        "vietnamese-agency-kit": {
            "name": "Vietnamese Agency Kit",
            "price": 6700,
            "desc": "Complete agency toolkit for Vietnam market",
            "private": False,
        },
    }

    # Add standard retail items
    RETAIL_CATALOG = {
        "vscode-starter-pack": {
            "name": "VSCode Starter Pack",
            "price": 0,
            "desc": "FREE - Optimized settings",
        },
        "admin-dashboard-lite": {
            "name": "Admin Dashboard Lite",
            "price": 4700,
            "desc": "Premium admin dashboard template",
        },
        "auth-starter-supabase": {
            "name": "Auth Starter Supabase",
            "price": 2700,
            "desc": "Authentication starter",
        },
        "landing-page-kit": {
            "name": "Landing Page Kit",
            "price": 3700,
            "desc": "Landing page templates",
        },
        "api-boilerplate-fastapi": {
            "name": "FastAPI Starter",
            "price": 3700,
            "desc": "FastAPI boilerplate",
        },
        "ai-skills-pack": {
            "name": "AI Skills Pack",
            "price": 2700,
            "desc": "AI development skills",
        },
    }
    CATALOG.update(RETAIL_CATALOG)

    published = []
    skipped = []

    print("\n" + "=" * 60)
    print("🚀 VENTURE ASSET DISTRIBUTOR - Auto-push")
    print("=" * 60)

    zip_files = list(products_path.glob("*.zip"))
    print(f"\n📦 Found {len(zip_files)} asset archives\n")

    for zip_file in sorted(zip_files):
        product_key = (
            zip_file.stem.replace("-v1.0.0", "").replace("-v1.0", "").replace("-v1", "")
        )

        catalog_item = CATALOG.get(product_key)
        if not catalog_item:
            print(f"⚠️ Skip (not in catalog): {zip_file.name}")
            skipped.append(str(zip_file.name))
            continue

        product_name = catalog_item["name"]
        is_private = catalog_item.get("private", False)

        if product_name.lower() in existing:
            print(f"✅ Asset synced: {product_name}")
            published.append(existing[product_name.lower()].get("short_url", ""))
            continue

        result = publish_product(
            name=product_name,
            description=catalog_item["desc"],
            price=catalog_item["price"],
            file_path=str(zip_file),
            is_private=is_private,
        )

        if result:
            published.append(result.get("url", ""))
        else:
            print("   ❌ Failed to distribute")

    print("\n" + "=" * 60)
    print(f"✅ Distributed: {len(published)}")
    print(f"⚠️ Skipped: {len(skipped)}")
    print("=" * 60 + "\n")

    return published


def list_products():
    """List all assets."""
    token = os.getenv("GUMROAD_ACCESS_TOKEN") or get_config().get("access_token")
    if not token:
        return

    resp = requests.get(f"{GUMROAD_API}/products?access_token={token}")
    if resp.status_code != 200:
        print(f"❌ Failed: {resp.text}")
        return

    products = resp.json().get("products", [])
    print(f"\n📦 Venture Portfolio Assets ({len(products)}):")
    print("-" * 50)
    for p in products:
        print(f"  {p['name']} (ID: {p['id']})")
        print(f"    Price: ${p['price'] / 100}")
        print(f"    URL: {p['short_url']}")
        print(f"    Sales: {p.get('sales_count', 0)}")
        print()


def generate_license_command():
    """CLI handler for license generation."""
    if len(sys.argv) < 3:
        print("Usage: python gumroad_publisher.py --license <product_id> <client_name>")
        return

    product_id = sys.argv[2]
    client_name = sys.argv[3] if len(sys.argv) > 3 else "Unknown Client"

    mgr = VentureLicenseManager()
    license_data = mgr.issue_license(product_id, client_name)

    print("\n🔑 Enterprise License Generated")
    print("=" * 40)
    print(f"Client: {license_data['client']}")
    print(f"Key:    {license_data['key']}")
    print(f"Issued: {license_data['issued_at']}")
    print("=" * 40)
    print("⚠️  Save this key securely. It authorizes access to the VentureOS.")


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python gumroad_publisher.py --setup")
        print("  python gumroad_publisher.py --batch    # 🚀 Publish All Assets")
        print(
            "  python gumroad_publisher.py --license <prod_id> <client> # 🔑 Issue Key"
        )
        print("  python gumroad_publisher.py --list     # 📋 List Assets")
        return

    cmd = sys.argv[1]

    if cmd == "--setup":
        setup()
    elif cmd == "--batch":
        batch_publish_all()
    elif cmd == "--license":
        generate_license_command()
    elif cmd == "--list":
        list_products()
    elif cmd == "--enable" and len(sys.argv) > 2:
        enable_product(sys.argv[2])
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()

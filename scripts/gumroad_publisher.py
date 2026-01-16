#!/usr/bin/env python3
"""
🛒 Gumroad Publisher - Auto-push products from Antigravity
Usage: python gumroad_publisher.py --setup   # First time setup
       python gumroad_publisher.py --publish  # Publish product
"""

import json
import os
import sys
from pathlib import Path

import requests

# Config paths
CONFIG_DIR = Path.home() / ".mekong"
CONFIG_FILE = CONFIG_DIR / "gumroad.json"

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


def setup():
    """Interactive setup for Gumroad API."""
    print()
    print("🛒 Gumroad Publisher Setup")
    print("=" * 50)
    print()
    print("To get your Access Token:")
    print("1. Go to: https://app.gumroad.com/settings/advanced")
    print("2. Scroll to 'Applications'")
    print("3. Click 'Create Application' or use existing")
    print("4. Copy the 'Access Token'")
    print()

    token = input("Paste your Access Token: ").strip()

    if not token:
        print("❌ Token is required")
        return False

    # Verify token
    print("\n🔍 Verifying token...")
    resp = requests.get(f"{GUMROAD_API}/user?access_token={token}")

    if resp.status_code != 200:
        print(f"❌ Invalid token: {resp.text}")
        return False

    user = resp.json().get("user", {})
    email = user.get("email", "Unknown")
    name = user.get("name", "Unknown")

    print(f"✅ Authenticated as: {name} ({email})")

    config = {"access_token": token, "email": email, "name": name}
    save_config(config)
    return True


def enable_product(product_id: str):
    """Enable/publish a product on Gumroad."""
    config = get_config()
    if not config:
        print("❌ Not configured. Run: python gumroad_publisher.py --setup")
        return False

    token = config["access_token"]

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
    price: int,  # in cents (e.g., 4700 = $47)
    file_path: str,
    preview_url: str = None,
):
    """Publish a product to Gumroad."""
    config = get_config()
    if not config:
        print("❌ Not configured. Run: python gumroad_publisher.py --setup")
        return None

    token = config["access_token"]

    # Create product
    print(f"\n📦 Creating product: {name}")

    data = {
        "name": name,
        "description": description,
        "price": price,
        "currency": "usd",
    }

    if preview_url:
        data["preview_url"] = preview_url

    data["access_token"] = token

    resp = requests.post(f"{GUMROAD_API}/products", data=data)

    if resp.status_code != 200:
        print(f"❌ Failed to create product: {resp.text}")
        return None

    product = resp.json().get("product", {})
    product_id = product.get("id")
    short_url = product.get("short_url")

    print(f"✅ Product created: {short_url}")

    # Upload file
    if os.path.exists(file_path):
        print(f"📤 Uploading file: {file_path}")
        with open(file_path, "rb") as f:
            files = {"file": f}
            resp = requests.post(
                f"{GUMROAD_API}/products/{product_id}/files",
                data={"access_token": token},
                files=files,
            )
            if resp.status_code == 200:
                print("✅ File uploaded!")
            else:
                print(f"⚠️ File upload failed: {resp.text}")

    return {"id": product_id, "url": short_url, "name": name, "price": price / 100}


def publish_vibe_starter():
    """Publish the Vibe Starter Template."""
    zip_path = Path.home() / "Desktop" / "vibe-starter-template-v1.0.0.zip"

    if not zip_path.exists():
        print(f"❌ ZIP not found: {zip_path}")
        return

    description = """🎯 Perfect for:
- Agency owners building client dashboards
- Startups needing admin panels fast
- Developers who value clean code

✨ What's Inside:
- Next.js 16 with App Router
- TypeScript for type safety
- Tailwind CSS 4 with design tokens
- i18n Ready (Vietnamese + English)
- 15+ Premium Components
- Supabase Integration
- Dark/Light Themes
- Responsive Design

🚀 Get Started in 3 Commands:
npm install
cp .env.example .env.local
npm run dev

💰 Why $47?
- Save 40+ hours of development time
- Production-ready code quality
- Lifetime updates included
- Commercial license for 1 project"""

    result = publish_product(
        name="Vibe Starter Template - Premium Next.js Dashboard",
        description=description,
        price=4700,  # $47.00
        file_path=str(zip_path),
    )

    if result:
        print()
        print("🎉 SUCCESS!")
        print("=" * 50)
        print(f"Product URL: {result['url']}")
        print(f"Price: ${result['price']}")
        print()
        print("Next steps:")
        print("1. Go to Gumroad dashboard to review")
        print("2. Add thumbnail image")
        print("3. Publish!")

        return result
    return None


def list_products():
    """List all products."""
    config = get_config()
    if not config:
        print("❌ Not configured. Run: python gumroad_publisher.py --setup")
        return

    token = config["access_token"]
    resp = requests.get(f"{GUMROAD_API}/products?access_token={token}")

    if resp.status_code != 200:
        print(f"❌ Failed: {resp.text}")
        return

    products = resp.json().get("products", [])
    print(f"\n📦 Your Products ({len(products)}):")
    print("-" * 50)
    for p in products:
        print(f"  {p['name']}")
        print(f"    Price: ${p['price'] / 100}")
        print(f"    URL: {p['short_url']}")
        print(f"    Sales: {p.get('sales_count', 0)}")
        print()


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python gumroad_publisher.py --setup    # Configure API")
        print("  python gumroad_publisher.py --publish  # Publish Vibe Starter")
        print("  python gumroad_publisher.py --list     # List products")
        return

    cmd = sys.argv[1]

    if cmd == "--setup":
        setup()
    elif cmd == "--publish":
        publish_vibe_starter()
    elif cmd == "--list":
        list_products()
    elif cmd == "--enable" and len(sys.argv) > 2:
        enable_product(sys.argv[2])
    else:
        print(f"Unknown command: {cmd}")
        print("  --enable <product_id>  # Enable/publish a product")


if __name__ == "__main__":
    main()

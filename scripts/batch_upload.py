#!/usr/bin/env python3
"""
🚀 Batch Product Uploader - Push ALL products to Gumroad
"""

import os
from pathlib import Path

import requests

# Load token from .env
env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

TOKEN = os.environ.get("GUMROAD_ACCESS_TOKEN")
GUMROAD_API = "https://api.gumroad.com/v2"

# Products to create
PRODUCTS = [
    {
        "name": "AI Skills Pack - Antigravity Skills",
        "price": 2700,  # $27
        "description": """🤖 AI Skills for Antigravity IDE

✨ What's Inside:
- 9 Professional AI Skills
- Gemini, OpenAI, Vector DB integrations
- Backend & Frontend automation
- Full documentation

💡 Perfect For:
- Antigravity IDE users
- AI-powered development
- Agentic workflows

🚀 Install: Copy to .agent/skills/""",
        "zip": "products/ai-skills-pack-v1.0.0.zip",
    },
    {
        "name": "AgencyOS Pro - Full Business Suite",
        "price": 19700,  # $197
        "description": """🏯 AgencyOS Pro - Complete Agency Platform

✨ Everything You Need:
- CRM + Invoicing
- Project Management
- Client Portal
- Analytics Dashboard
- 40+ Workflows
- Vietnamese Localization

💰 Revenue Features:
- Subscription Management
- Braintree Integration
- Revenue Tracking

🎯 Perfect For:
- Digital Agencies
- Consulting Firms
- Freelance Teams

⚡ Production-Ready: Deploy in 1 hour""",
        "zip": "products/agencyos-pro-v1.0.0.zip",
    },
    {
        "name": "AgencyOS Enterprise - Multi-Tenant",
        "price": 49700,  # $497
        "description": """🏛️ AgencyOS Enterprise - White-Label Platform

✨ Enterprise Features:
- Multi-tenant Architecture
- White-label Ready
- Custom Branding
- SSO/SAML Support
- Priority Support
- Source Code Access

📊 Scale Ready:
- 100+ Team Members
- Unlimited Clients
- Custom Integrations

🔒 Security:
- SOC2 Compliance Ready
- Data Encryption
- Audit Logs""",
        "zip": "products/agencyos-enterprise-v1.0.0.zip",
    },
    {
        "name": "Vietnamese Agency Kit - Niche Presets",
        "price": 6700,  # $67
        "description": """🇻🇳 Vietnamese Agency Kit

✨ Local Market Presets:
- 10 Industry Niches
- Vietnamese Language Pack
- Regional Compliance
- Local Payment Gateways

🌾 Niches Included:
- Lúa Gạo (Rice Trading)
- Cá Tra (Seafood)
- Nội Thất (Furniture)
- Bất Động Sản (Real Estate)
- Nhà Hàng (Restaurants)
- Spa/Beauty
- Automotive
- Education
- Construction
- Agriculture

🎯 Perfect For:
- Vietnam-focused agencies
- Local market entry
- Regional customization""",
        "zip": "products/vietnamese-agency-kit-v1.0.0.zip",
    },
]


def create_product(product):
    """Create and upload product to Gumroad."""
    print(f"\n📦 Creating: {product['name']}")

    # Create product
    data = {
        "name": product["name"],
        "description": product["description"],
        "price": product["price"],
        "currency": "usd",
        "access_token": TOKEN,
    }

    resp = requests.post(f"{GUMROAD_API}/products", data=data)

    if resp.status_code != 200:
        print(f"❌ Failed: {resp.text}")
        return None

    result = resp.json()
    if not result.get("success"):
        print(f"❌ Error: {result}")
        return None

    prod = result.get("product", {})
    product_id = prod.get("id")
    short_url = prod.get("short_url")

    print(f"✅ Created! URL: {short_url}")

    # Upload ZIP file
    zip_path = Path(product["zip"])
    if zip_path.exists():
        print(
            f"📤 Uploading: {zip_path.name} ({zip_path.stat().st_size / 1024:.0f} KB)"
        )
        with open(zip_path, "rb") as f:
            files = {"file": f}
            resp = requests.post(
                f"{GUMROAD_API}/products/{product_id}/files",
                data={"access_token": TOKEN},
                files=files,
            )
            if resp.status_code == 200:
                print("✅ File uploaded!")
            else:
                print(f"⚠️ Upload failed: {resp.text}")
    else:
        print(f"⚠️ ZIP not found: {zip_path}")

    # Enable/publish product
    resp = requests.put(
        f"{GUMROAD_API}/products/{product_id}/enable", data={"access_token": TOKEN}
    )
    if resp.status_code == 200:
        print("🚀 Product PUBLISHED!")

    return {"id": product_id, "url": short_url, "price": product["price"] / 100}


def main():
    if not TOKEN:
        print("❌ GUMROAD_ACCESS_TOKEN not set")
        return

    print("\n🚀 BATCH PRODUCT UPLOADER")
    print("=" * 60)

    results = []
    for product in PRODUCTS:
        result = create_product(product)
        if result:
            results.append(result)

    print("\n" + "=" * 60)
    print(f"✅ DONE! Created {len(results)} products")
    print("=" * 60)

    for r in results:
        print(f"  ${r['price']:<6} {r['url']}")

    total = sum(r["price"] for r in results)
    print(f"\n💰 Total Value Added: ${total}")


if __name__ == "__main__":
    main()

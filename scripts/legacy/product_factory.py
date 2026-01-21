#!/usr/bin/env python3
"""
📦 PRODUCT FACTORY - Auto-Package Sellable Assets
==================================================
Scan codebase, create product ZIPs, and add to catalog automatically.

Usage:
    python3 scripts/product_factory.py scan      # Scan for sellable assets
    python3 scripts/product_factory.py build     # Build all products
    python3 scripts/product_factory.py publish   # Publish to Gumroad
"""

import sys
import zipfile
from datetime import datetime
from pathlib import Path

# Paths
SCRIPTS_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPTS_DIR.parent
PRODUCTS_DIR = PROJECT_DIR / "products"
TEMPLATES_DIR = (
    PROJECT_DIR / "templates"
    if (PROJECT_DIR / "templates").exists()
    else PROJECT_DIR / "apps"
)

# Product Definitions - Sellable assets in the codebase
PRODUCT_SPECS = {
    "vscode-starter": {
        "name": "VSCode Starter Pack",
        "price": 0,  # FREE lead magnet
        "source": [".vscode", "CLAUDE.md"],
        "description": "Professional VSCode configuration for AI-assisted development",
    },
    "auth-starter": {
        "name": "Auth Starter (Supabase)",
        "price": 2700,  # $27
        "source": ["apps/auth-starter"]
        if Path("apps/auth-starter").exists()
        else ["antigravity/mcp_servers/security_server"],
        "description": "Production-ready authentication with Supabase",
    },
    "ai-skills-pack": {
        "name": "AI Skills Pack",
        "price": 2700,  # $27
        "source": [".agent/skills"],
        "description": "10+ AI agent skills for multimodal development",
    },
    "agency-workflows": {
        "name": "Agency Automation Workflows",
        "price": 4700,  # $47
        "source": [".agent/workflows"],
        "description": "Complete workflow automation for digital agencies",
    },
    "payment-scripts": {
        "name": "Payment Integration Scripts",
        "price": 9700,  # $97
        "source": [
            "scripts/payment_hub.py",
            "scripts/gumroad_publisher.py",
            "scripts/invoice_generator.py",
        ],
        "description": "Multi-platform payment automation (PayPal + Gumroad)",
    },
    "agencyos-core": {
        "name": "AgencyOS Core License",
        "price": 250000,  # $2,500 - Enterprise
        "source": ["antigravity", "scripts", ".agent"],
        "description": "Complete Venture Operating System source code",
        "private": True,
    },
    # NEW PRODUCTS - Phase 4 Expansion
    "crm-starter": {
        "name": "CRM Starter Kit",
        "price": 4700,  # $47
        "source": [
            "backend/api/routers/crm.py",
            "scripts/outreach_cli.py",
            "scripts/proposal_generator.py",
        ],
        "description": "Lightweight CRM with lead pipeline and outreach automation",
    },
    "quota-engine": {
        "name": "AI Quota Monitor",
        "price": 2700,  # $27
        "source": ["antigravity/mcp_servers/quota_server/engine.py"],
        "description": "Real-time AI model quota monitoring with alerts",
    },
    "report-generator": {
        "name": "Client Report Generator",
        "price": 3700,  # $37
        "source": ["scripts/weekly_report.py", "scripts/empire_watcher.py"],
        "description": "Automated weekly client reports with health scoring",
    },
    "seo-writer": {
        "name": "SEO Blog Writer",
        "price": 4700,  # $47
        "source": ["scripts/seo_writer.py"],
        "description": "AI-powered SEO blog content generator with templates",
    },
    "contract-generator": {
        "name": "Contract Generator Pro",
        "price": 3700,  # $37
        "source": ["scripts/contract_generator.py", "scripts/invoice_generator.py"],
        "description": "Professional service contracts with auto-population",
    },
}


def ensure_products_dir():
    PRODUCTS_DIR.mkdir(exist_ok=True)


def cmd_scan():
    """Scan codebase for sellable assets."""
    print("\n🔍 SCANNING FOR SELLABLE ASSETS")
    print("=" * 50)

    found = []
    missing = []

    for key, spec in PRODUCT_SPECS.items():
        sources_exist = []
        for src in spec["source"]:
            src_path = PROJECT_DIR / src
            if src_path.exists():
                sources_exist.append(src)

        if sources_exist:
            found.append((key, spec, sources_exist))
            print(f"  ✅ {spec['name']}")
            for src in sources_exist:
                print(f"     └─ {src}")
        else:
            missing.append((key, spec))
            print(f"  ❌ {spec['name']} (sources not found)")

    print(f"\n📊 Summary: {len(found)} available, {len(missing)} missing")

    # Calculate potential revenue
    total_value = sum(spec["price"] for _, spec, _ in found) / 100
    print(f"💰 Potential Catalog Value: ${total_value:,.0f}")


def cmd_build(product_key=None):
    """Build product ZIP archives."""
    print("\n📦 BUILDING PRODUCTS")
    print("=" * 50)

    ensure_products_dir()

    products_to_build = (
        PRODUCT_SPECS.items()
        if not product_key
        else [(product_key, PRODUCT_SPECS.get(product_key))]
    )

    built = 0
    for key, spec in products_to_build:
        if not spec:
            print(f"  ❌ Unknown product: {key}")
            continue

        # Check sources exist
        sources = []
        for src in spec["source"]:
            src_path = PROJECT_DIR / src
            if src_path.exists():
                sources.append(src_path)

        if not sources:
            print(f"  ⏭️  {spec['name']} - no sources found, skipping")
            continue

        # Create ZIP
        version = datetime.now().strftime("%Y%m%d")
        zip_name = f"{key}-v{version}.zip"
        zip_path = PRODUCTS_DIR / zip_name

        print(f"  📦 Building: {spec['name']}")

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for src_path in sources:
                if src_path.is_file():
                    arcname = src_path.name
                    zf.write(src_path, arcname)
                else:
                    for file in src_path.rglob("*"):
                        if file.is_file() and not any(
                            p in str(file)
                            for p in ["__pycache__", ".git", "node_modules", ".env"]
                        ):
                            arcname = str(file.relative_to(src_path.parent))
                            zf.write(file, arcname)

            # Add README
            readme = f"""# {spec["name"]}

{spec["description"]}

## Contents
{chr(10).join("- " + src for src in spec["source"])}

## Installation
1. Extract this archive
2. Follow the included documentation

---
Built with 🏯 AgencyOS
Version: {version}
"""
            zf.writestr("README.md", readme)

        size_mb = zip_path.stat().st_size / (1024 * 1024)
        print(f"     ✅ Created: {zip_name} ({size_mb:.2f} MB)")
        built += 1

    print(f"\n📊 Built {built} products to: {PRODUCTS_DIR}")


def cmd_publish():
    """Publish products to Gumroad."""
    print("\n🚀 PUBLISHING TO GUMROAD")
    print("=" * 50)

    # List available ZIPs
    if not PRODUCTS_DIR.exists():
        print("  ❌ No products built yet. Run: product_factory.py build")
        return

    zips = list(PRODUCTS_DIR.glob("*.zip"))
    if not zips:
        print("  ❌ No product archives found")
        return

    print(f"  📦 Found {len(zips)} products ready to publish")
    print("\n  To publish, run:")
    print("    python3 scripts/gumroad_publisher.py --batch")

    # Show catalog
    print("\n  📋 Product Catalog:")
    for key, spec in PRODUCT_SPECS.items():
        price = spec["price"] / 100 if spec["price"] > 0 else "FREE"
        private = " (PRIVATE)" if spec.get("private") else ""
        print(f"    • {spec['name']}: ${price}{private}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nCommands:")
        print("  scan    - Scan codebase for sellable assets")
        print("  build   - Build all product ZIPs")
        print("  publish - Show publish instructions")
        return

    cmd = sys.argv[1].lower()

    if cmd == "scan":
        cmd_scan()
    elif cmd == "build":
        product = sys.argv[2] if len(sys.argv) > 2 else None
        cmd_build(product)
    elif cmd == "publish":
        cmd_publish()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()

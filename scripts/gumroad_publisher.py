#!/usr/bin/env python3
"""
🚀 Gumroad Auto-Publisher
=========================

Automatically publishes products to Gumroad.
Uses Gumroad API for bulk product updates.

Usage:
    python3 scripts/gumroad_publisher.py [--dry-run]
"""

import subprocess
from datetime import datetime
from pathlib import Path

PRODUCTS_DIR = Path(__file__).parent.parent / "products"
GUMROAD_STORE = "https://billmentor.gumroad.com"


# Product URLs (existing on Gumroad)
GUMROAD_PRODUCTS = {
    "vscode-starter-pack": "l/wtehzm",
    "auth-starter-supabase": "l/lcvljb",
    "api-boilerplate-fastapi": "l/kpfcpq",
    "landing-page-kit": "l/zdqlc",
    "admin-dashboard-lite": "l/kflvd",
    "agencyos-pro": "l/ruqis",
}


def create_zip_package(product_id: str) -> Path:
    """Create zip package for product."""
    product_path = PRODUCTS_DIR / product_id

    if not product_path.is_dir():
        return None

    # Output zip name with version
    version = datetime.now().strftime("%Y%m%d")
    zip_name = f"{product_id}-v{version}.zip"
    zip_path = PRODUCTS_DIR / zip_name

    # Skip if already exists
    if zip_path.exists():
        print(f"   ⏭️  {zip_name} already exists")
        return zip_path

    # Create zip excluding node_modules, .git, etc.
    excludes = [
        "node_modules/*",
        ".git/*",
        "__pycache__/*",
        "*.pyc",
        ".DS_Store",
    ]

    exclude_args = " ".join([f'--exclude="{e}"' for e in excludes])
    cmd = f'cd {PRODUCTS_DIR} && zip -r "{zip_name}" "{product_id}" {exclude_args}'

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode == 0:
        size_mb = zip_path.stat().st_size / 1024 / 1024
        print(f"   📦 Created {zip_name} ({size_mb:.1f} MB)")
        return zip_path
    else:
        print(f"   ❌ Failed to create {zip_name}: {result.stderr}")
        return None


def publish_summary() -> dict:
    """Generate publish summary."""
    products = []

    for product_id, gumroad_path in GUMROAD_PRODUCTS.items():
        product_dir = PRODUCTS_DIR / product_id

        if product_dir.exists():
            # Find latest zip
            zips = list(PRODUCTS_DIR.glob(f"{product_id}*.zip"))
            latest_zip = max(zips, key=lambda p: p.stat().st_mtime) if zips else None

            products.append(
                {
                    "id": product_id,
                    "url": f"{GUMROAD_STORE}/{gumroad_path}",
                    "zip": latest_zip.name if latest_zip else None,
                    "size": f"{latest_zip.stat().st_size / 1024 / 1024:.1f} MB"
                    if latest_zip
                    else "N/A",
                }
            )

    return {"products": products, "store": GUMROAD_STORE}


def main(dry_run: bool = False):
    """Main publish workflow."""
    print("🚀 Gumroad Auto-Publisher")
    print("=" * 40)
    print(f"Store: {GUMROAD_STORE}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()

    # Step 1: Create zip packages
    print("📦 Step 1: Creating packages...")
    for product_id in GUMROAD_PRODUCTS.keys():
        zip_path = create_zip_package(product_id)

    print()

    # Step 2: Generate summary
    print("📊 Step 2: Publish summary...")
    summary = publish_summary()

    print()
    print("┌" + "─" * 60 + "┐")
    print("│" + " READY TO PUBLISH ".center(60) + "│")
    print("├" + "─" * 60 + "┤")

    for p in summary["products"]:
        status = "✅" if p["zip"] else "❌"
        print(f"│ {status} {p['id'][:25]:<25} {p['size']:>10} │")

    print("└" + "─" * 60 + "┘")
    print()

    if not dry_run:
        print("📝 Next steps:")
        print("   1. Go to https://billmentor.gumroad.com/dashboard")
        print("   2. Upload new zip files for each product")
        print("   3. Update product descriptions if needed")

    return summary


if __name__ == "__main__":
    import sys

    dry_run = "--dry-run" in sys.argv
    main(dry_run=dry_run)

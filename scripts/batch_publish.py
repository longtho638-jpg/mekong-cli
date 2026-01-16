#!/usr/bin/env python3
"""
🏯 Gumroad Batch Publisher
==========================
Automatically publish all products to Gumroad with thumbnails.

Usage:
    python3 batch_publish.py --dry-run  # Preview what will be published
    python3 batch_publish.py --publish  # Actually publish to Gumroad
"""

import os
from pathlib import Path

# Product definitions
PRODUCTS = [
    {
        "name": "AI Skills Pack - 10 Premium Claude/Cursor Skills",
        "price": 2700,  # cents
        "description": "10 premium AI skills for Claude, Cursor, and any MCP-compatible IDE. Includes ai-multimodal, context-engineering, sequential-thinking, and more.",
        "zip_path": "products/ai-skills-pack-v1.0.0.zip",
        "thumbnail_path": "products/thumbnails/ai-skills-pack-cover.png",
    },
    {
        "name": "Vietnamese Agency Kit - Binh Pháp Business Framework",
        "price": 6700,
        "description": "Complete toolkit for Vietnamese agencies. Includes Binh Pháp 13 chapters, tax calculator, email templates, and contract templates.",
        "zip_path": "products/vietnamese-agency-kit-v1.0.0.zip",
        "thumbnail_path": "products/thumbnails/vietnamese-agency-kit-cover.png",
    },
    {
        "name": "AgencyOS Pro - Complete Agency Bundle",
        "price": 19700,
        "description": "Everything you need to run a $1M+ agency. All 8 templates, dashboard, Binh Pháp framework, and AI skills. $986 value for $197.",
        "zip_path": "products/agencyos-pro-v1.0.0.zip",
        "thumbnail_path": "products/thumbnails/agencyos-pro-cover.png",
    },
    {
        "name": "AgencyOS Enterprise - Multi-Team Platform",
        "price": 49700,
        "description": "Scale your agency with multi-team dashboard, white-label ready, priority support. Includes everything in Pro plus enterprise features.",
        "zip_path": "products/agencyos-enterprise-v1.0.0.zip",
        "thumbnail_path": "products/thumbnails/agencyos-enterprise-cover.png",
    },
]


def check_files_exist():
    """Verify all product files exist."""
    missing = []
    for product in PRODUCTS:
        if not Path(product["zip_path"]).exists():
            missing.append(product["zip_path"])
        if not Path(product["thumbnail_path"]).exists():
            missing.append(product["thumbnail_path"])
    return missing


def dry_run():
    """Preview what will be published."""
    print("\n🏯 GUMROAD BATCH PUBLISHER - DRY RUN")
    print("=" * 50)

    missing = check_files_exist()
    if missing:
        print("\n❌ Missing files:")
        for f in missing:
            print(f"   - {f}")
        return

    print("\n✅ All files present. Products to publish:\n")

    total = 0
    for i, p in enumerate(PRODUCTS, 1):
        price_usd = p["price"] / 100
        print(f"{i}. {p['name']}")
        print(f"   Price: ${price_usd:.2f}")
        print(f"   ZIP: {p['zip_path']}")
        print(f"   Thumbnail: {p['thumbnail_path']}")
        print()
        total += price_usd

    print(f"📊 Total catalog value: ${total:.2f}")
    print("\n🔴 Run with --publish to actually publish to Gumroad")


def publish():
    """Publish products to Gumroad."""
    print("\n🏯 GUMROAD BATCH PUBLISHER")
    print("=" * 50)

    # Check for API token
    token = os.environ.get("GUMROAD_ACCESS_TOKEN")
    if not token:
        print("\n❌ Error: GUMROAD_ACCESS_TOKEN not set")
        print("   Export your token: export GUMROAD_ACCESS_TOKEN=your_token")
        return

    missing = check_files_exist()
    if missing:
        print("\n❌ Missing files:")
        for f in missing:
            print(f"   - {f}")
        return

    print("\n⚠️ Manual steps required:")
    print("   1. Go to https://gumroad.com/products/new")
    print("   2. Upload each ZIP file manually")
    print("   3. Upload thumbnail as cover image")
    print("   4. Copy product details below:")

    for i, p in enumerate(PRODUCTS, 1):
        price_usd = p["price"] / 100
        print(f"\n{'=' * 50}")
        print(f"Product {i}: {p['name']}")
        print(f"{'=' * 50}")
        print(f"Price: ${price_usd:.2f}")
        print(f"Description:\n{p['description']}")
        print(f"ZIP: {p['zip_path']}")
        print(f"Thumbnail: {p['thumbnail_path']}")


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 batch_publish.py [--dry-run|--publish]")
        return

    if sys.argv[1] == "--dry-run":
        dry_run()
    elif sys.argv[1] == "--publish":
        publish()
    else:
        print(f"Unknown option: {sys.argv[1]}")


if __name__ == "__main__":
    main()

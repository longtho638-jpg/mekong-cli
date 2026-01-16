#!/usr/bin/env python3
"""
📊 Product Stats Reporter
=========================
Generate summary statistics for all products.

Usage:
    python3 product_stats.py
"""

from datetime import datetime
from pathlib import Path

PRODUCTS_DIR = Path("products")


def format_size(size_bytes):
    """Format bytes to human readable."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def get_zip_files():
    """Get all ZIP files in products directory."""
    return list(PRODUCTS_DIR.glob("*.zip"))


def get_readme_files():
    """Get all README files in product subdirectories."""
    return list(PRODUCTS_DIR.glob("*/README.md"))


def main():
    print("\n📊 PRODUCT STATS REPORT")
    print("=" * 50)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    # ZIP files
    zips = get_zip_files()
    total_size = 0

    print("\n📦 ZIP FILES:")
    for z in sorted(zips):
        size = z.stat().st_size
        total_size += size
        print(f"   {z.name:<40} {format_size(size):>10}")

    print(f"\n   {'TOTAL':<40} {format_size(total_size):>10}")
    print(f"   Count: {len(zips)} files")

    # Products
    readmes = get_readme_files()
    print(f"\n📁 PRODUCT DIRECTORIES: {len(readmes)}")

    # Thumbnails
    thumbnails = list(PRODUCTS_DIR.glob("thumbnails/*.png"))
    print(f"\n🖼️ THUMBNAILS: {len(thumbnails)}")

    # Pricing estimate
    prices = {
        "ai-skills-pack": 27,
        "vietnamese-agency-kit": 67,
        "agencyos-pro": 197,
        "agencyos-enterprise": 497,
        "admin-dashboard-lite": 47,
        "api-boilerplate-fastapi": 37,
        "auth-starter-supabase": 27,
        "landing-page-kit": 37,
        "vibe-starter-template": 47,
        "vscode-starter-pack": 0,
    }

    total_value = sum(prices.values())
    print(f"\n💰 CATALOG VALUE: ${total_value}")

    print("\n" + "=" * 50)
    print("🏯 Binh Pháp Product Suite")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()

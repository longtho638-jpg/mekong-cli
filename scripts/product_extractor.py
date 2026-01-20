#!/usr/bin/env python3
"""
Product Extraction Script - Package .claude and .agencyos for Gumroad
Nuclear Weaponization: Zero external dependencies, pure Python
"""

import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Product definitions
PRODUCTS = {
    "claude-vibe-starter": {
        "price": 27,
        "sources": [
            ".claude/commands/plan.md",
            ".claude/commands/cook.md",
            ".claude/commands/ship.md",
            ".claude/commands/test.md",
            ".claude/commands/revenue.md",
            ".claude/commands/scout.md",
            ".claude/commands/approve.md",
            ".claude/commands/recover.md",
            ".claude/commands/sync.md",
            ".claude/commands/daily.md",
            ".claude/hooks/",
            ".claude/statusline.cjs",
            ".claude/statusline.sh",
            ".claude/settings.json",
            ".claude/.ck.json",
            ".claude/metadata.json",
        ],
        "exclude": [
            "*.local.json",
            ".env",
            "__pycache__",
        ],
    },
    "agencyos-pro": {
        "price": 97,
        "sources": [
            ".agencyos/commands/",
            ".agencyos/skills/",
            ".agencyos/hooks/",
            ".agencyos/statusline.cjs",
            ".agencyos/statusline.sh",
            ".agencyos/settings.json",
            ".agencyos/.agency.json",
            ".agencyos/metadata.json",
        ],
        "exclude": [
            "*.local.json",
            ".env",
            "__pycache__",
        ],
    },
    "full-suite": {
        "price": 197,
        "sources": [
            ".claude/",
            ".agencyos/",
        ],
        "exclude": [
            "*.local.json",
            ".env",
            "__pycache__",
            "settings.local.json",
        ],
    },
}


def extract_product(product_name: str, dry_run: bool = False) -> Path:
    """Extract product files to products/ directory"""
    config = PRODUCTS.get(product_name)
    if not config:
        raise ValueError(f"Unknown product: {product_name}")

    product_dir = PROJECT_ROOT / "products" / product_name / "src"

    if not dry_run:
        # Clean existing
        if product_dir.exists():
            shutil.rmtree(product_dir)
        product_dir.mkdir(parents=True, exist_ok=True)

    copied_files = []

    for source in config["sources"]:
        src_path = PROJECT_ROOT / source

        if not src_path.exists():
            print(f"⚠️  Missing: {source}")
            continue

        # Determine destination
        dest_path = product_dir / source

        if src_path.is_dir():
            if not dry_run:
                shutil.copytree(
                    src_path, dest_path, ignore=shutil.ignore_patterns(*config["exclude"])
                )
            copied_files.append(f"📁 {source}/")
        else:
            if not dry_run:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_path, dest_path)
            copied_files.append(f"📄 {source}")

    print(f"\n✅ Extracted {product_name}:")
    for f in copied_files:
        print(f"   {f}")

    return product_dir


def create_zip(product_name: str) -> Path:
    """Create distribution ZIP for Gumroad upload"""
    product_dir = PROJECT_ROOT / "products" / product_name
    src_dir = product_dir / "src"

    if not src_dir.exists():
        raise ValueError(f"Source not found. Run extract first: {product_name}")

    # Include README and INSTALLATION
    timestamp = datetime.now().strftime("%Y%m%d")
    zip_name = f"{product_name}-v4.0.0-{timestamp}.zip"
    zip_path = product_dir / zip_name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add src files
        for file_path in src_dir.rglob("*"):
            if file_path.is_file():
                arcname = file_path.relative_to(src_dir)
                zf.write(file_path, arcname)

        # Add docs
        readme = product_dir / "README.md"
        if readme.exists():
            zf.write(readme, "README.md")

        install = product_dir / "INSTALLATION.md"
        if install.exists():
            zf.write(install, "INSTALLATION.md")

    size_kb = zip_path.stat().st_size / 1024
    print(f"\n📦 Created: {zip_path.name} ({size_kb:.1f} KB)")

    return zip_path


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Product Extraction for Gumroad")
    parser.add_argument("product", choices=list(PRODUCTS.keys()) + ["all"])
    parser.add_argument("--dry-run", action="store_true", help="Show what would be extracted")
    parser.add_argument("--zip", action="store_true", help="Also create ZIP file")
    args = parser.parse_args()

    products = list(PRODUCTS.keys()) if args.product == "all" else [args.product]

    for product in products:
        print(f"\n{'=' * 50}")
        print(f"🚀 Processing: {product} (${PRODUCTS[product]['price']})")
        print("=" * 50)

        extract_product(product, dry_run=args.dry_run)

        if args.zip and not args.dry_run:
            create_zip(product)

    print("\n✅ Done! Products ready for Gumroad upload.")


if __name__ == "__main__":
    main()

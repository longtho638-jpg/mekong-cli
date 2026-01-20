#!/usr/bin/env python3
"""
🎨 Gumroad Thumbnail Generator v2
=================================

Generates professional thumbnails for all Gumroad products using Gemini API.
Uses the new google-genai SDK and exact product data from gumroad_products.json.

Usage:
    python3 scripts/generate_thumbnails.py
    python3 scripts/generate_thumbnails.py --product vibe-starter
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ google-genai not installed!")
    print("Run: pip install google-genai")
    sys.exit(1)


PROJECT_ROOT = Path(__file__).parent.parent
PRODUCTS_FILE = PROJECT_ROOT / "products" / "gumroad_products.json"
THUMBNAILS_DIR = PROJECT_ROOT / "products" / "thumbnails"


def load_env():
    """Load .env file."""
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def load_products() -> list:
    """Load products from JSON."""
    if not PRODUCTS_FILE.exists():
        print(f"❌ Products file not found: {PRODUCTS_FILE}")
        sys.exit(1)
    with open(PRODUCTS_FILE) as f:
        return json.load(f).get("products", [])


def get_price_display(price: int) -> str:
    """Convert price in cents to display string."""
    if price == 0:
        return "FREE"
    return f"${price // 100}"


def get_product_prompt(product: dict) -> str:
    """Generate image prompt for a product."""
    title = product.get("title", "Product")
    short_title = title.split(" - ")[0] if " - " in title else title
    subtitle = title.split(" - ")[1] if " - " in title else ""
    price = get_price_display(product.get("price", 0))

    color_schemes = {
        "vscode": "neon blue and cyan",
        "vibe": "neon cyan and magenta",
        "ai-skills": "neon purple and blue neural network",
        "fastapi": "neon green and teal",
        "auth": "neon emerald green",
        "vietnamese": "neon red and gold",
        "agencyos-pro": "premium gold and purple",
        "agencyos-enterprise": "premium platinum silver and blue",
    }

    pid = product.get("id", "")
    colors = "neon blue and purple"
    for key, scheme in color_schemes.items():
        if key in pid:
            colors = scheme
            break

    prompt = f"""Create a professional Gumroad product cover image in 16:9 aspect ratio.

Style: Dark cyberpunk tech background with {colors} gradients. Clean minimalist premium SaaS aesthetic. High contrast.

Text overlay:
- Main title: "{short_title}" - bold white futuristic font, center
- Subtitle: "{subtitle}" - smaller text below
- Price badge: "{price}" - rounded badge, bottom right corner

Visual: Abstract tech patterns, glowing icons, no device frames. Professional digital product thumbnail."""

    return prompt


def generate_thumbnail(product: dict, output_path: Path, client) -> bool:
    """Generate thumbnail using Gemini Imagen API."""
    pid = product.get("id", "unknown")
    print(f"\n📦 Generating: {pid}")

    prompt = get_product_prompt(product)
    print(f"   📝 Title: {product.get('title', '')[:50]}...")

    try:
        response = client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                safety_filter_level="BLOCK_ONLY_HIGH",
            ),
        )

        if response.generated_images:
            image = response.generated_images[0]
            # Save the image
            image.image.save(str(output_path))
            print(f"   ✅ Saved: {output_path.name}")
            return True
        else:
            print("   ❌ No image generated")
            return False

    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "rate" in error_msg.lower():
            print("   ⏳ Rate limited, waiting 10s...")
            time.sleep(10)
            return generate_thumbnail(product, output_path, client)  # Retry
        print(f"   ❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="🎨 Generate Gumroad Thumbnails")
    parser.add_argument("--product", type=str, help="Generate for specific product")
    parser.add_argument("--dry-run", action="store_true", help="Show prompts only")
    parser.add_argument("--list", action="store_true", help="List products")

    args = parser.parse_args()

    load_env()
    products = load_products()

    if args.list:
        print("\n📦 Products:")
        for p in products:
            price = get_price_display(p.get("price", 0))
            print(f"  - {p['id']}: {price} → {p.get('thumbnail', 'N/A')}")
        return

    if args.product:
        products = [p for p in products if args.product in p.get("id", "")]

    if not products:
        print("❌ No products found!")
        return

    print("\n🎨 THUMBNAIL GENERATOR v2")
    print("=" * 50)
    print(f"Products: {len(products)}")
    print(f"Output: {THUMBNAILS_DIR}")

    if args.dry_run:
        print("\n[DRY-RUN MODE]")
        for p in products:
            print(f"\n📦 {p['id']}: {get_price_display(p.get('price', 0))}")
            print(f"   Title: {p.get('title', '')[:60]}...")
        return

    # Get API key
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("\n❌ GEMINI_API_KEY or GOOGLE_API_KEY not found in .env!")
        return

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Ensure output dir exists
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

    # Restore backups first
    for old_file in THUMBNAILS_DIR.glob("*.old.png"):
        original = old_file.with_suffix("").with_suffix(".png")
        if not original.exists():
            old_file.rename(original)
            print(f"   📁 Restored: {original.name}")

    # Generate thumbnails
    success = 0
    for product in products:
        thumbnail_name = product.get("thumbnail", f"{product['id']}-cover.png")
        output_path = THUMBNAILS_DIR / thumbnail_name

        if generate_thumbnail(product, output_path, client):
            success += 1

        # Rate limit delay
        time.sleep(3)

    print(f"\n✅ Generated: {success}/{len(products)} thumbnails")


if __name__ == "__main__":
    main()

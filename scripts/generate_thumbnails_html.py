#!/usr/bin/env python3
"""
🎨 Gumroad Thumbnail Generator v3 - HTML Rendering
===================================================

Generates thumbnails by rendering HTML templates with Playwright.
No API dependencies - works offline!

Usage:
    python3 scripts/generate_thumbnails_html.py
    python3 scripts/generate_thumbnails_html.py --product vibe-starter
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("❌ Playwright not installed!")
    print("Run: pip install playwright && playwright install chromium")
    sys.exit(1)


PROJECT_ROOT = Path(__file__).parent.parent
PRODUCTS_FILE = PROJECT_ROOT / "products" / "gumroad_products.json"
THUMBNAILS_DIR = PROJECT_ROOT / "products" / "thumbnails"
TEMP_HTML = PROJECT_ROOT / ".antigravity" / "temp_thumbnail.html"


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


def get_color_scheme(pid: str) -> dict:
    """Get color scheme based on product ID."""
    schemes = {
        "vscode": {
            "gradient": "linear-gradient(135deg, #0078d4 0%, #00d4ff 100%)",
            "badge": "#22c55e",
        },
        "vibe": {
            "gradient": "linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)",
            "badge": "#06b6d4",
        },
        "ai-skills": {
            "gradient": "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
            "badge": "#8b5cf6",
        },
        "fastapi": {
            "gradient": "linear-gradient(135deg, #059669 0%, #14b8a6 100%)",
            "badge": "#22c55e",
        },
        "auth": {
            "gradient": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            "badge": "#10b981",
        },
        "vietnamese": {
            "gradient": "linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)",
            "badge": "#ef4444",
        },
        "agencyos-pro": {
            "gradient": "linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)",
            "badge": "#eab308",
        },
        "agencyos-enterprise": {
            "gradient": "linear-gradient(135deg, #94a3b8 0%, #3b82f6 100%)",
            "badge": "#94a3b8",
        },
    }

    for key, scheme in schemes.items():
        if key in pid:
            return scheme
    return {"gradient": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", "badge": "#3b82f6"}


def get_icon(pid: str) -> str:
    """Get SVG icon based on product type."""
    icons = {
        "vscode": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.58 2.2L9.85 8.58 5.5 5.25 4 6v12l1.5.75 4.35-3.33L17.58 21.8 20 20.5V3.5l-2.42-1.3zM7 15V9l3 2.4L7 15zm10 1.84l-5.5-4.42V11.58l5.5-4.42v9.68z"/></svg>""",
        "vibe": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zm-8-3 1-1-1-1 1-1-1-1H6v6h4zm0-4H8v2h2v-2z"/></svg>""",
        "ai-skills": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>""",
        "fastapi": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>""",
        "auth": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>""",
        "vietnamese": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>""",
        "agencyos": """<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>""",
    }

    for key, icon in icons.items():
        if key in pid:
            return icon
    return icons["agencyos"]


def generate_html(product: dict) -> str:
    """Generate HTML for thumbnail."""
    title = product.get("title", "Product")
    short_title = title.split(" - ")[0] if " - " in title else title
    subtitle = title.split(" - ")[1] if " - " in title else ""
    price = get_price_display(product.get("price", 0))
    pid = product.get("id", "")

    colors = get_color_scheme(pid)
    icon = get_icon(pid)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            width: 1280px;
            height: 720px;
            font-family: 'Inter', -apple-system, sans-serif;
            background: #0a0a0f;
            overflow: hidden;
        }}
        
        .container {{
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 60px;
        }}
        
        .bg-gradient {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: {colors["gradient"]};
            opacity: 0.15;
        }}
        
        .grid {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }}
        
        .glow {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: {colors["gradient"]};
            opacity: 0.2;
            filter: blur(100px);
            border-radius: 50%;
        }}
        
        .icon-container {{
            position: absolute;
            top: 60px;
            right: 60px;
            width: 120px;
            height: 120px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        }}
        
        .icon-container svg {{
            width: 60px;
            height: 60px;
            color: white;
            opacity: 0.8;
        }}
        
        .content {{
            position: relative;
            z-index: 10;
        }}
        
        .title {{
            font-size: 64px;
            font-weight: 800;
            color: white;
            line-height: 1.1;
            margin-bottom: 16px;
            text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }}
        
        .subtitle {{
            font-size: 28px;
            font-weight: 400;
            color: rgba(255,255,255,0.7);
            margin-bottom: 40px;
        }}
        
        .badge {{
            position: absolute;
            bottom: 60px;
            right: 60px;
            background: {colors["badge"]};
            color: white;
            font-size: 32px;
            font-weight: 800;
            padding: 16px 32px;
            border-radius: 100px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }}
        
        .dots {{
            position: absolute;
            top: 120px;
            left: 60px;
            display: flex;
            gap: 12px;
        }}
        
        .dot {{
            width: 20px;
            height: 20px;
            border-radius: 50%;
            opacity: 0.6;
        }}
        
        .dot:nth-child(1) {{ background: #ef4444; }}
        .dot:nth-child(2) {{ background: #eab308; }}
        .dot:nth-child(3) {{ background: #22c55e; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="bg-gradient"></div>
        <div class="grid"></div>
        <div class="glow"></div>
        
        <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
        
        <div class="icon-container">
            {icon}
        </div>
        
        <div class="content">
            <h1 class="title">{short_title}</h1>
            <p class="subtitle">{subtitle}</p>
        </div>
        
        <div class="badge">{price}</div>
    </div>
</body>
</html>"""

    return html


def generate_thumbnail(product: dict, output_path: Path, page) -> bool:
    """Generate thumbnail by rendering HTML."""
    pid = product.get("id", "unknown")
    print(f"\n📦 Generating: {pid}")

    html = generate_html(product)

    # Write temp HTML
    TEMP_HTML.parent.mkdir(parents=True, exist_ok=True)
    with open(TEMP_HTML, "w") as f:
        f.write(html)

    try:
        # Navigate and screenshot
        page.goto(f"file://{TEMP_HTML}")
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)  # Wait for fonts

        page.screenshot(path=str(output_path), type="png")
        print(f"   ✅ Saved: {output_path.name}")
        return True

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="🎨 Generate Thumbnails (HTML)")
    parser.add_argument("--product", type=str, help="Generate for specific product")
    parser.add_argument("--list", action="store_true", help="List products")

    args = parser.parse_args()

    products = load_products()

    if args.list:
        print("\n📦 Products:")
        for p in products:
            price = get_price_display(p.get("price", 0))
            print(f"  - {p['id']}: {price}")
        return

    if args.product:
        products = [p for p in products if args.product in p.get("id", "")]

    if not products:
        print("❌ No products found!")
        return

    print("\n🎨 THUMBNAIL GENERATOR (HTML Rendering)")
    print("=" * 50)
    print(f"Products: {len(products)}")
    print(f"Output: {THUMBNAILS_DIR}")

    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        success = 0
        for product in products:
            thumbnail_name = product.get("thumbnail", f"{product['id']}-cover.png")
            output_path = THUMBNAILS_DIR / thumbnail_name

            if generate_thumbnail(product, output_path, page):
                success += 1

        browser.close()

    # Cleanup
    if TEMP_HTML.exists():
        TEMP_HTML.unlink()

    print(f"\n✅ Generated: {success}/{len(products)} thumbnails")


if __name__ == "__main__":
    main()

import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).parent.parent
COOKIES_FILE = PROJECT_ROOT / ".antigravity" / "gumroad_cookies.json"
PRODUCTS_FILE = PROJECT_ROOT / "products" / "gumroad_products.json"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Load cookies
        if COOKIES_FILE.exists():
            with open(COOKIES_FILE) as f:
                cookies = json.load(f)
            context.add_cookies(cookies)
        else:
            print("❌ No cookies found!")
            return

        page = context.new_page()
        print("🔗 Visiting Products Dashboard...")
        page.goto("https://app.gumroad.com/products")
        page.wait_for_load_state("networkidle")

        # Dump detailed breakdown
        print("\n📦 Found Products:")
        print("─" * 50)

        # Scrape products
        # Gumroad product rows usually links to /products/<ID>/edit
        product_links = page.locator('a[href*="/products/"]').all()

        found_map = {}

        for link in product_links:
            href = link.get_attribute("href")
            text = link.inner_text().strip().split("\n")[0]  # Get first line (title)

            if "edit" in href and "analytics" not in href:
                # Extract ID: /products/ID/edit
                # but sometimes it is /products/details/ID/edit ? just split
                parts = href.split("/")
                try:
                    # heuristic
                    prod_id = parts[parts.index("products") + 1]
                    print(f"   found: {text[:40]}... -> {prod_id}")
                    found_map[text] = prod_id
                except:
                    pass

        print("\n🔄 Suggesting JSON Updates:")
        # Load local JSON
        with open(PRODUCTS_FILE) as f:
            data = json.load(f)

        local_products = data.get("products", [])
        updates_made = False

        for lp in local_products:
            # Fuzzy match title? Or exact?
            # Let's try to match simplistic
            match_id = None

            # 1. Try exact title match
            for title, pid in found_map.items():
                if lp["title"] in title or title in lp["title"]:
                    match_id = pid
                    break

            if match_id and match_id != lp.get("gumroad_id"):
                print(f"   ⚠️ Mismatch for {lp['id']}:")
                print(f"      Old: {lp.get('gumroad_id')}")
                print(f"      New: {match_id}")
                lp["gumroad_id"] = match_id
                updates_made = True
            elif not match_id:
                print(f"   ❌ Could not find on dashboard: {lp['id']}")

        if updates_made:
            print("\n💾 Updating gumroad_products.json...")
            # Backup first
            import shutil

            shutil.copy(PRODUCTS_FILE, str(PRODUCTS_FILE) + ".bak")

            with open(PRODUCTS_FILE, "w") as f:
                json.dump(data, f, indent=2)
            print("✅ Updated JSON with new IDs")
        else:
            print("\n✨ No ID updates needed (or none found matching)")

        browser.close()


if __name__ == "__main__":
    main()

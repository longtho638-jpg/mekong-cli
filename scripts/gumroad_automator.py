#!/usr/bin/env python3
"""
🚀 Gumroad Automator - Playwright Headless Browser Automation
=============================================================

Automates Gumroad product updates (SEO, thumbnails) from CLI.
Uses Playwright for headless browser control.

Usage:
    python3 scripts/gumroad_automator.py --all          # Update all products
    python3 scripts/gumroad_automator.py --product vibe-starter  # Single product
    python3 scripts/gumroad_automator.py --dry-run      # Test mode (no changes)

Requirements:
    pip install playwright
    playwright install chromium

Environment:
    GUMROAD_EMAIL=your@email.com
    GUMROAD_PASSWORD=your_password
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

# Check Playwright installation
try:
    from playwright.sync_api import Browser, Page, sync_playwright
except ImportError:
    print("❌ Playwright not installed!")
    print("Run: pip install playwright && playwright install chromium")
    sys.exit(1)


# === CONFIGURATION ===
PROJECT_ROOT = Path(__file__).parent.parent
PRODUCTS_FILE = PROJECT_ROOT / "products" / "gumroad_products.json"
THUMBNAILS_DIR = PROJECT_ROOT / "products" / "thumbnails"
COOKIES_FILE = PROJECT_ROOT / ".antigravity" / "gumroad_cookies.json"

GUMROAD_BASE = "https://app.gumroad.com"
GUMROAD_LOGIN_URL = f"{GUMROAD_BASE}/login"
GUMROAD_PRODUCTS_URL = f"{GUMROAD_BASE}/products"


def load_env():
    """Load environment variables from .env file."""
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def load_products() -> list:
    """Load product data from JSON file."""
    if not PRODUCTS_FILE.exists():
        print(f"❌ Products file not found: {PRODUCTS_FILE}")
        sys.exit(1)

    with open(PRODUCTS_FILE) as f:
        data = json.load(f)

    return data.get("products", [])


def save_cookies(page: Page):
    """Save cookies for session persistence."""
    COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)
    cookies = page.context.cookies()
    with open(COOKIES_FILE, "w") as f:
        json.dump(cookies, f)
    print("   💾 Cookies saved")


def load_cookies(page: Page) -> bool:
    """Load saved cookies if available."""
    if COOKIES_FILE.exists():
        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
        page.context.add_cookies(cookies)
        print("   🍪 Loaded saved cookies")
        return True
    return False


def login_gumroad(page: Page, email: str, password: str) -> bool:
    """Login to Gumroad with improved debugging."""
    print("\n🔐 Logging in to Gumroad...")

    DEBUG_DIR = PROJECT_ROOT / ".antigravity" / "debug"
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    # Try cookies first
    if load_cookies(page):
        page.goto(GUMROAD_PRODUCTS_URL)
        page.wait_for_load_state("networkidle", timeout=10000)

        # Check if logged in
        if "login" not in page.url.lower():
            print("   ✅ Session restored from cookies")
            return True
        print("   ⚠️ Cookies expired, doing fresh login")

    # Fresh login
    page.goto(GUMROAD_LOGIN_URL)
    page.wait_for_load_state("networkidle", timeout=10000)

    # Debug screenshot
    page.screenshot(path=str(DEBUG_DIR / "01_login_page.png"))
    print("   📸 Screenshot saved: 01_login_page.png")

    try:
        # Wait for and fill email field
        email_field = page.wait_for_selector(
            'input[type="email"], input[name="email"], #email', timeout=10000
        )
        if email_field:
            email_field.fill(email)
            print("   ✅ Email filled")

        # Wait for and fill password field
        password_field = page.wait_for_selector(
            'input[type="password"], input[name="password"], #password', timeout=5000
        )
        if password_field:
            password_field.fill(password)
            print("   ✅ Password filled")

        # Screenshot before submit
        page.screenshot(path=str(DEBUG_DIR / "02_before_submit.png"))

        # Find and click submit button
        submit_btn = page.locator(
            'button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Sign in")'
        ).first
        if submit_btn:
            submit_btn.click()
            print("   ⏳ Submitting login...")

        # Wait for navigation
        page.wait_for_load_state("networkidle", timeout=15000)
        time.sleep(2)

        # Screenshot after submit
        page.screenshot(path=str(DEBUG_DIR / "03_after_submit.png"))
        print("   📸 Screenshot saved: 03_after_submit.png")

        # Check success - look for dashboard elements or products page
        current_url = page.url.lower()
        page_content = page.content().lower()

        # Success indicators
        is_success = any(
            [
                "products" in current_url,
                "dashboard" in current_url,
                "home" in current_url,
                "login" not in current_url and "signin" not in current_url,
            ]
        )

        # Failure indicators
        has_error = any(
            [
                "invalid" in page_content,
                "incorrect" in page_content,
                "wrong password" in page_content,
                "error" in page_content and "login" in current_url,
            ]
        )

        if is_success and not has_error:
            print("   ✅ Login successful!")
            save_cookies(page)
            return True
        else:
            print(f"   ❌ Login failed! URL: {page.url[:60]}")
            print(f"   💡 Check debug screenshots in: {DEBUG_DIR}")
            return False

    except Exception as e:
        page.screenshot(path=str(DEBUG_DIR / "error_login.png"))
        print(f"   ❌ Login error: {e}")
        print(f"   💡 Check debug screenshots in: {DEBUG_DIR}")
        return False


def upload_thumbnail(page: Page, image_path: Path, dry_run: bool = False) -> bool:
    """Upload thumbnail image to product."""
    if not image_path.exists():
        print(f"   ⚠️ Thumbnail not found: {image_path.name}")
        return False

    if dry_run:
        print(f"   📷 [DRY-RUN] Would upload: {image_path.name}")
        return True

    try:
        # Look for file input (cover image)
        file_input = page.locator('input[type="file"][accept*="image"]').first
        if file_input:
            file_input.set_input_files(str(image_path))
            time.sleep(2)
            print(f"   📷 Uploaded: {image_path.name}")
            return True
    except Exception as e:
        print(f"   ⚠️ Thumbnail upload error: {e}")

    return False


def update_product_fields(page: Page, product: dict, dry_run: bool = False) -> bool:
    """Update product title, description, and tags."""
    try:
        # Update title
        title_input = page.locator('input[name="name"], input[id*="name"]').first
        if title_input and product.get("title"):
            if dry_run:
                print(f"   📝 [DRY-RUN] Would set title: {product['title'][:50]}...")
            else:
                title_input.fill(product["title"])
                print("   📝 Updated title")

        # Update description
        desc_area = page.locator('textarea[name="description"], div[contenteditable="true"]').first
        if desc_area and product.get("description"):
            if dry_run:
                print(
                    f"   📄 [DRY-RUN] Would set description ({len(product['description'])} chars)"
                )
            else:
                try:
                    desc_area.fill(product["description"])
                except:
                    # For contenteditable divs
                    desc_area.evaluate("el => el.innerText = ''")
                    desc_area.type(product["description"])
                print("   📄 Updated description")

        # Update price (in cents)
        price_input = page.locator('input[name="price"], input[id*="price"]').first
        if price_input and product.get("price") is not None:
            price_dollars = product["price"] / 100 if product["price"] > 0 else 0
            if dry_run:
                print(f"   💰 [DRY-RUN] Would set price: ${price_dollars}")
            else:
                price_input.fill(str(price_dollars))
                print(f"   💰 Set price: ${price_dollars}")

        return True

    except Exception as e:
        print(f"   ⚠️ Field update error: {e}")
        return False


def save_product(page: Page, dry_run: bool = False) -> bool:
    """Click save button."""
    if dry_run:
        print("   💾 [DRY-RUN] Would save product")
        return True

    try:
        # Look for save/publish button
        save_btn = page.locator(
            'button:has-text("Save"), button:has-text("Publish"), button[type="submit"]'
        ).first
        if save_btn:
            save_btn.click()
            time.sleep(2)
            print("   💾 Product saved!")
            return True
    except Exception as e:
        print(f"   ⚠️ Save error: {e}")

    return False


def update_single_product(page: Page, product: dict, dry_run: bool = False) -> bool:
    """Update a single product on Gumroad."""
    product_id = product.get("id", "unknown")
    gumroad_id = product.get("gumroad_id")
    action = product.get("action", "update")

    print(f"\n{'─' * 50}")
    print(f"📦 Product: {product_id}")
    print(f"   Action: {action.upper()}")

    if action == "create" and not gumroad_id:
        if dry_run:
            print("   🆕 [DRY-RUN] Would create new product")
            return True

        # Navigate to new product page
        page.goto(f"{GUMROAD_PRODUCTS_URL}/new")
        time.sleep(2)
        print("   🆕 Creating new product...")
    else:
        # Navigate to existing product edit page
        edit_url = f"{GUMROAD_PRODUCTS_URL}/{gumroad_id}/edit"
        if dry_run:
            print(f"   🔗 [DRY-RUN] Would visit: {edit_url}")
        else:
            page.goto(edit_url)
            time.sleep(2)
            print(f"   🔗 Editing: {edit_url}")

    # Upload thumbnail
    thumbnail_name = product.get("thumbnail")
    if thumbnail_name:
        thumbnail_path = THUMBNAILS_DIR / thumbnail_name
        upload_thumbnail(page, thumbnail_path, dry_run)

    # Update fields
    update_product_fields(page, product, dry_run)

    # Save
    save_product(page, dry_run)

    return True


def run_automation(
    products: list,
    product_filter: Optional[str] = None,
    dry_run: bool = False,
    headless: bool = True,
):
    """Main automation runner."""
    print("\n" + "═" * 60)
    print("🚀 GUMROAD AUTOMATOR")
    print("═" * 60)
    print(f"Mode: {'DRY-RUN (no changes)' if dry_run else 'LIVE'}")
    print(f"Headless: {headless}")
    print(f"Products: {len(products)}")

    # Filter products
    if product_filter:
        products = [p for p in products if product_filter in p.get("id", "")]
        print(f"Filtered to: {len(products)} product(s)")

    if not products:
        print("❌ No products to process!")
        return

    # Get credentials
    load_env()
    email = os.getenv("GUMROAD_EMAIL", "")
    password = os.getenv("GUMROAD_PASSWORD", "")

    if not email or not password:
        print("\n⚠️ CREDENTIALS NOT FOUND!")
        print("Add to .env file:")
        print("   GUMROAD_EMAIL=your@email.com")
        print("   GUMROAD_PASSWORD=your_password")

        if not dry_run:
            sys.exit(1)
        print("\nContinuing in dry-run mode without login...")

    # Start Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        page = context.new_page()

        # Login (skip in dry-run without credentials)
        if email and password:
            if not login_gumroad(page, email, password):
                browser.close()
                return
        elif not dry_run:
            print("❌ Cannot proceed without credentials!")
            browser.close()
            return

        # Process products
        success_count = 0
        for product in products:
            try:
                if update_single_product(page, product, dry_run):
                    success_count += 1
            except Exception as e:
                print(f"   ❌ Error: {e}")

        browser.close()

    # Summary
    print("\n" + "═" * 60)
    print("📊 SUMMARY")
    print("═" * 60)
    print(f"✅ Processed: {success_count}/{len(products)} products")

    if dry_run:
        print("\n💡 This was a DRY-RUN. No actual changes were made.")
        print("   Run without --dry-run to apply changes.")


def main():
    parser = argparse.ArgumentParser(description="🚀 Gumroad Automator")
    parser.add_argument("--all", action="store_true", help="Update all products")
    parser.add_argument("--product", type=str, help="Update specific product by ID")
    parser.add_argument("--dry-run", action="store_true", help="Test mode (no changes)")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    parser.add_argument("--list", action="store_true", help="List all products")

    args = parser.parse_args()

    # Load products
    products = load_products()

    # List mode
    if args.list:
        print("\n📦 Available Products:")
        print("─" * 50)
        for p in products:
            status = "🔄 UPDATE" if p.get("gumroad_id") else "🆕 CREATE"
            price = p.get("price", 0) / 100
            print(f"  {status} {p['id']}: ${price}")
        return

    # Need either --all or --product
    if not args.all and not args.product:
        parser.print_help()
        print("\n💡 Examples:")
        print("   python3 scripts/gumroad_automator.py --all --dry-run")
        print("   python3 scripts/gumroad_automator.py --product vibe-starter")
        return

    # Run automation
    run_automation(
        products=products,
        product_filter=args.product,
        dry_run=args.dry_run,
        headless=not args.headed,
    )


if __name__ == "__main__":
    main()

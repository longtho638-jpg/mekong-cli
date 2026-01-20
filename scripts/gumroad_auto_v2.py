#!/usr/bin/env python3
"""
🚀 Gumroad Automation V2 - Robust Browser Automation
=====================================================

FIXES: Selector timeouts by using better selectors and slower interactions.

Usage:
    # Step 1: Login session (manual CAPTCHA)
    python3 scripts/gumroad_auto_v2.py session

    # Step 2: Verify session
    python3 scripts/gumroad_auto_v2.py verify

    # Step 3: Update existing products only (headless)
    python3 scripts/gumroad_auto_v2.py update --all

    # Debug mode (visible browser)
    python3 scripts/gumroad_auto_v2.py update --all --headed
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

try:
    from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright
except ImportError:
    print("❌ Playwright not installed!")
    print("Run: pip install playwright && playwright install chromium")
    sys.exit(1)


# === CONFIGURATION ===
PROJECT_ROOT = Path(__file__).parent.parent
PRODUCTS_FILE = PROJECT_ROOT / "products" / "gumroad_products.json"
THUMBNAILS_DIR = PROJECT_ROOT / "products" / "thumbnails"
SESSION_DIR = PROJECT_ROOT / ".antigravity" / "gumroad_session"
COOKIES_FILE = SESSION_DIR / "cookies.json"
STATE_FILE = SESSION_DIR / "state.json"

GUMROAD_BASE = "https://app.gumroad.com"
GUMROAD_LOGIN = f"{GUMROAD_BASE}/login"
GUMROAD_PRODUCTS = f"{GUMROAD_BASE}/products"

# Slower interactions to avoid detection
SLOW_MO = 200  # ms between actions
PAGE_TIMEOUT = 60000  # 60 seconds


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
    """Load products from JSON - only those with gumroad_id for update."""
    if not PRODUCTS_FILE.exists():
        print(f"❌ Products file not found: {PRODUCTS_FILE}")
        sys.exit(1)
    with open(PRODUCTS_FILE) as f:
        all_products = json.load(f).get("products", [])
    # Filter to only products that have gumroad_id
    return [p for p in all_products if p.get("gumroad_id")]


def print_header(title: str):
    print("\n" + "═" * 60)
    print(f"🚀 {title}")
    print("═" * 60)


def print_section(title: str):
    print(f"\n{'─' * 50}")
    print(f"📌 {title}")
    print("─" * 50)


# ============================================================
# COMMAND: session
# ============================================================
def cmd_session(args):
    """Start interactive browser session for manual login."""
    print_header("GUMROAD LOGIN SESSION")
    print("""
🔑 This opens a PERSISTENT browser window.

📋 Steps:
1. Browser opens to Gumroad login
2. Login with your email/password
3. Solve CAPTCHA if prompted
4. Once you see the dashboard, press ENTER in terminal
5. Session saved for future headless use

⚠️  Browser stays open until YOU press ENTER!
""")

    load_env()
    email = os.getenv("GUMROAD_EMAIL", "")
    password = os.getenv("GUMROAD_PASSWORD", "")

    SESSION_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=100)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        page = context.new_page()

        print("\n🌐 Opening Gumroad login page...")
        page.goto(GUMROAD_LOGIN)
        page.wait_for_load_state("networkidle")

        # Pre-fill credentials
        if email:
            try:
                email_field = page.wait_for_selector(
                    'input[type="email"], input[name="email"]', timeout=5000
                )
                if email_field:
                    email_field.fill(email)
                    print(f"   ✅ Email pre-filled: {email[:3]}***")
            except:
                pass

        if password:
            try:
                pass_field = page.wait_for_selector('input[type="password"]', timeout=3000)
                if pass_field:
                    pass_field.fill(password)
                    print("   ✅ Password pre-filled")
            except:
                pass

        print("\n" + "=" * 50)
        print("🔐 COMPLETE LOGIN IN BROWSER")
        print("   Then press ENTER here when you see dashboard...")
        print("=" * 50)
        input("\n>>> Press ENTER after successful login: ")

        # Save cookies
        cookies = context.cookies()
        with open(COOKIES_FILE, "w") as f:
            json.dump(cookies, f, indent=2)

        state = {
            "logged_in": True,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "url": page.url,
        }
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)

        print("\n✅ Session saved!")
        print(f"   📍 Cookies: {COOKIES_FILE}")
        browser.close()
        return True


# ============================================================
# COMMAND: verify
# ============================================================
def cmd_verify(args):
    """Verify saved session is valid."""
    print_header("VERIFY SESSION")

    if not COOKIES_FILE.exists():
        print("❌ No saved session found!")
        print("   Run: python3 scripts/gumroad_auto_v2.py session")
        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )

        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
        context.add_cookies(cookies)

        page = context.new_page()
        page.goto(GUMROAD_PRODUCTS)
        page.wait_for_load_state("networkidle")

        if "login" in page.url.lower():
            print("❌ Session expired!")
            browser.close()
            return False

        print("✅ Session valid!")
        print(f"   📍 Current URL: {page.url[:50]}...")
        browser.close()
        return True


# ============================================================
# COMMAND: update - With improved selectors
# ============================================================
def cmd_update(args):
    """Update products using saved session."""
    print_header("UPDATE PRODUCTS (BROWSER)")

    if not COOKIES_FILE.exists():
        print("❌ No saved session!")
        return False

    products = load_products()
    dry_run = args.dry_run
    headed = args.headed

    print(f"   Mode: {'DRY-RUN' if dry_run else 'LIVE'} | {'HEADED' if headed else 'HEADLESS'}")
    print(f"   Products with gumroad_id: {len(products)}")

    if args.product:
        products = [p for p in products if args.product in p.get("id", "")]

    if not products:
        print("❌ No products to process!")
        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed, slow_mo=SLOW_MO)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        context.set_default_timeout(PAGE_TIMEOUT)

        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
        context.add_cookies(cookies)

        page = context.new_page()
        page.goto(GUMROAD_PRODUCTS)
        page.wait_for_load_state("networkidle")

        if "login" in page.url.lower():
            print("❌ Session expired!")
            browser.close()
            return False

        print("   ✅ Session restored")

        success = 0
        for product in products:
            if process_product_v2(page, product, dry_run):
                success += 1

        browser.close()

    print_section("SUMMARY")
    print(f"✅ Processed: {success}/{len(products)} products")
    return True


def process_product_v2(page: Page, product: dict, dry_run: bool) -> bool:
    """Process a single product with improved selectors."""
    pid = product.get("id", "unknown")
    gumroad_id = product.get("gumroad_id")

    print_section(f"Product: {pid}")

    if not gumroad_id:
        print("   ⚠️ No gumroad_id, skipping")
        return False

    # Navigate to edit page
    edit_url = f"{GUMROAD_PRODUCTS}/{gumroad_id}/edit"
    if dry_run:
        print(f"   🔗 [DRY-RUN] Would edit: {edit_url}")
        print(f"   📝 Title: {product.get('title', '')[:50]}...")
        print(f"   📄 Description: {len(product.get('description', ''))} chars")
        print(f"   💰 Price: ${product.get('price', 0) / 100}")
        print(f"   🏷️ Tags: {product.get('tags', [])}")
        print(f"   🖼️ Image: {product.get('thumbnail', 'none')}")
        return True

    print("   🔗 Navigating to edit page...")
    page.goto(edit_url)
    time.sleep(4)  # Wait for page to fully load

    # Check if we're on the right page
    if "edit" not in page.url.lower() and gumroad_id not in page.url:
        print("   ❌ Failed to navigate to edit page")
        return False

    # 1. Update Title
    title = product.get("title", "")
    if title:
        try:
            title_input = page.locator('input[name*="name"]').first
            if title_input.is_visible(timeout=5000):
                title_input.click()
                # Use keyboard to select all and delete to be safe
                page.keyboard.press("Meta+A")
                page.keyboard.press("Backspace")
                title_input.fill(title)
                print("   📝 Updated title")
        except Exception as e:
            print(f"   ⚠️ Title update: {str(e)[:50]}")

    # 2. Update Description
    desc = product.get("description", "")
    if desc:
        try:
            desc_selectors = [
                'textarea[name*="description"]',
                ".ProseMirror",
                'div[contenteditable="true"]',
                '[data-testid="description"]',
            ]
            for selector in desc_selectors:
                try:
                    el = page.locator(selector).first
                    if el.is_visible(timeout=3000):
                        el.click()
                        page.keyboard.press("Meta+A")
                        page.keyboard.press("Backspace")
                        # Some editors need type() instead of fill()
                        if "ProseMirror" in selector or "contenteditable" in selector:
                            el.type(desc)
                        else:
                            el.fill(desc)
                        print("   📄 Updated description")
                        break
                except:
                    continue
        except Exception as e:
            print(f"   ⚠️ Description update: {str(e)[:50]}")

    # 3. Update Price
    price = product.get("price")
    if price is not None:
        price_dollars = price / 100 if price > 0 else 0
        try:
            price_input = page.locator('input[name*="price"]').first
            if price_input.is_visible(timeout=3000):
                price_input.fill(str(price_dollars))
                print(f"   💰 Set price: ${price_dollars}")
        except Exception as e:
            print(f"   ⚠️ Price update: {str(e)[:50]}")

    # 4. Update Tags (SEO)
    tags = product.get("tags", [])
    if tags:
        try:
            print("   🏷️ Updating tags...")
            # Locate the tags input - usually an input within a tags-input component
            tag_input = page.locator(
                'input[placeholder*="Tag"], input[aria-label*="Tag"], .tags-input input'
            ).first
            if tag_input.is_visible(timeout=3000):
                # Clear existing tags if possible (often tricky in custom UI)
                # For now, let's just add missing ones or try to fill
                for tag in tags:
                    tag_input.fill(tag)
                    page.keyboard.press("Enter")
                print(f"   ✅ Added {len(tags)} tags")
        except Exception as e:
            print(f"   ⚠️ Tags update: {str(e)[:50]}")

    # 5. Update Cover Image (Thumbnail)
    thumbnail_name = product.get("thumbnail")
    if thumbnail_name:
        thumb_path = THUMBNAILS_DIR / thumbnail_name
        if thumb_path.exists():
            try:
                print(f"   🖼️ Uploading cover: {thumbnail_name}...")
                # Find the upload button or file input
                # Gumroad often has a "Computer" button for uploads
                file_input = page.locator('input[type="file"]').first
                if file_input:
                    file_input.set_input_files(str(thumb_path))
                    print("   ✅ Thumbnail uploaded")
                    time.sleep(3)  # Wait for upload
            except Exception as e:
                print(f"   ⚠️ Thumbnail upload: {str(e)[:50]}")
        else:
            print(f"   ⚠️ Thumbnail not found: {thumb_path}")

    # 6. Save Changes
    try:
        save_btn = page.locator(
            'button:has-text("Save"), button:has-text("Update"), .save-button'
        ).first
        if save_btn.is_visible(timeout=5000):
            save_btn.click()
            print("   💾 Saving...")
            time.sleep(5)  # Wait for save to complete

            # Check for "Publish" button if it's currently a draft
            publish_btn = page.locator('button:has-text("Publish")').first
            if publish_btn.is_visible(timeout=3000):
                publish_btn.click()
                print("   🚀 Published!")
                time.sleep(3)
        else:
            print("   ❌ Save button not found")
    except Exception as e:
        print(f"   ⚠️ Save/Publish: {str(e)[:50]}")

    return True


# ============================================================
# COMMAND: list
# ============================================================
def cmd_list(args):
    """List all products from JSON."""
    print_header("PRODUCTS LIST")

    if not PRODUCTS_FILE.exists():
        print(f"❌ Products file not found: {PRODUCTS_FILE}")
        return False

    with open(PRODUCTS_FILE) as f:
        all_products = json.load(f).get("products", [])

    for p in all_products:
        gid = p.get("gumroad_id")
        status = "🔄 UPDATE" if gid else "🆕 CREATE"
        price = p.get("price", 0) / 100
        thumb = "✅" if (THUMBNAILS_DIR / p.get("thumbnail", "")).exists() else "❌"
        print(
            f"  {status} {p['id']}: ${price} | Thumb: {thumb} | GID: {gid[:10] if gid else 'none'}..."
        )

    updateable = len([p for p in all_products if p.get("gumroad_id")])
    print(f"\nTotal: {len(all_products)} products ({updateable} with gumroad_id)")
    return True


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="🚀 Gumroad Automation V2 - Robust Browser Automation",
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    subparsers.add_parser("session", help="Start login session (interactive)")
    subparsers.add_parser("verify", help="Verify saved session")
    subparsers.add_parser("list", help="List all products")

    update_p = subparsers.add_parser("update", help="Update products (browser)")
    update_p.add_argument("--all", action="store_true", help="Update all products")
    update_p.add_argument("--product", type=str, help="Update specific product")
    update_p.add_argument("--dry-run", action="store_true", help="Test mode")
    update_p.add_argument("--headed", action="store_true", help="Visible browser")

    args = parser.parse_args()

    if args.command == "session":
        cmd_session(args)
    elif args.command == "verify":
        cmd_verify(args)
    elif args.command == "update":
        if not args.all and not args.product:
            print("❌ Specify --all or --product")
            return
        cmd_update(args)
    elif args.command == "list":
        cmd_list(args)
    else:
        parser.print_help()
        print("\n💡 Quick start:")
        print("   1. python3 scripts/gumroad_auto_v2.py session")
        print("   2. python3 scripts/gumroad_auto_v2.py verify")
        print("   3. python3 scripts/gumroad_auto_v2.py update --all")


if __name__ == "__main__":
    main()

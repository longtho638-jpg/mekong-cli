#!/usr/bin/env python3
"""
🚀 Gumroad CLI - Interactive Session-Based Automation
======================================================

SOLVES: Browser opens/closes too fast to solve CAPTCHA

APPROACH: 3-Phase workflow with persistent browser session
1. SESSION: Open browser, login manually, save session
2. VERIFY: Test session is valid
3. UPDATE: Run headless automation using saved session

Usage:
    # Phase 1: Start login session (manual CAPTCHA solve)
    python3 scripts/gumroad_cli.py session

    # Phase 2: Verify session works
    python3 scripts/gumroad_cli.py verify

    # Phase 3: Update all products (headless)
    python3 scripts/gumroad_cli.py update --all

    # Quick dry-run test
    python3 scripts/gumroad_cli.py update --all --dry-run
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


def print_header(title: str):
    """Print formatted header."""
    print("\n" + "═" * 60)
    print(f"🚀 {title}")
    print("═" * 60)


def print_section(title: str):
    """Print section divider."""
    print(f"\n{'─' * 50}")
    print(f"📌 {title}")
    print("─" * 50)


# ============================================================
# COMMAND: session - Start interactive login session
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
        # Launch visible browser
        browser = p.chromium.launch(
            headless=False,
            slow_mo=100,  # Slow down for human visibility
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )
        page = context.new_page()

        # Navigate to login
        print("\n🌐 Opening Gumroad login page...")
        page.goto(GUMROAD_LOGIN)
        page.wait_for_load_state("networkidle")

        # Pre-fill credentials if available
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

        # Wait for user to complete login
        print("\n" + "=" * 50)
        print("🔐 COMPLETE LOGIN IN BROWSER")
        print("   Then press ENTER here when you see dashboard...")
        print("=" * 50)
        input("\n>>> Press ENTER after successful login: ")

        # Verify login success - check multiple indicators
        current_url = page.url
        page_content = page.content().lower()

        # Success indicators
        is_logged_in = any(
            [
                "products" in current_url.lower(),
                "dashboard" in current_url.lower(),
                "home" in current_url.lower(),
                "my products" in page_content,
                "analytics" in page_content,
                "new product" in page_content,
                "app.gumroad.com" in current_url and "login" not in current_url.lower(),
            ]
        )

        if not is_logged_in:
            print(f"⚠️ Could not confirm login. Current URL: {current_url[:60]}")
            print(
                "   Saving session anyway - you can verify with: python3 scripts/gumroad_cli.py verify"
            )
            # Still save - user confirmed they're logged in

        # Save cookies
        cookies = context.cookies()
        with open(COOKIES_FILE, "w") as f:
            json.dump(cookies, f, indent=2)

        # Save state info
        state = {
            "logged_in": True,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "url": current_url,
        }
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)

        print("\n✅ Session saved!")
        print(f"   📍 Cookies: {COOKIES_FILE}")
        print(f"   📍 State: {STATE_FILE}")

        browser.close()
        return True


# ============================================================
# COMMAND: verify - Test if saved session works
# ============================================================
def cmd_verify(args):
    """Verify saved session is valid."""
    print_header("VERIFY SESSION")

    if not COOKIES_FILE.exists():
        print("❌ No saved session found!")
        print("   Run: python3 scripts/gumroad_cli.py session")
        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )

        # Load cookies
        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
        context.add_cookies(cookies)
        print("   🍪 Loaded saved cookies")

        page = context.new_page()
        page.goto(GUMROAD_PRODUCTS)
        page.wait_for_load_state("networkidle")

        # Check if logged in
        if "login" in page.url.lower():
            print("❌ Session expired! Please login again.")
            print("   Run: python3 scripts/gumroad_cli.py session")
            browser.close()
            return False

        print("✅ Session valid!")
        print(f"   📍 Current URL: {page.url[:50]}...")

        # Count products if possible
        try:
            products = page.locator("[data-product-id], .product-card, .product").all()
            print(f"   📦 Found {len(products)} products on Gumroad")
        except:
            pass

        browser.close()
        return True


# ============================================================
# COMMAND: update - Headless product updates
# ============================================================
def cmd_update(args):
    """Update products using saved session (headless)."""
    print_header("UPDATE PRODUCTS")

    # Verify session exists
    if not COOKIES_FILE.exists():
        print("❌ No saved session! Run session command first.")
        return False

    products = load_products()
    dry_run = args.dry_run

    print(f"   Mode: {'DRY-RUN (no changes)' if dry_run else 'LIVE'}")
    print(f"   Products: {len(products)}")

    # Filter if specific product requested
    if args.product:
        products = [p for p in products if args.product in p.get("id", "")]
        print(f"   Filtered to: {len(products)} product(s)")

    if not products:
        print("❌ No products to process!")
        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        )

        # Load session
        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
        context.add_cookies(cookies)

        page = context.new_page()

        # Verify logged in
        page.goto(GUMROAD_PRODUCTS)
        page.wait_for_load_state("networkidle")

        if "login" in page.url.lower():
            print("❌ Session expired! Run: python3 scripts/gumroad_cli.py session")
            browser.close()
            return False

        print("   ✅ Session restored")

        # Process each product
        success = 0
        for product in products:
            if process_product(page, product, dry_run):
                success += 1

        browser.close()

    # Summary
    print_section("SUMMARY")
    print(f"✅ Processed: {success}/{len(products)} products")

    if dry_run:
        print("\n💡 This was a DRY-RUN. Run without --dry-run to apply.")

    return True


def process_product(page: Page, product: dict, dry_run: bool) -> bool:
    """Process a single product."""
    pid = product.get("id", "unknown")
    gumroad_id = product.get("gumroad_id")
    action = product.get("action", "update")

    print_section(f"Product: {pid}")
    print(f"   Action: {action.upper()}")

    if action == "create" and not gumroad_id:
        if dry_run:
            print("   🆕 [DRY-RUN] Would create new product")
            print(f"   📝 Title: {product.get('title', '')[:50]}...")
            return True

        # Navigate to create page
        page.goto(f"{GUMROAD_PRODUCTS}/new")
        time.sleep(2)
        print("   🆕 Creating new product...")
    else:
        if not gumroad_id:
            print("   ⚠️ No gumroad_id for existing product, skipping")
            return False

        edit_url = f"{GUMROAD_PRODUCTS}/{gumroad_id}/edit"
        if dry_run:
            print(f"   🔗 [DRY-RUN] Would edit: {edit_url}")
        else:
            page.goto(edit_url)
            time.sleep(2)
            print("   🔗 Editing product...")

    # Upload thumbnail
    thumbnail = product.get("thumbnail")
    if thumbnail:
        thumb_path = THUMBNAILS_DIR / thumbnail
        if thumb_path.exists():
            if dry_run:
                print(f"   📷 [DRY-RUN] Would upload: {thumbnail}")
            else:
                try:
                    file_input = page.locator('input[type="file"][accept*="image"]').first
                    if file_input:
                        file_input.set_input_files(str(thumb_path))
                        time.sleep(2)
                        print(f"   📷 Uploaded: {thumbnail}")
                except Exception as e:
                    print(f"   ⚠️ Thumbnail upload error: {e}")
        else:
            print(f"   ⚠️ Thumbnail not found: {thumbnail}")

    # Update title
    title = product.get("title", "")
    if title:
        if dry_run:
            print(f"   📝 [DRY-RUN] Title: {title[:50]}...")
        else:
            try:
                title_input = page.locator('input[name="name"], input[id*="name"]').first
                if title_input:
                    title_input.fill(title)
                    print("   📝 Updated title")
            except Exception as e:
                print(f"   ⚠️ Title error: {e}")

    # Update description
    desc = product.get("description", "")
    if desc:
        if dry_run:
            print(f"   📄 [DRY-RUN] Description: {len(desc)} chars")
        else:
            try:
                desc_area = page.locator(
                    'textarea[name="description"], div[contenteditable="true"]'
                ).first
                if desc_area:
                    try:
                        desc_area.fill(desc)
                    except:
                        desc_area.evaluate("el => el.innerText = ''")
                        desc_area.type(desc[:500])  # Type first 500 chars for speed
                    print("   📄 Updated description")
            except Exception as e:
                print(f"   ⚠️ Description error: {e}")

    # Update price
    price = product.get("price")
    if price is not None:
        price_dollars = price / 100 if price > 0 else 0
        if dry_run:
            print(f"   💰 [DRY-RUN] Price: ${price_dollars}")
        else:
            try:
                price_input = page.locator('input[name="price"], input[id*="price"]').first
                if price_input:
                    price_input.fill(str(price_dollars))
                    print(f"   💰 Set price: ${price_dollars}")
            except Exception as e:
                print(f"   ⚠️ Price error: {e}")

    # Save product
    if not dry_run:
        try:
            save_btn = page.locator(
                'button:has-text("Save"), button:has-text("Publish"), button[type="submit"]'
            ).first
            if save_btn:
                save_btn.click()
                time.sleep(2)
                print("   💾 Saved!")
        except Exception as e:
            print(f"   ⚠️ Save error: {e}")

    return True


# ============================================================
# COMMAND: list - Show products
# ============================================================
def cmd_list(args):
    """List all products from JSON."""
    print_header("PRODUCTS LIST")
    products = load_products()

    for p in products:
        status = "🔄 UPDATE" if p.get("gumroad_id") else "🆕 CREATE"
        price = p.get("price", 0) / 100
        thumb = "✅" if (THUMBNAILS_DIR / p.get("thumbnail", "")).exists() else "❌"
        print(f"  {status} {p['id']}: ${price} | Thumb: {thumb}")

    print(f"\nTotal: {len(products)} products")


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="🚀 Gumroad CLI - Interactive Session Automation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Step 1: Login (interactive, solve CAPTCHA)
  python3 scripts/gumroad_cli.py session

  # Step 2: Verify session works
  python3 scripts/gumroad_cli.py verify

  # Step 3: Update all products (headless)
  python3 scripts/gumroad_cli.py update --all

  # Dry-run test
  python3 scripts/gumroad_cli.py update --all --dry-run

  # Update single product
  python3 scripts/gumroad_cli.py update --product vibe-starter
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # session command
    session_p = subparsers.add_parser("session", help="Start login session (interactive)")

    # verify command
    verify_p = subparsers.add_parser("verify", help="Verify saved session")

    # update command
    update_p = subparsers.add_parser("update", help="Update products (headless)")
    update_p.add_argument("--all", action="store_true", help="Update all products")
    update_p.add_argument("--product", type=str, help="Update specific product")
    update_p.add_argument("--dry-run", action="store_true", help="Test mode")

    # list command
    list_p = subparsers.add_parser("list", help="List all products")

    args = parser.parse_args()

    if args.command == "session":
        cmd_session(args)
    elif args.command == "verify":
        cmd_verify(args)
    elif args.command == "update":
        if not args.all and not args.product:
            print("❌ Specify --all or --product")
            update_p.print_help()
            return
        cmd_update(args)
    elif args.command == "list":
        cmd_list(args)
    else:
        parser.print_help()
        print("\n💡 Quick start:")
        print("   1. python3 scripts/gumroad_cli.py session")
        print("   2. python3 scripts/gumroad_cli.py verify")
        print("   3. python3 scripts/gumroad_cli.py update --all")


if __name__ == "__main__":
    main()

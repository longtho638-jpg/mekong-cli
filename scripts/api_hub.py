#!/usr/bin/env python3
"""
🔌 API Hub - Unified API Client
================================
CLI interface for all external APIs.
No browser needed.

Usage:
    python3 scripts/api_hub.py gumroad list
    python3 scripts/api_hub.py gumroad publish <product_dir>
    python3 scripts/api_hub.py twitter post
    python3 scripts/api_hub.py polar balance
    python3 scripts/api_hub.py webhook test
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import requests

# ============ CONFIG ============


def load_env():
    """Load .env file."""
    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


# ============ GUMROAD ============


class GumroadAPI:
    BASE = "https://api.gumroad.com/v2"

    def __init__(self):
        load_env()
        self.token = os.environ.get("GUMROAD_ACCESS_TOKEN")

    def list_products(self):
        """List all products."""
        if not self.token:
            print("❌ GUMROAD_ACCESS_TOKEN not set")
            return

        r = requests.get(f"{self.BASE}/products", params={"access_token": self.token})
        data = r.json()

        if not data.get("success"):
            print(f"❌ Error: {data}")
            return

        print("\n📦 GUMROAD PRODUCTS")
        print("=" * 50)
        for p in data.get("products", []):
            status = "✅" if p.get("published") else "⏸️"
            print(f"  {status} {p['name']:<30} ${p.get('price', 0) / 100:.0f}")
        print("=" * 50 + "\n")

    def get_sales(self):
        """Get recent sales."""
        if not self.token:
            return

        r = requests.get(f"{self.BASE}/sales", params={"access_token": self.token})
        data = r.json()

        sales = data.get("sales", [])
        total = sum(s.get("price", 0) for s in sales) / 100

        print(f"\n💰 Sales: {len(sales)} | Total: ${total:.2f}\n")


# ============ POLAR ============


class PolarAPI:
    BASE = "https://api.polar.sh/v1"

    def __init__(self):
        load_env()
        self.token = os.environ.get("POLAR_ACCESS_TOKEN")

    def get_balance(self):
        """Get account balance."""
        if not self.token:
            print("❌ POLAR_ACCESS_TOKEN not set")
            return

        headers = {"Authorization": f"Bearer {self.token}"}
        r = requests.get(f"{self.BASE}/accounts", headers=headers)

        if r.status_code != 200:
            print(f"❌ Error: {r.status_code}")
            return

        print("\n💰 POLAR BALANCE")
        print("=" * 50)
        print(json.dumps(r.json(), indent=2)[:500])
        print("=" * 50 + "\n")


# ============ WEBHOOK ============


class WebhookClient:
    def __init__(self):
        load_env()
        self.discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
        self.slack_url = os.environ.get("SLACK_WEBHOOK_URL")

    def send_discord(self, message):
        """Send to Discord."""
        if not self.discord_url:
            print("❌ DISCORD_WEBHOOK_URL not set")
            return False

        r = requests.post(self.discord_url, json={"content": message})
        return r.status_code == 204

    def send_notification(self, title, message):
        """Send notification to all configured webhooks."""
        payload = {
            "title": title,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        }

        if self.discord_url:
            requests.post(self.discord_url, json={"content": f"**{title}**\n{message}"})
            print("✅ Discord notified")

        print(f"📢 {title}: {message}")


# ============ CLI ============


def main():
    if len(sys.argv) < 2:
        print("""
🔌 API HUB - CLI Tool

Usage:
    python3 scripts/api_hub.py gumroad list
    python3 scripts/api_hub.py gumroad sales
    python3 scripts/api_hub.py polar balance
    python3 scripts/api_hub.py webhook test "Hello!"
    python3 scripts/api_hub.py status
        """)
        return

    cmd = sys.argv[1]
    subcmd = sys.argv[2] if len(sys.argv) > 2 else None

    if cmd == "gumroad":
        api = GumroadAPI()
        if subcmd == "list":
            api.list_products()
        elif subcmd == "sales":
            api.get_sales()
        else:
            print("Usage: gumroad [list|sales]")

    elif cmd == "polar":
        api = PolarAPI()
        if subcmd == "balance":
            api.get_balance()
        else:
            print("Usage: polar [balance]")

    elif cmd == "webhook":
        wh = WebhookClient()
        if subcmd == "test":
            msg = " ".join(sys.argv[3:]) or "🏯 Test notification"
            wh.send_notification("Test", msg)
        else:
            print("Usage: webhook test [message]")

    elif cmd == "status":
        print("\n🔌 API STATUS")
        print("=" * 50)
        load_env()
        apis = {
            "Gumroad": bool(os.environ.get("GUMROAD_ACCESS_TOKEN")),
            "Polar": bool(os.environ.get("POLAR_ACCESS_TOKEN")),
            "Twitter": bool(os.environ.get("TWITTER_API_KEY")),
            "Discord": bool(os.environ.get("DISCORD_WEBHOOK_URL")),
        }
        for name, configured in apis.items():
            status = "✅" if configured else "❌"
            print(f"  {status} {name}")
        print("=" * 50 + "\n")

    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()

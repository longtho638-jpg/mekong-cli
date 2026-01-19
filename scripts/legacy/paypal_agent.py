#!/usr/bin/env python3
"""
🤖 PayPal Agent - AI-Powered Payment Operations
================================================
Uses PayPal Agent Toolkit for intelligent payment automation.

Features:
- List orders, invoices, subscriptions
- Create invoices automatically
- Track shipments
- Manage disputes

Usage:
    python3 scripts/paypal_agent.py orders
    python3 scripts/paypal_agent.py invoices
    python3 scripts/paypal_agent.py create-invoice "Client Name" 100.00
"""

import os
import sys
from datetime import datetime
from pathlib import Path

import requests


def load_env():
    """Load .env file."""
    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


class PayPalAgent:
    """AI-powered PayPal operations agent."""

    def __init__(self):
        load_env()
        self.client_id = os.environ.get("PAYPAL_CLIENT_ID")
        self.client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
        self.mode = os.environ.get("PAYPAL_MODE", "sandbox")

        if self.mode == "live":
            self.base_url = "https://api-m.paypal.com"
        else:
            self.base_url = "https://api-m.sandbox.paypal.com"

        self._access_token = None

    def _get_access_token(self):
        """Get OAuth access token."""
        if self._access_token:
            return self._access_token

        if not self.client_id or not self.client_secret:
            print("❌ PayPal credentials not configured")
            print("   Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env")
            return None

        import base64

        auth = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        response = requests.post(
            f"{self.base_url}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data="grant_type=client_credentials",
        )

        if response.status_code != 200:
            print(f"❌ Failed to get access token: {response.text}")
            return None

        self._access_token = response.json()["access_token"]
        return self._access_token

    def _api_call(self, method, endpoint, data=None):
        """Make authenticated API call."""
        token = self._get_access_token()
        if not token:
            return None

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}{endpoint}"

        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            return None

        if response.status_code not in [200, 201]:
            print(f"❌ API Error: {response.status_code} - {response.text[:200]}")
            return None

        return response.json()

    # ========== ORDERS ==========

    def list_orders(self):
        """List recent orders."""
        print("\n📦 RECENT ORDERS")
        print("=" * 60)

        # Note: PayPal doesn't have a direct list orders endpoint
        # You would typically store order IDs in your database
        print("  ℹ️  Orders are retrieved by ID. Use dashboard for full list.")
        print("  💡 Store order IDs in your database for tracking.")
        print("=" * 60 + "\n")

    def get_order(self, order_id):
        """Get order details."""
        result = self._api_call("GET", f"/v2/checkout/orders/{order_id}")
        if result:
            print(f"\n📦 Order: {order_id}")
            print(f"   Status: {result.get('status')}")
            print(
                f"   Amount: ${result.get('purchase_units', [{}])[0].get('amount', {}).get('value', 'N/A')}"
            )

    # ========== INVOICES ==========

    def list_invoices(self):
        """List invoices."""
        result = self._api_call("GET", "/v2/invoicing/invoices?page=1&page_size=10")

        print("\n📄 INVOICES")
        print("=" * 60)

        if not result:
            print("  ℹ️  No invoices found or API error")
            print("=" * 60 + "\n")
            return

        items = result.get("items", [])

        if not items:
            print("  ℹ️  No invoices yet")
        else:
            for inv in items:
                status = inv.get("status", "DRAFT")
                amount = inv.get("amount", {}).get("value", "0.00")
                recipient = (
                    inv.get("primary_recipients", [{}])[0]
                    .get("billing_info", {})
                    .get("email_address", "N/A")
                )
                emoji = "✅" if status == "PAID" else "📤" if status == "SENT" else "📝"
                print(
                    f"  {emoji} {inv.get('id', 'N/A')[:20]:<20} ${amount:<10} {status:<10} {recipient}"
                )

        print("=" * 60 + "\n")

    def create_invoice(self, recipient_email, amount, description="Services"):
        """Create a new invoice."""
        invoice_data = {
            "detail": {
                "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "invoice_date": datetime.now().strftime("%Y-%m-%d"),
                "currency_code": "USD",
                "payment_term": {"term_type": "DUE_ON_RECEIPT"},
            },
            "invoicer": {
                "email_address": os.environ.get(
                    "PAYPAL_MERCHANT_EMAIL", "merchant@example.com"
                ),
            },
            "primary_recipients": [
                {
                    "billing_info": {
                        "email_address": recipient_email,
                    }
                }
            ],
            "items": [
                {
                    "name": description,
                    "quantity": "1",
                    "unit_amount": {
                        "currency_code": "USD",
                        "value": str(amount),
                    },
                }
            ],
        }

        result = self._api_call("POST", "/v2/invoicing/invoices", invoice_data)

        if result:
            print("\n✅ Invoice Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Amount: ${amount}")
            print(f"   Recipient: {recipient_email}")
            print("   Status: DRAFT (use 'send' to email)\n")
        else:
            print("\n❌ Failed to create invoice\n")

    # ========== SUBSCRIPTIONS ==========

    def list_subscriptions(self, plan_id=None):
        """List subscriptions."""
        print("\n🔄 SUBSCRIPTIONS")
        print("=" * 60)

        if plan_id:
            result = self._api_call(
                "GET", f"/v1/billing/subscriptions?plan_id={plan_id}"
            )
            if result:
                for sub in result.get("subscriptions", []):
                    print(f"  📋 {sub.get('id')} - {sub.get('status')}")
        else:
            print("  ℹ️  Specify plan_id to list subscriptions")
            print("  💡 Create subscription plans in PayPal Dashboard first")

        print("=" * 60 + "\n")

    # ========== STATUS ==========

    def status(self):
        """Check PayPal agent status."""
        print("\n🤖 PAYPAL AGENT STATUS")
        print("=" * 60)

        # Check credentials
        if self.client_id and self.client_secret:
            print("  ✅ Credentials configured")
        else:
            print("  ❌ Credentials missing")

        # Check mode
        print(f"  🔧 Mode: {self.mode}")

        # Test authentication
        token = self._get_access_token()
        if token:
            print("  ✅ Authentication successful")
            print(f"  🔑 Token: {token[:20]}...")
        else:
            print("  ❌ Authentication failed")

        print("=" * 60)
        print("\n📚 Available Commands:")
        print("   orders        - List orders")
        print("   invoices      - List invoices")
        print("   create-invoice <email> <amount> - Create invoice")
        print("   subscriptions - List subscriptions")
        print("   status        - This status check")
        print()


def main():
    agent = PayPalAgent()

    if len(sys.argv) < 2:
        agent.status()
        return

    cmd = sys.argv[1]

    if cmd == "status":
        agent.status()
    elif cmd == "orders":
        agent.list_orders()
    elif cmd == "invoices":
        agent.list_invoices()
    elif cmd == "create-invoice":
        if len(sys.argv) < 4:
            print("Usage: create-invoice <email> <amount> [description]")
            return
        email = sys.argv[2]
        amount = float(sys.argv[3])
        desc = " ".join(sys.argv[4:]) if len(sys.argv) > 4 else "Services"
        agent.create_invoice(email, amount, desc)
    elif cmd == "subscriptions":
        plan_id = sys.argv[2] if len(sys.argv) > 2 else None
        agent.list_subscriptions(plan_id)
    else:
        print(f"Unknown command: {cmd}")
        agent.status()


if __name__ == "__main__":
    main()

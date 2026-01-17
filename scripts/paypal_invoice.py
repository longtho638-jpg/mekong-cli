#!/usr/bin/env python3
"""
💳 PAYPAL INVOICE LINKER - Generate Pay Now Links for Invoices
==============================================================
Creates PayPal payment links for invoices and tracks payment status.

Usage:
    python3 scripts/paypal_invoice.py create <invoice_id>
    python3 scripts/paypal_invoice.py check <invoice_id>
    python3 scripts/paypal_invoice.py list
"""

import base64
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import requests

# Config
INVOICES_FILE = Path.home() / ".mekong/invoices.json"
PAYPAL_ORDERS_FILE = Path.home() / ".mekong/paypal_orders.json"

# Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"


def load_env():
    """Load .env file."""
    env_file = Path.home() / "mekong-cli/.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


def get_paypal_token():
    """Get PayPal access token."""
    client_id = os.getenv("PAYPAL_CLIENT_ID")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
    mode = os.getenv("PAYPAL_MODE", "sandbox")

    if not client_id or not client_secret:
        print(f"{RED}❌ Missing PayPal credentials{RESET}")
        return None

    base_url = (
        "https://api-m.paypal.com"
        if mode == "live"
        else "https://api-m.sandbox.paypal.com"
    )

    auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    try:
        response = requests.post(
            f"{base_url}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data="grant_type=client_credentials",
            timeout=10,
        )
        if response.status_code == 200:
            return response.json().get("access_token"), base_url
    except Exception as e:
        print(f"{RED}❌ Auth error: {e}{RESET}")
    return None, None


def load_invoices():
    """Load invoices from file."""
    if INVOICES_FILE.exists():
        with open(INVOICES_FILE) as f:
            return json.load(f)
    return []


def save_invoices(invoices):
    """Save invoices to file."""
    INVOICES_FILE.parent.mkdir(exist_ok=True)
    with open(INVOICES_FILE, "w") as f:
        json.dump(invoices, f, indent=2)


def load_orders():
    """Load PayPal orders tracking."""
    if PAYPAL_ORDERS_FILE.exists():
        with open(PAYPAL_ORDERS_FILE) as f:
            return json.load(f)
    return {}


def save_orders(orders):
    """Save PayPal orders tracking."""
    PAYPAL_ORDERS_FILE.parent.mkdir(exist_ok=True)
    with open(PAYPAL_ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2)


def create_payment_link(invoice_id: str):
    """Create a PayPal payment link for an invoice."""
    load_env()

    invoices = load_invoices()
    invoice = next((i for i in invoices if i.get("id") == invoice_id), None)

    if not invoice:
        print(f"{YELLOW}⚠️ Invoice not found: {invoice_id}{RESET}")
        return None

    token, base_url = get_paypal_token()
    if not token:
        return None

    # Create PayPal order
    order_data = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": invoice_id,
                "description": invoice.get("description", "Service Payment"),
                "amount": {
                    "currency_code": "USD",
                    "value": str(invoice.get("amount", 0)),
                },
            }
        ],
        "application_context": {
            "brand_name": "Binh Pháp Venture Studio",
            "landing_page": "BILLING",
            "user_action": "PAY_NOW",
            "return_url": "https://agencyos.network/success",
            "cancel_url": "https://agencyos.network/cancel",
        },
    }

    try:
        response = requests.post(
            f"{base_url}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=order_data,
            timeout=15,
        )

        if response.status_code == 201:
            order = response.json()
            order_id = order.get("id")

            # Find approval link
            approval_link = None
            for link in order.get("links", []):
                if link.get("rel") == "approve":
                    approval_link = link.get("href")
                    break

            # Save order tracking
            orders = load_orders()
            orders[invoice_id] = {
                "order_id": order_id,
                "status": order.get("status"),
                "approval_link": approval_link,
                "created": datetime.now().isoformat(),
            }
            save_orders(orders)

            print(f"\n{GREEN}✅ Payment Link Created!{RESET}")
            print(f"📋 Invoice: {invoice_id}")
            print(f"💵 Amount: ${invoice.get('amount')}")
            print(f"🆔 PayPal Order: {order_id}")
            print(f"\n{CYAN}🔗 Pay Now Link:{RESET}")
            print(f"   {approval_link}")
            print(f"\n{YELLOW}Send this link to the client!{RESET}")

            return approval_link
        else:
            print(f"{RED}❌ Failed to create order: {response.text}{RESET}")
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
    return None


def check_payment_status(invoice_id: str):
    """Check if a payment has been made."""
    load_env()

    orders = load_orders()
    order_info = orders.get(invoice_id)

    if not order_info:
        print(f"{YELLOW}⚠️ No payment link found for: {invoice_id}{RESET}")
        return None

    token, base_url = get_paypal_token()
    if not token:
        return None

    order_id = order_info.get("order_id")

    try:
        response = requests.get(
            f"{base_url}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )

        if response.status_code == 200:
            order = response.json()
            status = order.get("status")

            print(f"\n💳 PAYMENT STATUS: {invoice_id}")
            print("=" * 40)
            print(f"   Order ID: {order_id}")
            print(f"   Status: {status}")

            if status == "COMPLETED":
                print(f"   {GREEN}✅ PAID!{RESET}")

                # Update invoice status
                invoices = load_invoices()
                for inv in invoices:
                    if inv.get("id") == invoice_id:
                        inv["status"] = "paid"
                        inv["paid_at"] = datetime.now().isoformat()
                        break
                save_invoices(invoices)
                print("   📝 Invoice marked as PAID")

            elif status == "APPROVED":
                print(f"   {CYAN}⏳ Customer approved, awaiting capture{RESET}")
            else:
                print(f"   {YELLOW}⏳ Waiting for payment{RESET}")

            return status
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
    return None


def list_pending():
    """List all pending invoices without payment links."""
    invoices = load_invoices()
    orders = load_orders()

    pending = [i for i in invoices if i.get("status") == "pending"]

    print(f"\n📋 PENDING INVOICES ({len(pending)})")
    print("=" * 50)

    for inv in pending:
        inv_id = inv.get("id", "N/A")
        has_link = inv_id in orders
        link_status = f"{GREEN}✓ Link{RESET}" if has_link else f"{YELLOW}No link{RESET}"

        print(f"  {inv_id}: ${inv.get('amount', 0)} - {inv.get('client', 'N/A')}")
        print(f"          {link_status}")

    if not pending:
        print("  No pending invoices!")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        list_pending()
        return

    cmd = sys.argv[1].lower()

    if cmd == "create" and len(sys.argv) > 2:
        create_payment_link(sys.argv[2])
    elif cmd == "check" and len(sys.argv) > 2:
        check_payment_status(sys.argv[2])
    elif cmd == "list":
        list_pending()
    else:
        print(__doc__)


if __name__ == "__main__":
    main()

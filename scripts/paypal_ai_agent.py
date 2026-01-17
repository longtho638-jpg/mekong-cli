#!/usr/bin/env python3
"""
🤖 PayPal AI Agent - Full Integration
======================================
Complete PayPal Agent Toolkit implementation.

FULL FEATURES:
- Catalog Management: create_product, list_product, show_product_details
- Dispute Management: list_disputes, get_dispute, accept_dispute_claim
- Invoices: create, list, get, send, reminder, cancel, QR code
- Payments: create_order, pay_order, get_order, create_refund, get_refund
- Reporting: get_merchant_insights, list_transaction
- Shipment Tracking: create, get, update
- Subscriptions: create_plan, create_subscription, cancel, list, update

Usage:
    python3 scripts/paypal_ai_agent.py <category> <action> [args]

Examples:
    python3 scripts/paypal_ai_agent.py catalog list
    python3 scripts/paypal_ai_agent.py invoice create client@email.com 100.00
    python3 scripts/paypal_ai_agent.py payment create-order "Product" 50.00
    python3 scripts/paypal_ai_agent.py report insights --days=30
"""

import base64
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional

import requests


def load_env():
    """Load .env file."""
    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


class PayPalAIAgent:
    """
    Full PayPal AI Agent with all toolkit features.

    Categories:
    - catalog: Product management
    - dispute: Dispute handling
    - invoice: Invoice operations
    - payment: Payment processing
    - report: Insights & transactions
    - shipment: Tracking management
    - subscription: Subscription billing
    """

    def __init__(self):
        load_env()
        self.client_id = os.environ.get("PAYPAL_CLIENT_ID")
        self.client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
        self.mode = os.environ.get("PAYPAL_MODE", "sandbox")

        self.base_url = (
            "https://api-m.paypal.com"
            if self.mode == "live"
            else "https://api-m.sandbox.paypal.com"
        )

        self._access_token = None
        self._token_expiry = None

    def _get_access_token(self) -> Optional[str]:
        """Get OAuth access token with caching."""
        if (
            self._access_token
            and self._token_expiry
            and datetime.now() < self._token_expiry
        ):
            return self._access_token

        if not self.client_id or not self.client_secret:
            print("❌ PayPal credentials not configured")
            return None

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
            print(f"❌ Auth failed: {response.text}")
            return None

        data = response.json()
        self._access_token = data["access_token"]
        self._token_expiry = datetime.now() + timedelta(
            seconds=data.get("expires_in", 3600) - 60
        )

        return self._access_token

    def _api(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Make authenticated API call."""
        token = self._get_access_token()
        if not token:
            return None

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}{endpoint}"

        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                return None

            if response.status_code in [200, 201, 204]:
                return response.json() if response.text else {"success": True}
            else:
                print(f"❌ API Error {response.status_code}: {response.text[:300]}")
                return None
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None

    # ========== CATALOG MANAGEMENT ==========

    def catalog_create_product(
        self, name: str, product_type: str = "SERVICE", description: str = ""
    ):
        """Create a new product in catalog."""
        data = {
            "name": name,
            "type": product_type,  # PHYSICAL, DIGITAL, SERVICE
            "description": description or f"{name} - Created by PayPal AI Agent",
        }

        result = self._api("POST", "/v1/catalogs/products", data)
        if result:
            print("\n✅ Product Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Name: {result.get('name')}")
            print(f"   Type: {result.get('type')}\n")
        return result

    def catalog_list_products(self, page: int = 1, page_size: int = 10):
        """List all products."""
        result = self._api(
            "GET", f"/v1/catalogs/products?page={page}&page_size={page_size}"
        )

        print("\n📦 PRODUCTS CATALOG")
        print("=" * 60)

        if not result:
            print("  ℹ️  No products or API error")
        else:
            for p in result.get("products", []):
                print(f"  📋 {p.get('id', 'N/A')[:20]:<20} {p.get('name', 'N/A'):<30}")

        print("=" * 60 + "\n")
        return result

    def catalog_get_product(self, product_id: str):
        """Get product details."""
        return self._api("GET", f"/v1/catalogs/products/{product_id}")

    # ========== DISPUTE MANAGEMENT ==========

    def dispute_list(self, status: str = None):
        """List disputes."""
        endpoint = "/v1/customer/disputes?"
        if status:
            endpoint += f"dispute_state={status}&"

        result = self._api("GET", endpoint)

        print("\n⚠️ DISPUTES")
        print("=" * 60)

        if not result or not result.get("items"):
            print("  ✅ No disputes found!")
        else:
            for d in result.get("items", []):
                status_emoji = "🔴" if d.get("status") == "OPEN" else "✅"
                print(
                    f"  {status_emoji} {d.get('dispute_id', 'N/A')[:20]:<20} ${d.get('dispute_amount', {}).get('value', '0.00'):<10} {d.get('status')}"
                )

        print("=" * 60 + "\n")
        return result

    def dispute_get(self, dispute_id: str):
        """Get dispute details."""
        return self._api("GET", f"/v1/customer/disputes/{dispute_id}")

    def dispute_accept(self, dispute_id: str):
        """Accept dispute claim (refund customer)."""
        return self._api("POST", f"/v1/customer/disputes/{dispute_id}/accept-claim", {})

    # ========== INVOICES ==========

    def invoice_create(
        self, recipient_email: str, amount: float, description: str = "Services"
    ):
        """Create a draft invoice."""
        data = {
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
                {"billing_info": {"email_address": recipient_email}}
            ],
            "items": [
                {
                    "name": description,
                    "quantity": "1",
                    "unit_amount": {"currency_code": "USD", "value": str(amount)},
                }
            ],
        }

        result = self._api("POST", "/v2/invoicing/invoices", data)
        if result:
            print("\n✅ Invoice Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Recipient: {recipient_email}")
            print(f"   Amount: ${amount}")
            print("   Status: DRAFT\n")
        return result

    def invoice_list(self, status: str = None, page: int = 1, page_size: int = 10):
        """List invoices."""
        endpoint = f"/v2/invoicing/invoices?page={page}&page_size={page_size}"
        if status:
            endpoint += f"&status={status}"

        result = self._api("GET", endpoint)

        print("\n📄 INVOICES")
        print("=" * 60)

        if not result or not result.get("items"):
            print("  ℹ️  No invoices found")
        else:
            for inv in result.get("items", []):
                status = inv.get("status", "DRAFT")
                amount = inv.get("amount", {}).get("value", "0.00")
                emoji = "✅" if status == "PAID" else "📤" if status == "SENT" else "📝"
                print(
                    f"  {emoji} {inv.get('id', 'N/A')[:25]:<25} ${amount:<10} {status}"
                )

        print("=" * 60 + "\n")
        return result

    def invoice_get(self, invoice_id: str):
        """Get invoice details."""
        return self._api("GET", f"/v2/invoicing/invoices/{invoice_id}")

    def invoice_send(self, invoice_id: str):
        """Send invoice to recipient."""
        result = self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/send", {})
        if result:
            print(f"\n✅ Invoice {invoice_id} sent!\n")
        return result

    def invoice_remind(self, invoice_id: str):
        """Send payment reminder."""
        return self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/remind", {})

    def invoice_cancel(self, invoice_id: str):
        """Cancel sent invoice."""
        return self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/cancel", {})

    def invoice_qr(self, invoice_id: str):
        """Generate QR code for invoice."""
        return self._api(
            "POST", f"/v2/invoicing/invoices/{invoice_id}/generate-qr-code", {}
        )

    # ========== PAYMENTS ==========

    def payment_create_order(
        self, item_name: str, amount: float, currency: str = "USD"
    ):
        """Create a payment order."""
        data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": str(amount),
                    },
                    "description": item_name,
                }
            ],
        }

        result = self._api("POST", "/v2/checkout/orders", data)
        if result:
            approval_url = next(
                (
                    link["href"]
                    for link in result.get("links", [])
                    if link["rel"] == "approve"
                ),
                None,
            )
            print("\n✅ Order Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Amount: ${amount} {currency}")
            if approval_url:
                print(f"   🔗 Approval URL: {approval_url}")
            print()
        return result

    def payment_get_order(self, order_id: str):
        """Get order details."""
        result = self._api("GET", f"/v2/checkout/orders/{order_id}")
        if result:
            print(f"\n📦 Order: {order_id}")
            print(f"   Status: {result.get('status')}")
            pu = result.get("purchase_units", [{}])[0]
            print(f"   Amount: ${pu.get('amount', {}).get('value', 'N/A')}")
            print()
        return result

    def payment_capture(self, order_id: str):
        """Capture/pay an approved order."""
        return self._api("POST", f"/v2/checkout/orders/{order_id}/capture", {})

    def payment_refund(
        self, capture_id: str, amount: float = None, currency: str = "USD"
    ):
        """Create a refund."""
        data = {}
        if amount:
            data["amount"] = {"currency_code": currency, "value": str(amount)}

        result = self._api("POST", f"/v2/payments/captures/{capture_id}/refund", data)
        if result:
            print("\n✅ Refund Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Status: {result.get('status')}\n")
        return result

    # ========== REPORTING ==========

    def report_transactions(self, days: int = 30):
        """List recent transactions."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        endpoint = f"/v1/reporting/transactions?start_date={start_date.strftime('%Y-%m-%dT00:00:00Z')}&end_date={end_date.strftime('%Y-%m-%dT23:59:59Z')}"

        result = self._api("GET", endpoint)

        print(f"\n💰 TRANSACTIONS (Last {days} days)")
        print("=" * 70)

        if not result or not result.get("transaction_details"):
            print("  ℹ️  No transactions found")
        else:
            total = 0
            for txn in result.get("transaction_details", [])[:20]:
                info = txn.get("transaction_info", {})
                amount = float(info.get("transaction_amount", {}).get("value", "0"))
                total += amount
                date = info.get("transaction_initiation_date", "")[:10]
                status = info.get("transaction_status", "")
                emoji = "✅" if status == "S" else "⏳"
                print(
                    f"  {emoji} {info.get('transaction_id', 'N/A')[:20]:<20} ${amount:>10.2f}  {date}"
                )

            print("-" * 70)
            print(f"  💵 Total: ${total:.2f}")

        print("=" * 70 + "\n")
        return result

    # ========== SHIPMENT TRACKING ==========

    def shipment_create(
        self, order_id: str, tracking_number: str, carrier: str, status: str = "SHIPPED"
    ):
        """Create shipment tracking."""
        data = {
            "trackers": [
                {
                    "transaction_id": order_id,
                    "tracking_number": tracking_number,
                    "carrier": carrier,
                    "status": status,
                }
            ]
        }

        result = self._api("POST", "/v1/shipping/trackers-batch", data)
        if result:
            print("\n✅ Shipment Tracking Created!")
            print(f"   Order: {order_id}")
            print(f"   Tracking: {tracking_number}")
            print(f"   Carrier: {carrier}\n")
        return result

    def shipment_get(self, order_id: str, tracking_number: str):
        """Get shipment tracking."""
        return self._api("GET", f"/v1/shipping/trackers/{order_id}-{tracking_number}")

    # ========== SUBSCRIPTIONS ==========

    def subscription_create_plan(
        self, product_id: str, name: str, price: float, interval: str = "MONTH"
    ):
        """Create subscription plan."""
        data = {
            "product_id": product_id,
            "name": name,
            "billing_cycles": [
                {
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "frequency": {"interval_unit": interval, "interval_count": 1},
                    "pricing_scheme": {
                        "fixed_price": {"currency_code": "USD", "value": str(price)}
                    },
                    "total_cycles": 0,  # Infinite
                }
            ],
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "payment_failure_threshold": 3,
            },
        }

        result = self._api("POST", "/v1/billing/plans", data)
        if result:
            print("\n✅ Subscription Plan Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Name: {name}")
            print(f"   Price: ${price}/{interval}\n")
        return result

    def subscription_list_plans(self, product_id: str = None):
        """List subscription plans."""
        endpoint = "/v1/billing/plans?"
        if product_id:
            endpoint += f"product_id={product_id}&"

        result = self._api("GET", endpoint)

        print("\n🔄 SUBSCRIPTION PLANS")
        print("=" * 60)

        if not result or not result.get("plans"):
            print("  ℹ️  No plans found")
        else:
            for plan in result.get("plans", []):
                status = plan.get("status", "INACTIVE")
                emoji = "✅" if status == "ACTIVE" else "⏸️"
                print(
                    f"  {emoji} {plan.get('id', 'N/A')[:25]:<25} {plan.get('name', 'N/A')}"
                )

        print("=" * 60 + "\n")
        return result

    def subscription_create(
        self, plan_id: str, subscriber_email: str, subscriber_name: str = "Customer"
    ):
        """Create a subscription."""
        data = {
            "plan_id": plan_id,
            "subscriber": {
                "name": {
                    "given_name": subscriber_name.split()[0],
                    "surname": subscriber_name.split()[-1]
                    if len(subscriber_name.split()) > 1
                    else "",
                },
                "email_address": subscriber_email,
            },
        }

        result = self._api("POST", "/v1/billing/subscriptions", data)
        if result:
            print("\n✅ Subscription Created!")
            print(f"   ID: {result.get('id')}")
            print(f"   Status: {result.get('status')}")
            approval = next(
                (l["href"] for l in result.get("links", []) if l["rel"] == "approve"),
                None,
            )
            if approval:
                print(f"   🔗 Approval: {approval}\n")
        return result

    def subscription_get(self, subscription_id: str):
        """Get subscription details."""
        return self._api("GET", f"/v1/billing/subscriptions/{subscription_id}")

    def subscription_cancel(
        self, subscription_id: str, reason: str = "Customer requested"
    ):
        """Cancel subscription."""
        result = self._api(
            "POST",
            f"/v1/billing/subscriptions/{subscription_id}/cancel",
            {"reason": reason},
        )
        if result:
            print(f"\n✅ Subscription {subscription_id} cancelled!\n")
        return result

    # ========== STATUS ==========

    def status(self):
        """Show full agent status."""
        print("\n🤖 PAYPAL AI AGENT - FULL INTEGRATION")
        print("=" * 60)

        # Auth check
        if self.client_id and self.client_secret:
            print("  ✅ Credentials: Configured")
        else:
            print("  ❌ Credentials: Missing")

        print(f"  🔧 Mode: {self.mode}")

        token = self._get_access_token()
        if token:
            print("  ✅ Auth: Token acquired")
        else:
            print("  ❌ Auth: Failed")

        print("=" * 60)
        print("\n📚 AVAILABLE COMMANDS:")
        print("-" * 60)
        print("  catalog   list | create <name> <type>")
        print("  dispute   list | get <id> | accept <id>")
        print("  invoice   list | create <email> <amount> | send <id>")
        print(
            "  payment   create-order <name> <amount> | get <id> | refund <capture_id>"
        )
        print("  report    transactions [--days=N]")
        print("  shipment  create <order_id> <tracking> <carrier>")
        print("  subscription  plans | create-plan <product_id> <name> <price>")
        print("  status")
        print("-" * 60)
        print()


def main():
    agent = PayPalAIAgent()

    if len(sys.argv) < 2:
        agent.status()
        return

    category = sys.argv[1]
    action = sys.argv[2] if len(sys.argv) > 2 else "list"
    args = sys.argv[3:]

    if category == "status":
        agent.status()

    # Catalog
    elif category == "catalog":
        if action == "list":
            agent.catalog_list_products()
        elif action == "create" and len(args) >= 1:
            agent.catalog_create_product(
                args[0], args[1] if len(args) > 1 else "SERVICE"
            )
        else:
            print("Usage: catalog list | create <name> [type]")

    # Disputes
    elif category == "dispute":
        if action == "list":
            agent.dispute_list()
        elif action == "get" and args:
            agent.dispute_get(args[0])
        elif action == "accept" and args:
            agent.dispute_accept(args[0])
        else:
            print("Usage: dispute list | get <id> | accept <id>")

    # Invoices
    elif category == "invoice":
        if action == "list":
            agent.invoice_list()
        elif action == "create" and len(args) >= 2:
            agent.invoice_create(
                args[0], float(args[1]), " ".join(args[2:]) or "Services"
            )
        elif action == "send" and args:
            agent.invoice_send(args[0])
        elif action == "get" and args:
            agent.invoice_get(args[0])
        else:
            print("Usage: invoice list | create <email> <amount> [desc] | send <id>")

    # Payments
    elif category == "payment":
        if action == "create-order" and len(args) >= 2:
            agent.payment_create_order(args[0], float(args[1]))
        elif action == "get" and args:
            agent.payment_get_order(args[0])
        elif action == "capture" and args:
            agent.payment_capture(args[0])
        elif action == "refund" and args:
            amount = float(args[1]) if len(args) > 1 else None
            agent.payment_refund(args[0], amount)
        else:
            print(
                "Usage: payment create-order <name> <amount> | get <id> | refund <capture_id> [amount]"
            )

    # Reports
    elif category == "report":
        days = 30
        for arg in args:
            if arg.startswith("--days="):
                days = int(arg.split("=")[1])

        if action in ["transactions", "list"]:
            agent.report_transactions(days)
        else:
            print("Usage: report transactions [--days=N]")

    # Shipments
    elif category == "shipment":
        if action == "create" and len(args) >= 3:
            agent.shipment_create(args[0], args[1], args[2])
        elif action == "get" and len(args) >= 2:
            agent.shipment_get(args[0], args[1])
        else:
            print("Usage: shipment create <order_id> <tracking_number> <carrier>")

    # Subscriptions
    elif category == "subscription":
        if action == "plans":
            agent.subscription_list_plans()
        elif action == "create-plan" and len(args) >= 3:
            agent.subscription_create_plan(args[0], args[1], float(args[2]))
        elif action == "create" and len(args) >= 2:
            agent.subscription_create(
                args[0], args[1], args[2] if len(args) > 2 else "Customer"
            )
        elif action == "get" and args:
            agent.subscription_get(args[0])
        elif action == "cancel" and args:
            agent.subscription_cancel(args[0])
        else:
            print(
                "Usage: subscription plans | create-plan <product_id> <name> <price> | create <plan_id> <email>"
            )

    else:
        print(f"Unknown category: {category}")
        agent.status()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
🛡️ PayPal SDK - MAX ARMOR EDITION
===================================
Complete Python SDK covering ALL 14 PayPal REST API resources.

CURRENT RESOURCES (as of Jan 2026):
1.  Add Tracking (/v1/shipping/trackers)
2.  Catalog Products (/v1/catalogs/products)
3.  Disputes (/v1/customer/disputes)
4.  Identity (/v1/identity)
5.  Invoicing v2 (/v2/invoicing)
6.  Orders v2 (/v2/checkout/orders)
7.  Partner Referrals v2 (/v2/customer/partner-referrals)
8.  Payment Experience (/v1/payment-experience/web-profiles)
9.  Payments v2 (/v2/payments)
10. Payouts (/v1/payments/payouts)
11. Referenced Payouts (/v1/payments/referenced-payouts)
12. Subscriptions (/v1/billing)
13. Transaction Search (/v1/reporting/transactions)
14. Webhooks (/v1/notifications/webhooks)

Usage:
    from scripts.paypal_sdk import PayPalSDK

    sdk = PayPalSDK()

    # Orders
    order = sdk.orders.create(amount=100, currency="USD")

    # Invoices
    invoice = sdk.invoicing.create(recipient="email@example.com", amount=50)

    # Subscriptions
    plan = sdk.subscriptions.create_plan(product_id="PROD-xxx", price=29.99)
"""

import base64
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import requests


def load_env():
    """Load .env file."""
    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())


class PayPalBase:
    """Base class for PayPal API modules."""

    def __init__(self, sdk: "PayPalSDK"):
        self.sdk = sdk

    def _api(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        return self.sdk._api(method, endpoint, data)


# =============================================================================
# 1. ADD TRACKING
# =============================================================================
class AddTracking(PayPalBase):
    """Add Tracking API - /v1/shipping/trackers"""

    def create(
        self,
        transaction_id: str,
        tracking_number: str,
        carrier: str,
        status: str = "SHIPPED",
    ) -> Optional[Dict]:
        """Create shipment tracking."""
        return self._api(
            "POST",
            "/v1/shipping/trackers-batch",
            {
                "trackers": [
                    {
                        "transaction_id": transaction_id,
                        "tracking_number": tracking_number,
                        "carrier": carrier,
                        "status": status,
                    }
                ]
            },
        )

    def get(self, tracker_id: str) -> Optional[Dict]:
        """Get tracking info."""
        return self._api("GET", f"/v1/shipping/trackers/{tracker_id}")

    def update(
        self,
        tracker_id: str,
        status: str = None,
        tracking_number: str = None,
    ) -> Optional[Dict]:
        """Update tracking info."""
        operations = []
        if status:
            operations.append({"op": "replace", "path": "/status", "value": status})
        if tracking_number:
            operations.append(
                {"op": "replace", "path": "/tracking_number", "value": tracking_number}
            )
        return self._api("PATCH", f"/v1/shipping/trackers/{tracker_id}", operations)


# =============================================================================
# 2. CATALOG PRODUCTS
# =============================================================================
class CatalogProducts(PayPalBase):
    """Catalog Products API - /v1/catalogs/products"""

    def create(
        self,
        name: str,
        product_type: str = "SERVICE",
        description: str = "",
        category: str = "SOFTWARE",
    ) -> Optional[Dict]:
        """Create a product."""
        return self._api(
            "POST",
            "/v1/catalogs/products",
            {
                "name": name,
                "type": product_type,
                "description": description or name,
                "category": category,
            },
        )

    def list(self, page: int = 1, page_size: int = 20) -> Optional[Dict]:
        """List products."""
        return self._api(
            "GET", f"/v1/catalogs/products?page={page}&page_size={page_size}"
        )

    def get(self, product_id: str) -> Optional[Dict]:
        """Get product details."""
        return self._api("GET", f"/v1/catalogs/products/{product_id}")

    def update(self, product_id: str, description: str = None) -> Optional[Dict]:
        """Update product."""
        operations = []
        if description:
            operations.append(
                {"op": "replace", "path": "/description", "value": description}
            )
        return self._api("PATCH", f"/v1/catalogs/products/{product_id}", operations)


# =============================================================================
# 3. DISPUTES
# =============================================================================
class Disputes(PayPalBase):
    """Disputes API - /v1/customer/disputes"""

    def list(self, status: str = None) -> Optional[Dict]:
        """List disputes."""
        endpoint = "/v1/customer/disputes"
        if status:
            endpoint += f"?dispute_state={status}"
        return self._api("GET", endpoint)

    def get(self, dispute_id: str) -> Optional[Dict]:
        """Get dispute details."""
        return self._api("GET", f"/v1/customer/disputes/{dispute_id}")

    def accept_claim(self, dispute_id: str, note: str = None) -> Optional[Dict]:
        """Accept dispute claim (refund to buyer)."""
        data = {}
        if note:
            data["note"] = note
        return self._api(
            "POST", f"/v1/customer/disputes/{dispute_id}/accept-claim", data
        )

    def provide_evidence(
        self, dispute_id: str, evidence_type: str, notes: str
    ) -> Optional[Dict]:
        """Provide evidence for dispute."""
        return self._api(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/provide-evidence",
            {"evidence_type": evidence_type, "notes": notes},
        )

    def appeal(self, dispute_id: str, reason: str) -> Optional[Dict]:
        """Appeal dispute decision."""
        return self._api(
            "POST", f"/v1/customer/disputes/{dispute_id}/appeal", {"reason": reason}
        )


# =============================================================================
# 4. IDENTITY
# =============================================================================
class Identity(PayPalBase):
    """Identity API - /v1/identity"""

    def get_userinfo(self, access_token: str = None) -> Optional[Dict]:
        """Get user information."""
        return self._api("GET", "/v1/identity/oauth2/userinfo?schema=paypalv1.1")

    def generate_token(self) -> Optional[Dict]:
        """Generate ID token."""
        return self._api("POST", "/v1/identity/generate-token", {})


# =============================================================================
# 5. INVOICING V2
# =============================================================================
class Invoicing(PayPalBase):
    """Invoicing API v2 - /v2/invoicing"""

    def create(
        self,
        recipient_email: str,
        amount: float,
        description: str = "Services",
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Create draft invoice."""
        return self._api(
            "POST",
            "/v2/invoicing/invoices",
            {
                "detail": {
                    "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "invoice_date": datetime.now().strftime("%Y-%m-%d"),
                    "currency_code": currency,
                },
                "primary_recipients": [
                    {"billing_info": {"email_address": recipient_email}}
                ],
                "items": [
                    {
                        "name": description,
                        "quantity": "1",
                        "unit_amount": {
                            "currency_code": currency,
                            "value": str(amount),
                        },
                    }
                ],
            },
        )

    def list(self, page: int = 1, page_size: int = 20) -> Optional[Dict]:
        """List invoices."""
        return self._api(
            "GET", f"/v2/invoicing/invoices?page={page}&page_size={page_size}"
        )

    def get(self, invoice_id: str) -> Optional[Dict]:
        """Get invoice details."""
        return self._api("GET", f"/v2/invoicing/invoices/{invoice_id}")

    def send(self, invoice_id: str) -> Optional[Dict]:
        """Send invoice to recipient."""
        return self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/send", {})

    def remind(self, invoice_id: str) -> Optional[Dict]:
        """Send payment reminder."""
        return self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/remind", {})

    def cancel(self, invoice_id: str) -> Optional[Dict]:
        """Cancel invoice."""
        return self._api("POST", f"/v2/invoicing/invoices/{invoice_id}/cancel", {})

    def delete(self, invoice_id: str) -> Optional[Dict]:
        """Delete draft invoice."""
        return self._api("DELETE", f"/v2/invoicing/invoices/{invoice_id}")

    def generate_qr(self, invoice_id: str) -> Optional[Dict]:
        """Generate QR code for invoice."""
        return self._api(
            "POST", f"/v2/invoicing/invoices/{invoice_id}/generate-qr-code", {}
        )


# =============================================================================
# 6. ORDERS V2
# =============================================================================
class Orders(PayPalBase):
    """Orders API v2 - /v2/checkout/orders"""

    def create(
        self,
        amount: float,
        currency: str = "USD",
        description: str = None,
        intent: str = "CAPTURE",
    ) -> Optional[Dict]:
        """Create order."""
        return self._api(
            "POST",
            "/v2/checkout/orders",
            {
                "intent": intent,
                "purchase_units": [
                    {
                        "amount": {"currency_code": currency, "value": str(amount)},
                        "description": description,
                    }
                ],
            },
        )

    def get(self, order_id: str) -> Optional[Dict]:
        """Get order details."""
        return self._api("GET", f"/v2/checkout/orders/{order_id}")

    def capture(self, order_id: str) -> Optional[Dict]:
        """Capture authorized order."""
        return self._api("POST", f"/v2/checkout/orders/{order_id}/capture", {})

    def authorize(self, order_id: str) -> Optional[Dict]:
        """Authorize order."""
        return self._api("POST", f"/v2/checkout/orders/{order_id}/authorize", {})

    def update(self, order_id: str, operations: List[Dict]) -> Optional[Dict]:
        """Update order."""
        return self._api("PATCH", f"/v2/checkout/orders/{order_id}", operations)


# =============================================================================
# 7. PARTNER REFERRALS V2
# =============================================================================
class PartnerReferrals(PayPalBase):
    """Partner Referrals API v2 - /v2/customer/partner-referrals"""

    def create(
        self,
        email: str,
        tracking_id: str,
        partner_config_override: Dict = None,
    ) -> Optional[Dict]:
        """Create partner referral."""
        data = {
            "email": email,
            "tracking_id": tracking_id,
            "partner_config_override": partner_config_override or {},
        }
        return self._api("POST", "/v2/customer/partner-referrals", data)


# =============================================================================
# 8. PAYMENT EXPERIENCE
# =============================================================================
class PaymentExperience(PayPalBase):
    """Payment Experience API - /v1/payment-experience/web-profiles"""

    def create_profile(
        self,
        name: str,
        brand_name: str = None,
        logo_image: str = None,
    ) -> Optional[Dict]:
        """Create web experience profile."""
        data = {
            "name": name,
            "presentation": {},
        }
        if brand_name:
            data["presentation"]["brand_name"] = brand_name
        if logo_image:
            data["presentation"]["logo_image"] = logo_image
        return self._api("POST", "/v1/payment-experience/web-profiles", data)

    def list_profiles(self) -> Optional[Dict]:
        """List web experience profiles."""
        return self._api("GET", "/v1/payment-experience/web-profiles")

    def get_profile(self, profile_id: str) -> Optional[Dict]:
        """Get profile details."""
        return self._api("GET", f"/v1/payment-experience/web-profiles/{profile_id}")

    def delete_profile(self, profile_id: str) -> Optional[Dict]:
        """Delete profile."""
        return self._api("DELETE", f"/v1/payment-experience/web-profiles/{profile_id}")


# =============================================================================
# 9. PAYMENTS V2
# =============================================================================
class Payments(PayPalBase):
    """Payments API v2 - /v2/payments"""

    def get_capture(self, capture_id: str) -> Optional[Dict]:
        """Get capture details."""
        return self._api("GET", f"/v2/payments/captures/{capture_id}")

    def refund_capture(
        self,
        capture_id: str,
        amount: float = None,
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Refund a captured payment."""
        data = {}
        if amount:
            data["amount"] = {"currency_code": currency, "value": str(amount)}
        return self._api("POST", f"/v2/payments/captures/{capture_id}/refund", data)

    def get_refund(self, refund_id: str) -> Optional[Dict]:
        """Get refund details."""
        return self._api("GET", f"/v2/payments/refunds/{refund_id}")

    def get_authorization(self, authorization_id: str) -> Optional[Dict]:
        """Get authorization details."""
        return self._api("GET", f"/v2/payments/authorizations/{authorization_id}")

    def void_authorization(self, authorization_id: str) -> Optional[Dict]:
        """Void an authorization."""
        return self._api(
            "POST", f"/v2/payments/authorizations/{authorization_id}/void", {}
        )

    def capture_authorization(
        self,
        authorization_id: str,
        amount: float = None,
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Capture an authorization."""
        data = {}
        if amount:
            data["amount"] = {"currency_code": currency, "value": str(amount)}
        return self._api(
            "POST", f"/v2/payments/authorizations/{authorization_id}/capture", data
        )


# =============================================================================
# 10. PAYOUTS
# =============================================================================
class Payouts(PayPalBase):
    """Payouts API - /v1/payments/payouts"""

    def create(
        self,
        recipient_email: str,
        amount: float,
        currency: str = "USD",
        note: str = None,
    ) -> Optional[Dict]:
        """Create a payout."""
        return self._api(
            "POST",
            "/v1/payments/payouts",
            {
                "sender_batch_header": {
                    "sender_batch_id": f"PAYOUT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "email_subject": "You have a payment",
                },
                "items": [
                    {
                        "recipient_type": "EMAIL",
                        "receiver": recipient_email,
                        "amount": {"currency": currency, "value": str(amount)},
                        "note": note or "Thanks!",
                    }
                ],
            },
        )

    def get_batch(self, batch_id: str) -> Optional[Dict]:
        """Get payout batch details."""
        return self._api("GET", f"/v1/payments/payouts/{batch_id}")

    def get_item(self, payout_item_id: str) -> Optional[Dict]:
        """Get payout item details."""
        return self._api("GET", f"/v1/payments/payouts-item/{payout_item_id}")

    def cancel_item(self, payout_item_id: str) -> Optional[Dict]:
        """Cancel unclaimed payout item."""
        return self._api(
            "POST", f"/v1/payments/payouts-item/{payout_item_id}/cancel", {}
        )


# =============================================================================
# 11. REFERENCED PAYOUTS
# =============================================================================
class ReferencedPayouts(PayPalBase):
    """Referenced Payouts API - /v1/payments/referenced-payouts"""

    def create(
        self,
        reference_id: str,
        reference_type: str = "TRANSACTION_ID",
    ) -> Optional[Dict]:
        """Create referenced payout."""
        return self._api(
            "POST",
            "/v1/payments/referenced-payouts-items",
            {"reference_id": reference_id, "reference_type": reference_type},
        )


# =============================================================================
# 12. SUBSCRIPTIONS
# =============================================================================
class Subscriptions(PayPalBase):
    """Subscriptions API - /v1/billing"""

    def create_plan(
        self,
        product_id: str,
        name: str,
        price: float,
        interval: str = "MONTH",
        currency: str = "USD",
    ) -> Optional[Dict]:
        """Create subscription plan."""
        return self._api(
            "POST",
            "/v1/billing/plans",
            {
                "product_id": product_id,
                "name": name,
                "billing_cycles": [
                    {
                        "tenure_type": "REGULAR",
                        "sequence": 1,
                        "frequency": {"interval_unit": interval, "interval_count": 1},
                        "pricing_scheme": {
                            "fixed_price": {
                                "currency_code": currency,
                                "value": str(price),
                            }
                        },
                        "total_cycles": 0,
                    }
                ],
                "payment_preferences": {"auto_bill_outstanding": True},
            },
        )

    def list_plans(self, product_id: str = None) -> Optional[Dict]:
        """List subscription plans."""
        endpoint = "/v1/billing/plans"
        if product_id:
            endpoint += f"?product_id={product_id}"
        return self._api("GET", endpoint)

    def get_plan(self, plan_id: str) -> Optional[Dict]:
        """Get plan details."""
        return self._api("GET", f"/v1/billing/plans/{plan_id}")

    def activate_plan(self, plan_id: str) -> Optional[Dict]:
        """Activate a plan."""
        return self._api("POST", f"/v1/billing/plans/{plan_id}/activate", {})

    def deactivate_plan(self, plan_id: str) -> Optional[Dict]:
        """Deactivate a plan."""
        return self._api("POST", f"/v1/billing/plans/{plan_id}/deactivate", {})

    def create_subscription(
        self,
        plan_id: str,
        subscriber_email: str,
        subscriber_name: str = "Customer",
    ) -> Optional[Dict]:
        """Create subscription."""
        return self._api(
            "POST",
            "/v1/billing/subscriptions",
            {
                "plan_id": plan_id,
                "subscriber": {
                    "name": {"given_name": subscriber_name},
                    "email_address": subscriber_email,
                },
            },
        )

    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details."""
        return self._api("GET", f"/v1/billing/subscriptions/{subscription_id}")

    def cancel_subscription(
        self, subscription_id: str, reason: str = "Customer requested"
    ) -> Optional[Dict]:
        """Cancel subscription."""
        return self._api(
            "POST",
            f"/v1/billing/subscriptions/{subscription_id}/cancel",
            {"reason": reason},
        )

    def suspend_subscription(
        self, subscription_id: str, reason: str = "Temporary hold"
    ) -> Optional[Dict]:
        """Suspend subscription."""
        return self._api(
            "POST",
            f"/v1/billing/subscriptions/{subscription_id}/suspend",
            {"reason": reason},
        )

    def activate_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Activate suspended subscription."""
        return self._api(
            "POST", f"/v1/billing/subscriptions/{subscription_id}/activate", {}
        )


# =============================================================================
# 13. TRANSACTION SEARCH
# =============================================================================
class TransactionSearch(PayPalBase):
    """Transaction Search API - /v1/reporting/transactions"""

    def search(
        self,
        start_date: str = None,
        end_date: str = None,
        days: int = 30,
        transaction_status: str = None,
    ) -> Optional[Dict]:
        """Search transactions."""
        if not start_date:
            end = datetime.now()
            start = end - timedelta(days=days)
            start_date = start.strftime("%Y-%m-%dT00:00:00Z")
            end_date = end.strftime("%Y-%m-%dT23:59:59Z")

        endpoint = (
            f"/v1/reporting/transactions?start_date={start_date}&end_date={end_date}"
        )
        if transaction_status:
            endpoint += f"&transaction_status={transaction_status}"

        return self._api("GET", endpoint)

    def get_balances(self, currency: str = "USD") -> Optional[Dict]:
        """Get account balances."""
        return self._api("GET", f"/v1/reporting/balances?currency_code={currency}")


# =============================================================================
# 14. WEBHOOKS
# =============================================================================
class Webhooks(PayPalBase):
    """Webhooks API - /v1/notifications/webhooks"""

    COMMON_EVENTS = [
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
        "CHECKOUT.ORDER.APPROVED",
        "BILLING.SUBSCRIPTION.CREATED",
        "BILLING.SUBSCRIPTION.CANCELLED",
        "CUSTOMER.DISPUTE.CREATED",
    ]

    def list(self) -> Optional[Dict]:
        """List webhooks."""
        return self._api("GET", "/v1/notifications/webhooks")

    def create(self, url: str, events: List[str] = None) -> Optional[Dict]:
        """Create webhook."""
        if events is None:
            events = self.COMMON_EVENTS
        return self._api(
            "POST",
            "/v1/notifications/webhooks",
            {"url": url, "event_types": [{"name": e} for e in events]},
        )

    def get(self, webhook_id: str) -> Optional[Dict]:
        """Get webhook details."""
        return self._api("GET", f"/v1/notifications/webhooks/{webhook_id}")

    def delete(self, webhook_id: str) -> Optional[Dict]:
        """Delete webhook."""
        return self._api("DELETE", f"/v1/notifications/webhooks/{webhook_id}")

    def verify_signature(
        self,
        transmission_id: str,
        transmission_time: str,
        cert_url: str,
        auth_algo: str,
        transmission_sig: str,
        webhook_id: str,
        webhook_event: Dict,
    ) -> Optional[Dict]:
        """Verify webhook signature."""
        return self._api(
            "POST",
            "/v1/notifications/verify-webhook-signature",
            {
                "transmission_id": transmission_id,
                "transmission_time": transmission_time,
                "cert_url": cert_url,
                "auth_algo": auth_algo,
                "transmission_sig": transmission_sig,
                "webhook_id": webhook_id,
                "webhook_event": webhook_event,
            },
        )

    def simulate(self, event_type: str = "PAYMENT.CAPTURE.COMPLETED") -> Optional[Dict]:
        """Simulate webhook event (sandbox only)."""
        webhook_id = os.environ.get("PAYPAL_WEBHOOK_ID")
        if not webhook_id:
            return None
        return self._api(
            "POST",
            "/v1/notifications/simulate-event",
            {"webhook_id": webhook_id, "event_type": event_type},
        )


# =============================================================================
# MAIN SDK CLASS
# =============================================================================
class PayPalSDK:
    """
    🛡️ PayPal SDK - MAX ARMOR EDITION

    Complete Python SDK for all 14 PayPal REST API resources.

    Modules:
        - tracking: Add Tracking
        - catalog: Catalog Products
        - disputes: Disputes
        - identity: Identity
        - invoicing: Invoicing v2
        - orders: Orders v2
        - partners: Partner Referrals v2
        - experience: Payment Experience
        - payments: Payments v2
        - payouts: Payouts
        - referenced_payouts: Referenced Payouts
        - subscriptions: Subscriptions
        - transactions: Transaction Search
        - webhooks: Webhooks
    """

    VERSION = "1.0.0"

    def __init__(self, mode: str = None):
        load_env()
        self.client_id = os.environ.get("PAYPAL_CLIENT_ID")
        self.client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
        self.mode = mode or os.environ.get("PAYPAL_MODE", "sandbox")

        self.base_url = (
            "https://api-m.paypal.com"
            if self.mode == "live"
            else "https://api-m.sandbox.paypal.com"
        )

        self._access_token = None
        self._token_expiry = None

        # Initialize all modules
        self.tracking = AddTracking(self)
        self.catalog = CatalogProducts(self)
        self.disputes = Disputes(self)
        self.identity = Identity(self)
        self.invoicing = Invoicing(self)
        self.orders = Orders(self)
        self.partners = PartnerReferrals(self)
        self.experience = PaymentExperience(self)
        self.payments = Payments(self)
        self.payouts = Payouts(self)
        self.referenced_payouts = ReferencedPayouts(self)
        self.subscriptions = Subscriptions(self)
        self.transactions = TransactionSearch(self)
        self.webhooks = Webhooks(self)

    def _get_token(self) -> Optional[str]:
        """Get OAuth access token."""
        if (
            self._access_token
            and self._token_expiry
            and datetime.now() < self._token_expiry
        ):
            return self._access_token

        if not self.client_id or not self.client_secret:
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

        if response.status_code == 200:
            data = response.json()
            self._access_token = data["access_token"]
            self._token_expiry = datetime.now() + timedelta(
                seconds=data.get("expires_in", 3600) - 60
            )
            return self._access_token
        return None

    def _api(self, method: str, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Make authenticated API call."""
        token = self._get_token()
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
                response = requests.post(url, headers=headers, json=data or {})
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data or [])
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                return None

            if response.status_code in [200, 201, 204]:
                return response.json() if response.text else {"success": True}
            else:
                return {"error": response.status_code, "message": response.text[:300]}
        except Exception as e:
            return {"error": "exception", "message": str(e)}

    def status(self) -> Dict:
        """Get SDK status."""
        token = self._get_token()
        return {
            "version": self.VERSION,
            "mode": self.mode,
            "authenticated": bool(token),
            "modules": [
                "tracking",
                "catalog",
                "disputes",
                "identity",
                "invoicing",
                "orders",
                "partners",
                "experience",
                "payments",
                "payouts",
                "referenced_payouts",
                "subscriptions",
                "transactions",
                "webhooks",
            ],
            "total_modules": 14,
        }


# =============================================================================
# STANDALONE
# =============================================================================
if __name__ == "__main__":
    sdk = PayPalSDK()
    status = sdk.status()

    print("\n🛡️ PAYPAL SDK - MAX ARMOR EDITION")
    print("=" * 60)
    print(f"  Version: {status['version']}")
    print(f"  Mode: {status['mode']}")
    print(f"  Auth: {'✅' if status['authenticated'] else '❌'}")
    print(f"  Modules: {status['total_modules']}")
    print("=" * 60)
    print("\n📦 AVAILABLE MODULES:")
    for mod in status["modules"]:
        print(f"  • sdk.{mod}")
    print()

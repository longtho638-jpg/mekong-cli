"""
PayPal SDK Server-Side Utilities

Provides server-side PayPal operations including:
- Access token generation
- Order creation and capture
- Webhook signature verification

Uses PayPal REST SDK for Python backend integration.
"""

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime
from typing import Any, Dict, Optional

import requests
from paypalcheckoutsdk.core import LiveEnvironment, PayPalHttpClient, SandboxEnvironment
from paypalcheckoutsdk.orders import OrdersCaptureRequest, OrdersCreateRequest, OrdersGetRequest


class PayPalSDK:
    """PayPal SDK wrapper for server-side operations"""

    def __init__(self):
        """Initialize PayPal SDK with environment configuration"""
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", "")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "")
        self.webhook_id = os.getenv("PAYPAL_WEBHOOK_ID", "")
        self.mode = os.getenv("PAYPAL_MODE", "sandbox")

        # Initialize PayPal environment
        if self.mode == "live":
            self.environment = LiveEnvironment(
                client_id=self.client_id, client_secret=self.client_secret
            )
        else:
            self.environment = SandboxEnvironment(
                client_id=self.client_id, client_secret=self.client_secret
            )

        # Create PayPal HTTP client
        self.client = PayPalHttpClient(self.environment)

        # API base URL
        self.api_base = (
            "https://api-m.paypal.com"
            if self.mode == "live"
            else "https://api-m.sandbox.paypal.com"
        )

    def get_access_token(self) -> str:
        """
        Generate PayPal OAuth access token

        Returns:
            Access token string

        Raises:
            Exception: If token generation fails
        """
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()

        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        response = requests.post(
            f"{self.api_base}/v1/oauth2/token",
            headers=headers,
            data="grant_type=client_credentials",
        )

        if response.status_code != 200:
            raise Exception(f"Failed to get access token: {response.text}")

        return response.json()["access_token"]

    def create_order(
        self, amount: str, currency: str = "USD", description: str = "AgencyOS Subscription"
    ) -> Dict[str, Any]:
        """
        Create PayPal order

        Args:
            amount: Order amount (e.g., '395.00')
            currency: Currency code (default: 'USD')
            description: Order description

        Returns:
            Order creation response with order ID

        Raises:
            Exception: If order creation fails
        """
        request = OrdersCreateRequest()
        request.prefer("return=representation")
        request.request_body(
            {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {"currency_code": currency, "value": amount},
                        "description": description,
                    }
                ],
            }
        )

        try:
            response = self.client.execute(request)
            return {
                "id": response.result.id,
                "status": response.result.status,
                "links": [{"rel": link.rel, "href": link.href} for link in response.result.links],
            }
        except Exception as e:
            raise Exception(f"Failed to create order: {str(e)}")

    def capture_order(self, order_id: str) -> Dict[str, Any]:
        """
        Capture payment for approved order

        Args:
            order_id: PayPal order ID

        Returns:
            Capture response with payment details

        Raises:
            Exception: If capture fails
        """
        request = OrdersCaptureRequest(order_id)

        try:
            response = self.client.execute(request)
            return {
                "id": response.result.id,
                "status": response.result.status,
                "payer": {
                    "email": response.result.payer.email_address,
                    "name": response.result.payer.name.given_name
                    + " "
                    + response.result.payer.name.surname,
                },
                "purchase_units": [
                    {
                        "amount": {
                            "currency_code": unit.payments.captures[0].amount.currency_code,
                            "value": unit.payments.captures[0].amount.value,
                        },
                        "capture_id": unit.payments.captures[0].id,
                    }
                    for unit in response.result.purchase_units
                ],
            }
        except Exception as e:
            raise Exception(f"Failed to capture order: {str(e)}")

    def get_order_details(self, order_id: str) -> Dict[str, Any]:
        """
        Get order details

        Args:
            order_id: PayPal order ID

        Returns:
            Order details

        Raises:
            Exception: If retrieval fails
        """
        request = OrdersGetRequest(order_id)

        try:
            response = self.client.execute(request)
            return {
                "id": response.result.id,
                "status": response.result.status,
                "amount": response.result.purchase_units[0].amount.value,
                "currency": response.result.purchase_units[0].amount.currency_code,
            }
        except Exception as e:
            raise Exception(f"Failed to get order details: {str(e)}")

    def verify_webhook_signature(self, headers: Dict[str, str], body: str) -> bool:
        """
        Verify PayPal webhook signature

        Args:
            headers: Request headers containing PayPal signature headers
            body: Raw request body

        Returns:
            True if signature is valid, False otherwise

        Raises:
            Exception: If verification request fails
        """
        access_token = self.get_access_token()

        verification_data = {
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "cert_url": headers.get("paypal-cert-url"),
            "auth_algo": headers.get("paypal-auth-algo"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "webhook_id": self.webhook_id,
            "webhook_event": json.loads(body),
        }

        response = requests.post(
            f"{self.api_base}/v1/notifications/verify-webhook-signature",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json=verification_data,
        )

        if response.status_code != 200:
            raise Exception(f"Webhook verification failed: {response.text}")

        return response.json().get("verification_status") == "SUCCESS"


# Singleton instance
_paypal_sdk = None


def get_paypal_sdk() -> PayPalSDK:
    """
    Get singleton PayPal SDK instance

    Returns:
        PayPalSDK instance
    """
    global _paypal_sdk
    if _paypal_sdk is None:
        _paypal_sdk = PayPalSDK()
    return _paypal_sdk


# Convenience functions
def create_paypal_order(amount: str, currency: str = "USD") -> Dict[str, Any]:
    """Create PayPal order"""
    sdk = get_paypal_sdk()
    return sdk.create_order(amount, currency)


def capture_paypal_order(order_id: str) -> Dict[str, Any]:
    """Capture PayPal order"""
    sdk = get_paypal_sdk()
    return sdk.capture_order(order_id)


def verify_paypal_webhook(headers: Dict[str, str], body: str) -> bool:
    """Verify PayPal webhook signature"""
    sdk = get_paypal_sdk()
    return sdk.verify_webhook_signature(headers, body)

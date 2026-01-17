#!/usr/bin/env python3
"""
⚠️ OPTIONAL MODULE - Legacy Support Only
═══════════════════════════════════════════════════════════════════════════════

PayPal NVP (Name-Value Pair) Encoder/Decoder and Client

🏯 Binh Pháp Analysis: NOT REQUIRED for AgencyOS core functionality.
   - PayPal REST API (paypal_sdk.py) covers 100% of modern use cases
   - Only needed for legacy Payflow Gateway integrations
   - Maintained for backward compatibility, NOT actively developed

Legacy API support for PayPal NVP format.
Used by Payflow Gateway and older PayPal integrations.

Usage:
    from paypal_nvp import NVPEncoder, NVPClient

    # Encode to NVP
    nvp = NVPEncoder.encode({'METHOD': 'DoDirectPayment', 'AMT': '10.00'})

    # Decode from NVP
    data = NVPEncoder.decode('METHOD=DoDirectPayment&AMT=10.00')

    # Make API call
    client = NVPClient()
    response = client.call('DoDirectPayment', {'AMT': '10.00'})
"""

import os
from typing import Any, Dict
from urllib.parse import quote, unquote

import requests


class NVPEncoder:
    """Encoder/Decoder for PayPal NVP (Name-Value Pair) format."""

    @staticmethod
    def encode(data: Dict[str, Any]) -> str:
        """
        Encode dictionary to NVP string.

        Args:
            data: Dictionary with field names and values

        Returns:
            URL-encoded NVP string (e.g., "METHOD=Test&AMT=10.00")
        """
        pairs = []
        for key, value in data.items():
            if value is not None:
                # Convert to string and URL encode
                encoded_key = quote(str(key), safe="")
                encoded_value = quote(str(value), safe="")
                pairs.append(f"{encoded_key}={encoded_value}")
        return "&".join(pairs)

    @staticmethod
    def decode(nvp_string: str) -> Dict[str, str]:
        """
        Decode NVP string to dictionary.

        Args:
            nvp_string: URL-encoded NVP string

        Returns:
            Dictionary with decoded field names and values
        """
        result = {}
        if not nvp_string:
            return result

        pairs = nvp_string.split("&")
        for pair in pairs:
            if "=" in pair:
                key, value = pair.split("=", 1)
                result[unquote(key)] = unquote(value)
        return result

    @staticmethod
    def encode_list(data: Dict[str, Any], list_fields: Dict[str, list]) -> str:
        """
        Encode dictionary with list fields to NVP string.
        PayPal uses indexed notation for lists: L_NAME0, L_NAME1, etc.

        Args:
            data: Base dictionary
            list_fields: Dictionary of list field names and their values

        Returns:
            NVP string with indexed list fields
        """
        encoded_data = dict(data)

        for field_prefix, values in list_fields.items():
            for i, value in enumerate(values):
                if isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        encoded_data[f"L_{field_prefix}{sub_key}{i}"] = sub_value
                else:
                    encoded_data[f"L_{field_prefix}{i}"] = value

        return NVPEncoder.encode(encoded_data)


class NVPClient:
    """
    PayPal NVP API Client.

    Supports both NVP API (api-3t.paypal.com) and Payflow (payflowpro.paypal.com).
    """

    # API Endpoints
    ENDPOINTS = {
        "nvp": {
            "sandbox": "https://api-3t.sandbox.paypal.com/nvp",
            "live": "https://api-3t.paypal.com/nvp",
        },
        "payflow": {
            "sandbox": "https://pilot-payflowpro.paypal.com",
            "live": "https://payflowpro.paypal.com",
        },
    }

    # NVP API Version
    API_VERSION = "204.0"

    def __init__(self, api_type: str = "nvp"):
        """
        Initialize NVP Client.

        Args:
            api_type: 'nvp' for NVP API or 'payflow' for Payflow Gateway
        """
        self.api_type = api_type
        self.mode = os.getenv("PAYPAL_MODE", "sandbox").lower()

        # NVP API credentials
        self.nvp_user = os.getenv("PAYPAL_NVP_USER", "")
        self.nvp_pwd = os.getenv("PAYPAL_NVP_PWD", "")
        self.nvp_signature = os.getenv("PAYPAL_NVP_SIGNATURE", "")

        # Payflow credentials (different from NVP)
        self.payflow_partner = os.getenv("PAYFLOW_PARTNER", "PayPal")
        self.payflow_vendor = os.getenv("PAYFLOW_VENDOR", "")
        self.payflow_user = os.getenv("PAYFLOW_USER", "")
        self.payflow_pwd = os.getenv("PAYFLOW_PWD", "")

        # Set endpoint
        mode_key = "live" if self.mode == "live" else "sandbox"
        self.endpoint = self.ENDPOINTS[api_type][mode_key]

    def _get_nvp_credentials(self) -> Dict[str, str]:
        """Get NVP API credentials."""
        return {
            "USER": self.nvp_user,
            "PWD": self.nvp_pwd,
            "SIGNATURE": self.nvp_signature,
            "VERSION": self.API_VERSION,
        }

    def _get_payflow_credentials(self) -> Dict[str, str]:
        """Get Payflow Gateway credentials."""
        return {
            "PARTNER": self.payflow_partner,
            "VENDOR": self.payflow_vendor,
            "USER": self.payflow_user,
            "PWD": self.payflow_pwd,
        }

    def call(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make NVP API call.

        Args:
            method: API method (e.g., 'DoDirectPayment', 'SetExpressCheckout')
            params: Method parameters

        Returns:
            Decoded response dictionary
        """
        params = params or {}

        if self.api_type == "nvp":
            # NVP API request
            request_data = self._get_nvp_credentials()
            request_data["METHOD"] = method
            request_data.update(params)
        else:
            # Payflow Gateway request
            request_data = self._get_payflow_credentials()
            request_data["TRXTYPE"] = method
            request_data.update(params)

        # Encode to NVP
        nvp_request = NVPEncoder.encode(request_data)

        try:
            # Make POST request
            headers = {"Content-Type": "application/x-www-form-urlencoded"}

            response = requests.post(
                self.endpoint, data=nvp_request, headers=headers, timeout=60
            )

            # Decode NVP response
            response_data = NVPEncoder.decode(response.text)

            # Add metadata
            response_data["_http_status"] = response.status_code
            response_data["_raw"] = response.text[:500]

            return response_data

        except requests.exceptions.RequestException as e:
            return {
                "ACK": "Failure",
                "L_ERRORCODE0": "CONNECTION_ERROR",
                "L_SHORTMESSAGE0": "Connection failed",
                "L_LONGMESSAGE0": str(e),
            }

    def status(self) -> Dict[str, Any]:
        """Get client status."""
        if self.api_type == "nvp":
            has_creds = bool(self.nvp_user and self.nvp_pwd and self.nvp_signature)
        else:
            has_creds = bool(
                self.payflow_vendor and self.payflow_user and self.payflow_pwd
            )

        return {
            "api_type": self.api_type,
            "mode": self.mode,
            "endpoint": self.endpoint,
            "has_credentials": has_creds,
            "version": self.API_VERSION if self.api_type == "nvp" else "Payflow",
        }


# ============================================================================
# EXPRESS CHECKOUT HELPER (Legacy)
# ============================================================================


class ExpressCheckout:
    """
    PayPal Express Checkout helper (Legacy NVP API).

    Note: This is for legacy integrations. New integrations should use
    the REST API Orders endpoint.
    """

    def __init__(self):
        self.client = NVPClient("nvp")

    def set_checkout(
        self,
        amount: float,
        currency: str = "USD",
        return_url: str = "",
        cancel_url: str = "",
        description: str = "",
    ) -> Dict[str, Any]:
        """
        Initiate Express Checkout (SetExpressCheckout).

        Returns checkout token for redirect.
        """
        params = {
            "PAYMENTREQUEST_0_AMT": f"{amount:.2f}",
            "PAYMENTREQUEST_0_CURRENCYCODE": currency,
            "PAYMENTREQUEST_0_PAYMENTACTION": "Sale",
            "RETURNURL": return_url,
            "CANCELURL": cancel_url,
            "PAYMENTREQUEST_0_DESC": description or "Payment",
        }

        return self.client.call("SetExpressCheckout", params)

    def get_checkout_details(self, token: str) -> Dict[str, Any]:
        """Get Express Checkout details (GetExpressCheckoutDetails)."""
        return self.client.call("GetExpressCheckoutDetails", {"TOKEN": token})

    def do_checkout(
        self, token: str, payer_id: str, amount: float, currency: str = "USD"
    ) -> Dict[str, Any]:
        """Complete Express Checkout (DoExpressCheckoutPayment)."""
        params = {
            "TOKEN": token,
            "PAYERID": payer_id,
            "PAYMENTREQUEST_0_AMT": f"{amount:.2f}",
            "PAYMENTREQUEST_0_CURRENCYCODE": currency,
            "PAYMENTREQUEST_0_PAYMENTACTION": "Sale",
        }

        return self.client.call("DoExpressCheckoutPayment", params)

    def get_redirect_url(self, token: str) -> str:
        """Get PayPal redirect URL for checkout."""
        if self.client.mode == "live":
            return f"https://www.paypal.com/checkoutnow?token={token}"
        return f"https://www.sandbox.paypal.com/checkoutnow?token={token}"


# ============================================================================
# MASS PAY HELPER (Legacy)
# ============================================================================


class MassPay:
    """
    PayPal Mass Pay helper (Legacy NVP API).

    Note: For new integrations, use REST API Payouts endpoint.
    """

    def __init__(self):
        self.client = NVPClient("nvp")

    def send_payments(
        self,
        payments: list,
        email_subject: str = "You have received a payment",
        receiver_type: str = "EmailAddress",
    ) -> Dict[str, Any]:
        """
        Send mass payments.

        Args:
            payments: List of dicts with 'email', 'amount', 'unique_id', 'note'
            email_subject: Email subject for recipients
            receiver_type: 'EmailAddress' or 'UserID'
        """
        params = {
            "EMAILSUBJECT": email_subject,
            "RECEIVERTYPE": receiver_type,
            "CURRENCYCODE": "USD",
        }

        # Add indexed payment items
        for i, payment in enumerate(payments):
            params[f"L_EMAIL{i}"] = payment.get("email", "")
            params[f"L_AMT{i}"] = f"{payment.get('amount', 0):.2f}"
            params[f"L_UNIQUEID{i}"] = payment.get("unique_id", f"PAY{i}")
            params[f"L_NOTE{i}"] = payment.get("note", "")

        return self.client.call("MassPay", params)


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🔗 PayPal NVP Client")
    print("=" * 60)

    # Test encoding/decoding
    print("\n📝 NVP Encoding Test:")
    test_data = {
        "METHOD": "DoDirectPayment",
        "AMT": "10.00",
        "CURRENCYCODE": "USD",
        "DESC": "Test Payment",
    }
    encoded = NVPEncoder.encode(test_data)
    print(f"   Input:   {test_data}")
    print(f"   Encoded: {encoded}")

    decoded = NVPEncoder.decode(encoded)
    print(f"   Decoded: {decoded}")
    print(f"   ✅ Round-trip: {'PASS' if decoded == test_data else 'FAIL'}")

    # Client status
    print("\n📊 NVP Client Status:")
    nvp_client = NVPClient("nvp")
    status = nvp_client.status()
    for key, value in status.items():
        print(f"   {key}: {value}")

    print("\n📊 Payflow Client Status:")
    payflow_client = NVPClient("payflow")
    status = payflow_client.status()
    for key, value in status.items():
        print(f"   {key}: {value}")

    print("\n" + "=" * 60)

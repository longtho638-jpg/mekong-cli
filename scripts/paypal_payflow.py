#!/usr/bin/env python3
"""
⚠️ OPTIONAL MODULE - Legacy Support Only
═══════════════════════════════════════════════════════════════════════════════

PayPal Payflow Gateway SDK

🏯 Binh Pháp Analysis: NOT REQUIRED for AgencyOS core functionality.
   - PayPal REST API (paypal_sdk.py) covers 100% of modern use cases
   - Payflow is legacy direct credit card processing
   - Only use if client has existing Payflow Gateway account
   - Maintained for backward compatibility, NOT actively developed

Direct credit card processing via Payflow Gateway.
Supports: Sales, Authorizations, Captures, Credits, Voids, Recurring Billing.

Usage:
    from paypal_payflow import PayflowGateway

    payflow = PayflowGateway()

    # Direct sale
    result = payflow.sale(
        amount=99.99,
        card_number='4111111111111111',
        expiration='1225',
        cvv='123'
    )

    # Authorization only
    result = payflow.authorize(amount=50.00, ...)

    # Capture authorization
    result = payflow.capture(pnref='V12345678901', amount=50.00)
"""

import os
import random
import string
from datetime import datetime
from typing import Any, Dict, Optional

import requests


class PayflowGateway:
    """
    PayPal Payflow Gateway SDK.

    Direct credit card processing with fraud protection and recurring billing.
    """

    # Transaction Types
    TRXTYPE_SALE = "S"  # Sale (Charge)
    TRXTYPE_AUTHORIZATION = "A"  # Authorization only
    TRXTYPE_CAPTURE = "D"  # Delayed Capture
    TRXTYPE_CREDIT = "C"  # Credit/Refund
    TRXTYPE_VOID = "V"  # Void
    TRXTYPE_INQUIRY = "I"  # Inquiry

    # Tender Types
    TENDER_CREDIT = "C"  # Credit Card
    TENDER_PAYPAL = "P"  # PayPal
    TENDER_ACH = "A"  # ACH/eCheck

    # Recurring Action Types
    ACTION_ADD = "A"  # Add profile
    ACTION_MODIFY = "M"  # Modify profile
    ACTION_CANCEL = "C"  # Cancel profile
    ACTION_REACTIVATE = "R"  # Reactivate profile
    ACTION_INQUIRY = "I"  # Inquiry profile
    ACTION_PAYMENT = "P"  # Process payment

    def __init__(self):
        """Initialize Payflow Gateway."""
        self.mode = os.getenv("PAYPAL_MODE", "sandbox").lower()

        # Payflow credentials
        self.partner = os.getenv("PAYFLOW_PARTNER", "PayPal")
        self.vendor = os.getenv("PAYFLOW_VENDOR", "")
        self.user = os.getenv("PAYFLOW_USER", "")
        self.pwd = os.getenv("PAYFLOW_PWD", "")

        # Set endpoint
        if self.mode == "live":
            self.endpoint = "https://payflowpro.paypal.com"
        else:
            self.endpoint = "https://pilot-payflowpro.paypal.com"

    def _generate_request_id(self) -> str:
        """Generate unique request ID."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        return f"REQ{timestamp}{random_str}"

    def _build_params(self, **kwargs) -> str:
        """Build NVP parameter string."""
        params = {
            "PARTNER": self.partner,
            "VENDOR": self.vendor,
            "USER": self.user,
            "PWD": self.pwd,
        }
        params.update(kwargs)

        # Filter out None values and build string
        pairs = []
        for key, value in params.items():
            if value is not None:
                pairs.append(f"{key}[{len(str(value))}]={value}")

        return "&".join(pairs)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Payflow response."""
        result = {}
        for pair in response_text.split("&"):
            if "=" in pair:
                key, value = pair.split("=", 1)
                result[key] = value
        return result

    def _request(self, params: str) -> Dict[str, Any]:
        """Make Payflow API request."""
        request_id = self._generate_request_id()

        headers = {
            "Content-Type": "text/namevalue",
            "X-VPS-Request-ID": request_id,
            "X-VPS-Client-Timeout": "60",
        }

        try:
            response = requests.post(
                self.endpoint, data=params, headers=headers, timeout=60
            )

            result = self._parse_response(response.text)
            result["_request_id"] = request_id
            result["_http_status"] = response.status_code

            return result

        except requests.exceptions.RequestException as e:
            return {
                "RESULT": "999",
                "RESPMSG": f"Connection error: {str(e)}",
                "_request_id": request_id,
                "_error": True,
            }

    # ========================================================================
    # TRANSACTION METHODS
    # ========================================================================

    def sale(
        self,
        amount: float,
        card_number: str,
        expiration: str,
        cvv: str = "",
        name: str = "",
        street: str = "",
        city: str = "",
        state: str = "",
        zip_code: str = "",
        email: str = "",
        comment1: str = "",
        comment2: str = "",
        invoice_number: str = "",
    ) -> Dict[str, Any]:
        """
        Process a sale transaction (charge card immediately).

        Args:
            amount: Transaction amount
            card_number: Credit card number
            expiration: Expiration date (MMYY format)
            cvv: Card security code
            name: Cardholder name
            street: Billing street address
            city: Billing city
            state: Billing state
            zip_code: Billing ZIP code
            email: Customer email
            comment1: Comment field 1
            comment2: Comment field 2
            invoice_number: Invoice/order number

        Returns:
            Response dict with PNREF (transaction ID) on success
        """
        params = self._build_params(
            TRXTYPE=self.TRXTYPE_SALE,
            TENDER=self.TENDER_CREDIT,
            AMT=f"{amount:.2f}",
            ACCT=card_number,
            EXPDATE=expiration,
            CVV2=cvv if cvv else None,
            FIRSTNAME=name.split()[0] if name else None,
            LASTNAME=" ".join(name.split()[1:]) if name else None,
            STREET=street if street else None,
            CITY=city if city else None,
            STATE=state if state else None,
            ZIP=zip_code if zip_code else None,
            EMAIL=email if email else None,
            COMMENT1=comment1 if comment1 else None,
            COMMENT2=comment2 if comment2 else None,
            INVNUM=invoice_number if invoice_number else None,
        )

        return self._request(params)

    def authorize(
        self, amount: float, card_number: str, expiration: str, cvv: str = "", **kwargs
    ) -> Dict[str, Any]:
        """
        Authorize a transaction (hold funds, capture later).

        Args:
            amount: Authorization amount
            card_number: Credit card number
            expiration: Expiration date (MMYY format)
            cvv: Card security code
            **kwargs: Additional fields (name, street, etc.)

        Returns:
            Response dict with PNREF for later capture
        """
        params = self._build_params(
            TRXTYPE=self.TRXTYPE_AUTHORIZATION,
            TENDER=self.TENDER_CREDIT,
            AMT=f"{amount:.2f}",
            ACCT=card_number,
            EXPDATE=expiration,
            CVV2=cvv if cvv else None,
            **{k.upper(): v for k, v in kwargs.items() if v},
        )

        return self._request(params)

    def capture(self, pnref: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Capture a previously authorized transaction.

        Args:
            pnref: Original authorization PNREF
            amount: Capture amount (optional, defaults to full amount)

        Returns:
            Response dict
        """
        params_dict = {"TRXTYPE": self.TRXTYPE_CAPTURE, "ORIGID": pnref}
        if amount is not None:
            params_dict["AMT"] = f"{amount:.2f}"

        params = self._build_params(**params_dict)
        return self._request(params)

    def credit(self, pnref: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Credit/refund a transaction.

        Args:
            pnref: Original transaction PNREF
            amount: Refund amount (optional, defaults to full amount)

        Returns:
            Response dict
        """
        params_dict = {
            "TRXTYPE": self.TRXTYPE_CREDIT,
            "TENDER": self.TENDER_CREDIT,
            "ORIGID": pnref,
        }
        if amount is not None:
            params_dict["AMT"] = f"{amount:.2f}"

        params = self._build_params(**params_dict)
        return self._request(params)

    def void(self, pnref: str) -> Dict[str, Any]:
        """
        Void a transaction.

        Args:
            pnref: Transaction PNREF to void

        Returns:
            Response dict
        """
        params = self._build_params(TRXTYPE=self.TRXTYPE_VOID, ORIGID=pnref)
        return self._request(params)

    def inquiry(self, pnref: str) -> Dict[str, Any]:
        """
        Inquire about a transaction.

        Args:
            pnref: Transaction PNREF

        Returns:
            Transaction details
        """
        params = self._build_params(TRXTYPE=self.TRXTYPE_INQUIRY, ORIGID=pnref)
        return self._request(params)

    # ========================================================================
    # RECURRING BILLING
    # ========================================================================

    def create_profile(
        self,
        amount: float,
        card_number: str,
        expiration: str,
        start_date: str,
        term: int = 0,
        frequency: str = "MONT",
        name: str = "",
        email: str = "",
        profile_name: str = "",
    ) -> Dict[str, Any]:
        """
        Create a recurring billing profile.

        Args:
            amount: Recurring amount
            card_number: Credit card number
            expiration: Expiration date (MMYY)
            start_date: Start date (MMDDYYYY)
            term: Number of payments (0 = until canceled)
            frequency: WEEK, BIWK, SMMO, FRWK, MONT, QTER, SMYR, YEAR
            name: Customer name
            email: Customer email
            profile_name: Profile description

        Returns:
            Response with PROFILEID on success
        """
        params = self._build_params(
            TRXTYPE="R",
            TENDER=self.TENDER_CREDIT,
            ACTION=self.ACTION_ADD,
            AMT=f"{amount:.2f}",
            ACCT=card_number,
            EXPDATE=expiration,
            START=start_date,
            TERM=str(term),
            PAYPERIOD=frequency,
            PROFILENAME=profile_name
            if profile_name
            else f"Profile_{datetime.now().strftime('%Y%m%d')}",
            NAME=name if name else None,
            EMAIL=email if email else None,
        )

        return self._request(params)

    def modify_profile(
        self,
        profile_id: str,
        amount: Optional[float] = None,
        start_date: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Modify a recurring billing profile.

        Args:
            profile_id: Profile ID to modify
            amount: New amount (optional)
            start_date: New start date (optional)
            **kwargs: Other fields to update

        Returns:
            Response dict
        """
        params_dict = {
            "TRXTYPE": "R",
            "ACTION": self.ACTION_MODIFY,
            "ORIGPROFILEID": profile_id,
        }

        if amount is not None:
            params_dict["AMT"] = f"{amount:.2f}"
        if start_date:
            params_dict["START"] = start_date

        params_dict.update({k.upper(): v for k, v in kwargs.items() if v})

        params = self._build_params(**params_dict)
        return self._request(params)

    def cancel_profile(self, profile_id: str) -> Dict[str, Any]:
        """
        Cancel a recurring billing profile.

        Args:
            profile_id: Profile ID to cancel

        Returns:
            Response dict
        """
        params = self._build_params(
            TRXTYPE="R", ACTION=self.ACTION_CANCEL, ORIGPROFILEID=profile_id
        )
        return self._request(params)

    def get_profile(self, profile_id: str) -> Dict[str, Any]:
        """
        Get recurring billing profile details.

        Args:
            profile_id: Profile ID

        Returns:
            Profile details
        """
        params = self._build_params(
            TRXTYPE="R", ACTION=self.ACTION_INQUIRY, ORIGPROFILEID=profile_id
        )
        return self._request(params)

    def reactivate_profile(self, profile_id: str) -> Dict[str, Any]:
        """
        Reactivate a canceled recurring billing profile.

        Args:
            profile_id: Profile ID to reactivate

        Returns:
            Response dict
        """
        params = self._build_params(
            TRXTYPE="R", ACTION=self.ACTION_REACTIVATE, ORIGPROFILEID=profile_id
        )
        return self._request(params)

    # ========================================================================
    # FRAUD PROTECTION
    # ========================================================================

    def set_fraud_filters(
        self, enabled: bool = True, filters: Dict[str, str] = None
    ) -> Dict[str, str]:
        """
        Configure fraud filter settings.

        Note: Fraud filters are configured at account level in PayPal Manager.
        This method returns recommended transaction parameters for fraud protection.

        Args:
            enabled: Enable fraud checking
            filters: Custom filter parameters

        Returns:
            Parameters to include in transactions
        """
        fraud_params = {}

        if enabled:
            fraud_params["VERBOSITY"] = "HIGH"  # Get detailed fraud info
            fraud_params["CUSTIP"] = ""  # Customer IP (set on each txn)

        if filters:
            fraud_params.update(filters)

        return fraud_params

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def status(self) -> Dict[str, Any]:
        """Get gateway status."""
        has_creds = bool(self.vendor and self.user and self.pwd)

        return {
            "mode": self.mode,
            "endpoint": self.endpoint,
            "partner": self.partner,
            "vendor": self.vendor if self.vendor else "(not set)",
            "has_credentials": has_creds,
            "features": [
                "Credit Card Processing",
                "Authorizations",
                "Captures",
                "Refunds/Credits",
                "Voids",
                "Recurring Billing",
                "Fraud Protection",
            ],
        }

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to Payflow Gateway.

        Attempts a $0 authorization to verify credentials.
        """
        # Try inquiry with dummy PNREF (will fail but confirms connectivity)
        params = self._build_params(
            TRXTYPE=self.TRXTYPE_INQUIRY, ORIGID="TEST000000000"
        )

        result = self._request(params)

        # RESULT=0 means success, other codes indicate specific issues
        return {
            "connected": result.get("_http_status") == 200,
            "result_code": result.get("RESULT", "N/A"),
            "message": result.get("RESPMSG", "Unknown"),
            "credentials_valid": result.get("RESULT") != "1",  # 1 = auth failure
        }


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("💳 PayPal Payflow Gateway SDK")
    print("=" * 60)

    payflow = PayflowGateway()
    status = payflow.status()

    print("\n📊 Gateway Status:")
    for key, value in status.items():
        if key != "features":
            print(f"   {key}: {value}")

    print("\n🛠️ Features:")
    for feature in status["features"]:
        print(f"   ✓ {feature}")

    if status["has_credentials"]:
        print("\n🔗 Testing Connection...")
        test = payflow.test_connection()
        print(f"   Connected: {test['connected']}")
        print(f"   Result: {test['result_code']} - {test['message']}")
    else:
        print("\n⚠️  Payflow credentials not configured.")
        print("   Set: PAYFLOW_VENDOR, PAYFLOW_USER, PAYFLOW_PWD")

    print("\n" + "=" * 60)

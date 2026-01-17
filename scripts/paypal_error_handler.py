"""
🔧 PayPal Error Handler & Troubleshooting Module
=================================================
Comprehensive error handling for PayPal API responses.

Based on: https://developer.paypal.com/api/rest/troubleshooting/

COMMON ERRORS:
- AGREEMENT_ALREADY_CANCELLED: Operation on cancelled billing agreement
- CANNOT_PAY_SELF: Sender and receiver are same account
- CURRENCY_MISMATCH: Transaction currency doesn't match
- DUPLICATE_TRANSACTION: Same transaction sent twice
- MERCHANT_NOT_ENABLED_FOR_REFERENCE_TRANSACTION: Feature not enabled
- VALIDATION_ERROR: Invalid request data
- NOT_AUTHORIZED: Authentication/permission issue
- RESOURCE_NOT_FOUND: Invalid ID
- UNPROCESSABLE_ENTITY: Business rule violation

Usage:
    from scripts.paypal_error_handler import PayPalErrorHandler

    handler = PayPalErrorHandler()
    result = handler.handle_error(response_data)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class ErrorSeverity(Enum):
    """Error severity levels."""

    LOW = "low"  # Informational, can retry
    MEDIUM = "medium"  # Needs attention, may need user action
    HIGH = "high"  # Critical, requires immediate action
    CRITICAL = "critical"  # System-level issue


class ErrorCategory(Enum):
    """Error categories."""

    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    BUSINESS_RULE = "business_rule"
    DUPLICATE = "duplicate"
    NOT_FOUND = "not_found"
    RATE_LIMIT = "rate_limit"
    SERVER_ERROR = "server_error"
    NETWORK = "network"


@dataclass
class PayPalError:
    """Structured PayPal error."""

    code: str
    message: str
    severity: ErrorSeverity
    category: ErrorCategory
    resolution: str
    user_message: str
    can_retry: bool
    http_status: int = 0
    details: Optional[Dict] = None


# Comprehensive error definitions
PAYPAL_ERRORS: Dict[str, Dict[str, Any]] = {
    # ===========================================
    # BILLING/SUBSCRIPTION ERRORS
    # ===========================================
    "AGREEMENT_ALREADY_CANCELLED": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The billing agreement has already been cancelled",
        "resolution": "Check agreement status before operations. Retrieve agreement details to verify cancellation status.",
        "user_message": "This subscription has already been cancelled.",
        "can_retry": False,
    },
    "BILLING_AGREEMENT_NOT_FOUND": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.NOT_FOUND,
        "message": "The billing agreement ID does not exist",
        "resolution": "Verify the agreement ID is correct. The agreement may have been deleted.",
        "user_message": "Subscription not found. It may have been removed.",
        "can_retry": False,
    },
    "SUBSCRIPTION_STATUS_INVALID": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "Operation not allowed for current subscription status",
        "resolution": "Check subscription status before performing operations.",
        "user_message": "This action cannot be performed on this subscription.",
        "can_retry": False,
    },
    # ===========================================
    # PAYMENT ERRORS
    # ===========================================
    "CANNOT_PAY_SELF": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The sender and receiver PayPal accounts are the same",
        "resolution": "Ensure sender and receiver are different accounts.",
        "user_message": "You cannot send payment to yourself.",
        "can_retry": False,
    },
    "CURRENCY_MISMATCH": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.VALIDATION,
        "message": "Transaction currency does not match expected currency",
        "resolution": "Verify currency codes match. Use consistent currency throughout transaction.",
        "user_message": "Currency mismatch. Please check your payment details.",
        "can_retry": True,
    },
    "DUPLICATE_TRANSACTION": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.DUPLICATE,
        "message": "A similar transaction was already processed",
        "resolution": "Use idempotency keys. Check if original transaction succeeded.",
        "user_message": "This payment may have already been processed. Please check your account.",
        "can_retry": False,
    },
    "INSUFFICIENT_FUNDS": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "Insufficient funds in the account",
        "resolution": "Customer needs to add funds or use different payment method.",
        "user_message": "Insufficient funds. Please add funds or try a different payment method.",
        "can_retry": True,
    },
    "TRANSACTION_REFUSED": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "Transaction was refused by PayPal risk assessment",
        "resolution": "Review transaction for potential fraud indicators. Contact PayPal support if legitimate.",
        "user_message": "Payment could not be processed. Please try a different payment method.",
        "can_retry": True,
    },
    # ===========================================
    # MERCHANT ERRORS
    # ===========================================
    "MERCHANT_NOT_ENABLED_FOR_REFERENCE_TRANSACTION": {
        "severity": ErrorSeverity.HIGH,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "Merchant account not enabled for reference transactions",
        "resolution": "Contact PayPal to enable reference transactions on your account.",
        "user_message": "Service temporarily unavailable. Please contact support.",
        "can_retry": False,
    },
    "PAYEE_ACCOUNT_RESTRICTED": {
        "severity": ErrorSeverity.HIGH,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The receiving account is restricted",
        "resolution": "Merchant needs to resolve account restrictions with PayPal.",
        "user_message": "Payment cannot be processed at this time. Please try later.",
        "can_retry": False,
    },
    # ===========================================
    # VALIDATION ERRORS
    # ===========================================
    "VALIDATION_ERROR": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.VALIDATION,
        "message": "Request validation failed",
        "resolution": "Check request parameters against API documentation.",
        "user_message": "Invalid information provided. Please check and try again.",
        "can_retry": True,
    },
    "INVALID_PARAMETER_VALUE": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.VALIDATION,
        "message": "A parameter value is invalid",
        "resolution": "Review the specific parameter mentioned in error details.",
        "user_message": "Please check the information you entered.",
        "can_retry": True,
    },
    "MISSING_REQUIRED_PARAMETER": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.VALIDATION,
        "message": "A required parameter is missing",
        "resolution": "Add the missing required parameter.",
        "user_message": "Some required information is missing.",
        "can_retry": True,
    },
    "MALFORMED_REQUEST": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.VALIDATION,
        "message": "Request JSON is malformed",
        "resolution": "Check JSON syntax and structure.",
        "user_message": "An error occurred. Please try again.",
        "can_retry": True,
    },
    # ===========================================
    # AUTHENTICATION ERRORS
    # ===========================================
    "NOT_AUTHORIZED": {
        "severity": ErrorSeverity.HIGH,
        "category": ErrorCategory.AUTHENTICATION,
        "message": "Authorization failed or insufficient permissions",
        "resolution": "Check API credentials and ensure required scopes are granted.",
        "user_message": "Authorization failed. Please try again.",
        "can_retry": False,
    },
    "AUTHENTICATION_FAILURE": {
        "severity": ErrorSeverity.HIGH,
        "category": ErrorCategory.AUTHENTICATION,
        "message": "Invalid API credentials",
        "resolution": "Verify client ID and secret. Ensure using correct environment (sandbox/live).",
        "user_message": "Service error. Please contact support.",
        "can_retry": False,
    },
    "PERMISSION_DENIED": {
        "severity": ErrorSeverity.HIGH,
        "category": ErrorCategory.AUTHENTICATION,
        "message": "Account lacks permission for this operation",
        "resolution": "Request additional permissions or upgrade account.",
        "user_message": "This operation is not available for your account.",
        "can_retry": False,
    },
    # ===========================================
    # RESOURCE ERRORS
    # ===========================================
    "RESOURCE_NOT_FOUND": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.NOT_FOUND,
        "message": "The requested resource does not exist",
        "resolution": "Verify the resource ID is correct and exists.",
        "user_message": "The requested item was not found.",
        "can_retry": False,
    },
    "INVALID_RESOURCE_ID": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.VALIDATION,
        "message": "Invalid resource ID format",
        "resolution": "Check the ID format matches expected pattern.",
        "user_message": "Invalid request. Please try again.",
        "can_retry": False,
    },
    # ===========================================
    # RATE LIMITING ERRORS
    # ===========================================
    "RATE_LIMIT_EXCEEDED": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.RATE_LIMIT,
        "message": "API rate limit exceeded",
        "resolution": "Implement exponential backoff. Reduce request frequency.",
        "user_message": "Too many requests. Please wait a moment and try again.",
        "can_retry": True,
    },
    # ===========================================
    # SERVER ERRORS
    # ===========================================
    "INTERNAL_SERVER_ERROR": {
        "severity": ErrorSeverity.CRITICAL,
        "category": ErrorCategory.SERVER_ERROR,
        "message": "PayPal internal server error",
        "resolution": "Retry with exponential backoff. Check PayPal status page.",
        "user_message": "Service temporarily unavailable. Please try again later.",
        "can_retry": True,
    },
    "SERVICE_UNAVAILABLE": {
        "severity": ErrorSeverity.CRITICAL,
        "category": ErrorCategory.SERVER_ERROR,
        "message": "PayPal service is temporarily unavailable",
        "resolution": "Wait and retry. Check PayPal status page for outages.",
        "user_message": "Service is temporarily unavailable. Please try again later.",
        "can_retry": True,
    },
    # ===========================================
    # DISPUTE ERRORS
    # ===========================================
    "DISPUTE_ALREADY_RESOLVED": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The dispute has already been resolved",
        "resolution": "Check dispute status before taking action.",
        "user_message": "This dispute has already been resolved.",
        "can_retry": False,
    },
    "DISPUTE_NOT_ELIGIBLE": {
        "severity": ErrorSeverity.MEDIUM,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The dispute is not eligible for this action",
        "resolution": "Review dispute eligibility requirements.",
        "user_message": "This action is not available for this dispute.",
        "can_retry": False,
    },
    # ===========================================
    # INVOICE ERRORS
    # ===========================================
    "INVOICE_ALREADY_PAID": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "The invoice has already been paid",
        "resolution": "Check invoice status before sending reminders or cancelling.",
        "user_message": "This invoice has already been paid.",
        "can_retry": False,
    },
    "INVOICE_NOT_SENT": {
        "severity": ErrorSeverity.LOW,
        "category": ErrorCategory.BUSINESS_RULE,
        "message": "Cannot perform action on unsent invoice",
        "resolution": "Send the invoice first before this operation.",
        "user_message": "Please send the invoice first.",
        "can_retry": False,
    },
}


class PayPalErrorHandler:
    """
    Comprehensive PayPal error handler.

    Parses API responses and provides structured error information
    with resolutions and user-friendly messages.
    """

    def __init__(self, log_errors: bool = True):
        """Initialize error handler."""
        self.log_errors = log_errors
        self.error_history: List[PayPalError] = []

    def parse_error(
        self,
        response_data: Dict[str, Any],
        http_status: int = 0,
    ) -> Optional[PayPalError]:
        """
        Parse PayPal API error response.

        Args:
            response_data: The JSON response from PayPal API
            http_status: HTTP status code

        Returns:
            Structured PayPalError or None if no error
        """
        # Check for error indicators
        error_code = None
        error_message = ""
        error_details = None

        # Standard error format
        if "name" in response_data:
            error_code = response_data.get("name")
            error_message = response_data.get("message", "")
            error_details = response_data.get("details", [])

        # Alternative error format
        elif "error" in response_data:
            error_code = response_data.get("error")
            error_message = response_data.get("error_description", "")

        # Issue format (often in details)
        elif "issue" in response_data:
            error_code = response_data.get("issue")
            error_message = response_data.get("description", "")

        if not error_code:
            return None

        # Look up error definition
        error_def = PAYPAL_ERRORS.get(
            error_code,
            {
                "severity": ErrorSeverity.MEDIUM,
                "category": ErrorCategory.BUSINESS_RULE,
                "message": error_message or "Unknown error",
                "resolution": "Check PayPal API documentation for this error code.",
                "user_message": "An error occurred. Please try again.",
                "can_retry": True,
            },
        )

        error = PayPalError(
            code=error_code,
            message=error_message or error_def.get("message", ""),
            severity=error_def["severity"],
            category=error_def["category"],
            resolution=error_def["resolution"],
            user_message=error_def["user_message"],
            can_retry=error_def["can_retry"],
            http_status=http_status,
            details=error_details if error_details else response_data,
        )

        if self.log_errors:
            self.error_history.append(error)
            self._log_error(error)

        return error

    def _log_error(self, error: PayPalError):
        """Log error for debugging."""
        severity_icon = {
            ErrorSeverity.LOW: "ℹ️",
            ErrorSeverity.MEDIUM: "⚠️",
            ErrorSeverity.HIGH: "❌",
            ErrorSeverity.CRITICAL: "🔴",
        }

        icon = severity_icon.get(error.severity, "❓")
        print(f"\n{icon} PayPal Error: {error.code}")
        print(f"   Message: {error.message}")
        print(f"   Resolution: {error.resolution}")
        if error.can_retry:
            print("   Retry: ✅ Can retry")
        else:
            print("   Retry: ❌ Do not retry")

    def handle_error(
        self,
        response_data: Dict[str, Any],
        http_status: int = 0,
        raise_on_critical: bool = False,
    ) -> Dict[str, Any]:
        """
        Handle PayPal error with full context.

        Returns dict with error info and recommended actions.
        """
        error = self.parse_error(response_data, http_status)

        if not error:
            return {"success": True, "error": None}

        result = {
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "user_message": error.user_message,
                "severity": error.severity.value,
                "category": error.category.value,
                "resolution": error.resolution,
                "can_retry": error.can_retry,
                "http_status": error.http_status,
            },
            "actions": self._get_recommended_actions(error),
        }

        if raise_on_critical and error.severity == ErrorSeverity.CRITICAL:
            raise PayPalAPIError(error)

        return result

    def _get_recommended_actions(self, error: PayPalError) -> List[str]:
        """Get recommended actions based on error."""
        actions = []

        if error.category == ErrorCategory.AUTHENTICATION:
            actions.extend(
                [
                    "Verify API credentials",
                    "Check environment (sandbox vs live)",
                    "Ensure required scopes are granted",
                ]
            )

        elif error.category == ErrorCategory.VALIDATION:
            actions.extend(
                [
                    "Review request parameters",
                    "Check data types and formats",
                    "Validate against API schema",
                ]
            )

        elif error.category == ErrorCategory.RATE_LIMIT:
            actions.extend(
                [
                    "Implement exponential backoff",
                    "Queue and batch requests",
                    "Monitor API usage",
                ]
            )

        elif error.category == ErrorCategory.BUSINESS_RULE:
            actions.extend(
                [
                    "Check resource status before operations",
                    "Review business logic",
                    f"Resolution: {error.resolution}",
                ]
            )

        elif error.category == ErrorCategory.SERVER_ERROR:
            actions.extend(
                [
                    "Wait and retry with backoff",
                    "Check PayPal status page",
                    "Log for later investigation",
                ]
            )

        if error.can_retry:
            actions.append("Retry with exponential backoff")

        return actions

    def get_error_stats(self) -> Dict[str, Any]:
        """Get statistics on logged errors."""
        if not self.error_history:
            return {"total": 0}

        by_severity = {}
        by_category = {}
        by_code = {}

        for error in self.error_history:
            # By severity
            sev = error.severity.value
            by_severity[sev] = by_severity.get(sev, 0) + 1

            # By category
            cat = error.category.value
            by_category[cat] = by_category.get(cat, 0) + 1

            # By code
            by_code[error.code] = by_code.get(error.code, 0) + 1

        return {
            "total": len(self.error_history),
            "by_severity": by_severity,
            "by_category": by_category,
            "by_code": by_code,
            "most_common": max(by_code, key=by_code.get) if by_code else None,
        }


class PayPalAPIError(Exception):
    """Custom exception for critical PayPal errors."""

    def __init__(self, error: PayPalError):
        self.error = error
        super().__init__(f"PayPal API Error: {error.code} - {error.message}")


# ========== STANDALONE USAGE ==========

if __name__ == "__main__":
    print("\n🔧 PAYPAL ERROR HANDLER")
    print("=" * 60)
    print(f"  Defined errors: {len(PAYPAL_ERRORS)}")

    print("\n📋 ERROR CODES BY CATEGORY:")

    categories = {}
    for code, info in PAYPAL_ERRORS.items():
        cat = info["category"].value
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(code)

    for cat, codes in sorted(categories.items()):
        print(f"\n  {cat.upper()}:")
        for code in codes:
            print(f"    • {code}")

    print("\n" + "=" * 60)

    # Demo
    print("\n📝 DEMO - Parsing an error:")
    handler = PayPalErrorHandler()

    sample_error = {
        "name": "AGREEMENT_ALREADY_CANCELLED",
        "message": "The billing agreement has already been cancelled.",
        "debug_id": "abc123",
    }

    result = handler.handle_error(sample_error, http_status=400)
    print(f"\n   User message: {result['error']['user_message']}")
    print(f"   Can retry: {result['error']['can_retry']}")
    print(f"   Actions: {result['actions'][:2]}")
    print()

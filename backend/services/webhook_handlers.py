"""
PayPal Webhook Event Handlers Service
"""
from typing import Dict, Any

class PaymentEventHandler:
    """Handle payment-related events."""

    @staticmethod
    def payment_capture_completed(resource: Dict):
        """PAYMENT.CAPTURE.COMPLETED - Payment successful."""
        capture_id = resource.get("id")
        amount = resource.get("amount", {}).get("value", "0.00")
        currency = resource.get("amount", {}).get("currency_code", "USD")

        print(f"✅ Payment Captured: {capture_id} - ${amount} {currency}")
        return {
            "action": "payment_confirmed",
            "capture_id": capture_id,
            "amount": amount,
        }

    @staticmethod
    def payment_capture_denied(resource: Dict):
        """PAYMENT.CAPTURE.DENIED - Payment failed."""
        capture_id = resource.get("id")
        print(f"❌ Payment Denied: {capture_id}")
        return {"action": "payment_failed", "capture_id": capture_id}

    @staticmethod
    def payment_capture_refunded(resource: Dict):
        """PAYMENT.CAPTURE.REFUNDED - Refund processed."""
        refund_id = resource.get("id")
        amount = resource.get("amount", {}).get("value", "0.00")
        print(f"↩️ Refund Processed: {refund_id} - ${amount}")
        return {"action": "refund_processed", "refund_id": refund_id, "amount": amount}

    @staticmethod
    def payment_sale_completed(resource: Dict):
        """PAYMENT.SALE.COMPLETED - Sale completed (subscription payment)."""
        sale_id = resource.get("id")
        amount = resource.get("amount", {}).get("total", "0.00")
        print(f"💰 Sale Completed: {sale_id} - ${amount}")
        return {"action": "sale_completed", "sale_id": sale_id, "amount": amount}


class OrderEventHandler:
    """Handle order-related events."""

    @staticmethod
    def checkout_order_completed(resource: Dict):
        """CHECKOUT.ORDER.COMPLETED - Order fully completed."""
        order_id = resource.get("id")
        purchase_units = resource.get("purchase_units", [{}])
        amount = (
            purchase_units[0].get("amount", {}).get("value", "0.00")
            if purchase_units
            else "0.00"
        )
        print(f"📦 Order Completed: {order_id} - ${amount}")
        return {"action": "order_completed", "order_id": order_id, "amount": amount}

    @staticmethod
    def checkout_order_approved(resource: Dict):
        """CHECKOUT.ORDER.APPROVED - Buyer approved, ready to capture."""
        order_id = resource.get("id")
        print(f"👍 Order Approved: {order_id} - Ready to capture")
        return {"action": "order_approved", "order_id": order_id}


class SubscriptionEventHandler:
    """Handle subscription-related events."""

    @staticmethod
    def subscription_created(resource: Dict):
        sub_id = resource.get("id")
        plan_id = resource.get("plan_id")
        subscriber = resource.get("subscriber", {}).get("email_address", "N/A")
        print(f"🆕 Subscription Created: {sub_id} - Plan: {plan_id}")
        return {
            "action": "subscription_created",
            "subscription_id": sub_id,
            "subscriber": subscriber,
        }

    @staticmethod
    def subscription_activated(resource: Dict):
        sub_id = resource.get("id")
        print(f"✅ Subscription Activated: {sub_id}")
        return {"action": "subscription_activated", "subscription_id": sub_id}

    @staticmethod
    def subscription_cancelled(resource: Dict):
        sub_id = resource.get("id")
        print(f"❌ Subscription Cancelled: {sub_id}")
        return {"action": "subscription_cancelled", "subscription_id": sub_id}

    @staticmethod
    def subscription_suspended(resource: Dict):
        sub_id = resource.get("id")
        print(f"⏸️ Subscription Suspended: {sub_id}")
        return {"action": "subscription_suspended", "subscription_id": sub_id}

    @staticmethod
    def subscription_payment_failed(resource: Dict):
        sub_id = resource.get("id")
        print(f"💳❌ Subscription Payment Failed: {sub_id}")
        return {"action": "subscription_payment_failed", "subscription_id": sub_id}


# Event Router Map
EVENT_HANDLERS_MAP = {
    # Payments
    "PAYMENT.CAPTURE.COMPLETED": PaymentEventHandler.payment_capture_completed,
    "PAYMENT.CAPTURE.DENIED": PaymentEventHandler.payment_capture_denied,
    "PAYMENT.CAPTURE.REFUNDED": PaymentEventHandler.payment_capture_refunded,
    "PAYMENT.CAPTURE.REVERSED": PaymentEventHandler.payment_capture_refunded,
    "PAYMENT.SALE.COMPLETED": PaymentEventHandler.payment_sale_completed,
    "PAYMENT.SALE.REFUNDED": PaymentEventHandler.payment_capture_refunded,
    # Orders
    "CHECKOUT.ORDER.COMPLETED": OrderEventHandler.checkout_order_completed,
    "CHECKOUT.ORDER.APPROVED": OrderEventHandler.checkout_order_approved,
    # Subscriptions
    "BILLING.SUBSCRIPTION.CREATED": SubscriptionEventHandler.subscription_created,
    "BILLING.SUBSCRIPTION.ACTIVATED": SubscriptionEventHandler.subscription_activated,
    "BILLING.SUBSCRIPTION.CANCELLED": SubscriptionEventHandler.subscription_cancelled,
    "BILLING.SUBSCRIPTION.SUSPENDED": SubscriptionEventHandler.subscription_suspended,
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED": SubscriptionEventHandler.subscription_payment_failed,
}

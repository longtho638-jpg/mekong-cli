import stripe
from app.core.config import settings
from typing import Optional, Dict, Any

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    async def get_subscription(subscription_id: str) -> stripe.Subscription:
        return stripe.Subscription.retrieve(subscription_id)

    @staticmethod
    async def create_subscription(customer_id: str, price_id: str) -> stripe.Subscription:
        return stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
        )

    @staticmethod
    async def update_subscription(
        subscription_id: str,
        price_id: str,
        proration_behavior: str = "always_invoice"
    ) -> stripe.Subscription:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False,
            proration_behavior=proration_behavior,
            items=[{
                "id": subscription['items']['data'][0].id,
                "price": price_id,
            }]
        )

    @staticmethod
    async def list_invoices(customer_id: str, limit: int = 12) -> stripe.ListObject:
        return stripe.Invoice.list(
            customer=customer_id,
            limit=limit,
            status="paid"
        )

    @staticmethod
    async def attach_payment_method(customer_id: str, payment_method_id: str):
        # Attach to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id,
        )
        # Set as default
        stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
        return stripe.PaymentMethod.retrieve(payment_method_id)

    @staticmethod
    async def list_payment_methods(customer_id: str) -> stripe.ListObject:
        return stripe.PaymentMethod.list(
            customer=customer_id,
            type="card",
        )

stripe_service = StripeService()

"""
Example: Integrating PaymentOrchestrator into Existing Payment Service
=======================================================================

This example shows how to upgrade the existing PaymentService to use
PaymentOrchestrator for automatic failover.
"""

from backend.core.config.payment_config import get_payment_config
from backend.services.payment_orchestrator import PaymentOrchestrator


class EnhancedPaymentService:
    """
    Enhanced PaymentService with automatic failover.

    Replaces direct PayPal/Stripe calls with orchestrator.
    """

    def __init__(self):
        # Load config
        self.config = get_payment_config()

        # Initialize orchestrator
        self.orchestrator = PaymentOrchestrator(provider_order=self.config.provider_order)

        # Legacy services (for backward compatibility)
        from backend.services.payment_service import PaymentService

        self.legacy = PaymentService()

    def create_checkout_session(
        self,
        provider: str,  # Can be "auto" for orchestrator
        amount: float,
        currency: str = "USD",
        price_id: str = None,
        success_url: str = None,
        cancel_url: str = None,
        customer_email: str = None,
        tenant_id: str = None,
        mode: str = "subscription",
    ):
        """
        Create checkout session with automatic failover.

        Args:
            provider: "auto" for orchestrator, or specific provider name
        """
        if provider == "auto":
            # Use orchestrator for automatic failover
            result = self.orchestrator.create_checkout_session(
                amount=amount,
                currency=currency,
                price_id=price_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                tenant_id=tenant_id,
                mode=mode,
            )

            # Add metadata for logging
            result["orchestrator_stats"] = self.orchestrator.get_stats()
            return result

        else:
            # Use legacy service for specific provider
            return self.legacy.create_checkout_session(
                provider=provider,
                amount=amount,
                currency=currency,
                price_id=price_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                tenant_id=tenant_id,
                mode=mode,
            )

    def verify_webhook(self, provider: str, headers: dict, body: any, webhook_secret: str = None):
        """Verify webhook using orchestrator"""
        return self.orchestrator.verify_webhook(
            provider=provider, headers=headers, body=body, webhook_secret=webhook_secret
        )

    def get_failover_stats(self):
        """Get orchestrator statistics"""
        return self.orchestrator.get_stats()


# Example usage in FastAPI endpoint
"""
from fastapi import APIRouter, HTTPException
from backend.services.payment_service_enhanced import EnhancedPaymentService

router = APIRouter()
payment_service = EnhancedPaymentService()


@router.post("/api/v1/payments/create-checkout")
def create_checkout(
    amount: float,
    mode: str = "subscription",
    provider: str = "auto"  # Use "auto" for failover
):
    try:
        result = payment_service.create_checkout_session(
            provider=provider,
            amount=amount,
            mode=mode,
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v1/payments/stats")
def get_payment_stats():
    '''Get failover statistics'''
    return payment_service.get_failover_stats()
"""


# Example: Migration Strategy
"""
Migration from PaymentService to EnhancedPaymentService:

Step 1: Deploy EnhancedPaymentService alongside existing service
Step 2: Add feature flag for gradual rollout
Step 3: Monitor failover metrics
Step 4: Gradually increase traffic to orchestrator
Step 5: Remove legacy service once stable

# Feature flag example
USE_ORCHESTRATOR = os.getenv("USE_PAYMENT_ORCHESTRATOR", "false") == "true"

if USE_ORCHESTRATOR:
    service = EnhancedPaymentService()
else:
    service = PaymentService()
"""


# Example: Testing the integration
if __name__ == "__main__":
    import os

    # Set test credentials
    os.environ["PAYPAL_CLIENT_ID"] = "test_client_id"
    os.environ["PAYPAL_CLIENT_SECRET"] = "test_secret"
    os.environ["PAYPAL_MODE"] = "sandbox"
    os.environ["PAYMENT_PROVIDER_ORDER"] = "paypal,polar"

    # Initialize service
    service = EnhancedPaymentService()

    # Test checkout with failover
    print("Testing payment orchestrator...")

    try:
        result = service.create_checkout_session(
            provider="auto",  # Automatic failover
            amount=99.99,
            mode="subscription",
        )

        print("✅ Checkout created successfully")
        print(f"   Provider used: {result.get('provider')}")
        print(f"   Checkout URL: {result.get('url')}")
        print("\n📊 Orchestrator Stats:")

        stats = result.get("orchestrator_stats", {})
        print(f"   Total requests: {stats.get('total_requests')}")
        print(f"   Failovers: {stats.get('failovers')}")
        print(f"   Failover rate: {stats.get('failover_rate', 0):.2%}")

    except Exception as e:
        print(f"❌ Error: {e}")

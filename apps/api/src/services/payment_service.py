import stripe
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from src.config import settings
from src.models import CreditPack, User
from src.schemas import CheckoutSessionResponse

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_checkout_session(self, user_id: UUID, pack_id: UUID) -> CheckoutSessionResponse:
        # 1. Fetch Credit Pack
        stmt = select(CreditPack).where(CreditPack.id == pack_id, CreditPack.is_active == True)
        result = await self.db.execute(stmt)
        pack = result.scalar_one_or_none()

        if not pack:
            raise HTTPException(status_code=404, detail="Credit pack not found or inactive")

        # 2. Create Stripe Session
        # We need the user's email or customer ID. For now assuming we don't store stripe_customer_id yet,
        # or we just pass email to pre-fill.
        # Ideally we should fetch the user to pass customer email if we want to be nice.

        user_stmt = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
             raise HTTPException(status_code=404, detail="User not found")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price': pack.stripe_price_id,
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=f"http://localhost:3000/dashboard?success=true&session_id={{CHECKOUT_SESSION_ID}}", # TODO: Make configurable
                cancel_url=f"http://localhost:3000/dashboard?canceled=true", # TODO: Make configurable
                client_reference_id=str(user_id),
                metadata={
                    'pack_id': str(pack.id),
                    'credit_amount': str(pack.credit_amount),
                    'type': 'credit_purchase'
                },
                customer_email=user.email
            )
            return CheckoutSessionResponse(
                session_id=checkout_session.id,
                url=checkout_session.url
            )
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

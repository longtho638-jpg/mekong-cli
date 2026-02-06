from uuid import UUID
import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db
from src.services import LedgerService
from src.schemas import CreditRequest
from src.models import TransactionType

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await handle_checkout_session_completed(session, db)

    return {"status": "success"}

async def handle_checkout_session_completed(session: dict, db: AsyncSession):
    """
    Handle successful payment.
    1. Extract user_id and amount/metadata.
    2. Credit the wallet.
    """
    # Verify it is a credit purchase
    metadata = session.get('metadata', {})
    if metadata.get('type') != 'credit_purchase':
        return

    client_reference_id = session.get('client_reference_id')
    if not client_reference_id:
        # Should log error here
        return

    try:
        user_id = UUID(client_reference_id)

        # Determine amount to credit.
        # Ideally, 'credit_amount' is in metadata to avoid looking up the pack again
        # or we trust the metadata.
        credit_amount_str = metadata.get('credit_amount')
        if not credit_amount_str:
            return

        credit_amount = int(credit_amount_str)

        # Use LedgerService to deposit
        ledger_service = LedgerService(db)

        # First we need the wallet_id.
        # LedgerService has get_wallet(user_id)
        wallet = await ledger_service.get_wallet(user_id)
        if not wallet:
            # Create wallet if not exists? Or log error?
            # In our flow, wallet is created at user creation.
            return

        # Prepare Credit Request
        # reference_id ensures idempotency (stripe session id)
        credit_request = CreditRequest(
            amount=credit_amount,
            description=f"Stripe Purchase: {metadata.get('pack_id')}",
            reference_id=session['id'],
            meta=session
        )

        await ledger_service.credit_wallet(
            wallet_id=wallet.id,
            request=credit_request,
            type=TransactionType.DEPOSIT
        )

    except Exception as e:
        # Log error
        print(f"Error handling webhook: {e}")
        # In production, might want to re-raise to let Stripe retry,
        # BUT only if it's a transient error. If it's logic error, return 200 to stop retries.
        raise HTTPException(status_code=500, detail=str(e))

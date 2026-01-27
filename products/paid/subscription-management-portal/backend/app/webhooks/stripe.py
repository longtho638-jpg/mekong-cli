from fastapi import APIRouter, Request, Header, HTTPException
from app.core.config import settings
from app.core.supabase import supabase
import stripe
from datetime import datetime

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    sig_header = stripe_signature
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        await handle_invoice_payment_succeeded(invoice)
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        await handle_subscription_updated(subscription)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await handle_subscription_deleted(subscription)

    return {"status": "success"}

async def handle_invoice_payment_succeeded(invoice):
    # Save invoice to DB
    # We need to find the user associated with this customer
    customer_id = invoice.get('customer')

    # Find user by customer_id
    response = supabase.table("subscriptions").select("user_id").eq("stripe_customer_id", customer_id).execute()
    if not response.data:
        print(f"User not found for customer {customer_id}")
        return

    user_id = response.data[0]['user_id']

    invoice_data = {
        "user_id": user_id,
        "stripe_invoice_id": invoice.get('id'),
        "stripe_subscription_id": invoice.get('subscription'),
        "amount_paid": invoice.get('amount_paid'),
        "currency": invoice.get('currency'),
        "status": invoice.get('status'),
        "invoice_pdf": invoice.get('invoice_pdf'),
        "period_start": datetime.fromtimestamp(invoice.get('period_start')).isoformat(),
        "period_end": datetime.fromtimestamp(invoice.get('period_end')).isoformat()
    }

    # Check if exists
    existing = supabase.table("invoices").select("id").eq("stripe_invoice_id", invoice.get('id')).execute()
    if existing.data:
        supabase.table("invoices").update(invoice_data).eq("id", existing.data[0]['id']).execute()
    else:
        supabase.table("invoices").insert(invoice_data).execute()

async def handle_subscription_updated(subscription):
    customer_id = subscription.get('customer')

    response = supabase.table("subscriptions").select("id").eq("stripe_customer_id", customer_id).execute()
    if not response.data:
        return

    sub_id = response.data[0]['id']

    update_data = {
        "status": subscription.get('status'),
        "plan_id": subscription['items']['data'][0]['price']['id'],
        "current_period_start": datetime.fromtimestamp(subscription.get('current_period_start')).isoformat(),
        "current_period_end": datetime.fromtimestamp(subscription.get('current_period_end')).isoformat(),
        "cancel_at_period_end": subscription.get('cancel_at_period_end')
    }

    supabase.table("subscriptions").update(update_data).eq("id", sub_id).execute()

async def handle_subscription_deleted(subscription):
    customer_id = subscription.get('customer')

    response = supabase.table("subscriptions").select("id").eq("stripe_customer_id", customer_id).execute()
    if not response.data:
        return

    sub_id = response.data[0]['id']

    update_data = {
        "status": "canceled",
        "cancel_at_period_end": False
    }

    supabase.table("subscriptions").update(update_data).eq("id", sub_id).execute()

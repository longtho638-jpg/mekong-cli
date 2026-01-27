from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.models.schemas import InvoiceResponse, PaymentMethodResponse, PaymentMethodRequest, MessageResponse
from app.core.stripe_utils import stripe_service
from app.core.supabase import Client
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/history", response_model=List[InvoiceResponse])
async def get_billing_history(
    current_user: dict = Depends(deps.get_current_user),
    supabase: Client = Depends(deps.get_supabase)
):
    user_id = current_user.get("id")

    # Try fetching from local DB first
    response = supabase.table("invoices").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()

    if response.data:
        return [
            InvoiceResponse(
                id=inv["id"],
                stripe_invoice_id=inv["stripe_invoice_id"],
                amount_paid=inv["amount_paid"],
                currency=inv["currency"],
                status=inv["status"],
                date=datetime.fromisoformat(inv["created_at"].replace('Z', '+00:00')) if isinstance(inv["created_at"], str) else inv["created_at"],
                pdf_url=inv["invoice_pdf"]
            ) for inv in response.data
        ]

    # If empty, maybe sync from Stripe?
    # For now, return empty list
    return []

@router.post("/payment-method", response_model=PaymentMethodResponse)
async def add_payment_method(
    data: PaymentMethodRequest,
    current_user: dict = Depends(deps.get_current_user),
    supabase: Client = Depends(deps.get_supabase)
):
    user_id = current_user.get("id")

    # Get customer ID from subscriptions table (assuming 1:1 user:customer)
    sub_response = supabase.table("subscriptions").select("stripe_customer_id").eq("user_id", user_id).single().execute()
    if not sub_response.data:
         raise HTTPException(status_code=404, detail="Customer not found")

    customer_id = sub_response.data["stripe_customer_id"]

    try:
        pm = await stripe_service.attach_payment_method(customer_id, data.payment_method_id)

        # Save to DB
        pm_data = {
            "user_id": user_id,
            "stripe_payment_method_id": pm.id,
            "brand": pm.card.brand,
            "last4": pm.card.last4,
            "exp_month": pm.card.exp_month,
            "exp_year": pm.card.exp_year,
            "is_default": True # We set it as default in stripe_utils
        }

        # Upsert or Insert
        # For MVP just insert
        result = supabase.table("payment_methods").insert(pm_data).execute()

        if not result.data:
             raise HTTPException(status_code=500, detail="Failed to save payment method")

        saved_pm = result.data[0]

        return PaymentMethodResponse(
            id=saved_pm["id"],
            stripe_payment_method_id=saved_pm["stripe_payment_method_id"],
            brand=saved_pm["brand"],
            last4=saved_pm["last4"],
            exp_month=saved_pm["exp_month"],
            exp_year=saved_pm["exp_year"],
            is_default=saved_pm["is_default"]
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

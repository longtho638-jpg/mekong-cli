from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.api.schemas.public_api import InvoicePublic
from backend.middleware.api_auth import get_current_api_key, require_scope
from core.infrastructure.database import get_db

router = APIRouter(prefix="/invoices", tags=["Public API - Invoices"])

@router.get("/", response_model=List[InvoicePublic])
async def list_invoices(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:invoices"))
):
    """
    List invoices for the authenticated user/tenant.
    """
    db = get_db()
    user_id = api_key["user_id"]

    # Invoices might be in `invoices` table or `payments` table depending on architecture.
    # From `backend/models/invoice.py`, it seems we have an Invoice model, presumably mapped to `invoices` table.
    # However, `backend/database/migrations/20260127_001_payment_events.sql` had a CREATE TABLE IF NOT EXISTS invoices.

    query = db.table("invoices").select("*").eq("tenant_id", user_id)

    if status:
        query = query.eq("status", status)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    result = query.execute()

    invoices = []
    for record in result.data:
        invoices.append(InvoicePublic(
            id=record.get("id"),
            amount_due=record.get("amount", 0.0), # Assuming full amount is due for simplicity or need check
            amount_paid=record.get("amount", 0.0) if record.get("status") == "paid" else 0.0,
            status=record.get("status", "draft"),
            currency=record.get("currency", "USD"),
            created_at=record.get("created_at"),
            hosted_invoice_url=record.get("payment_url")
        ))

    return invoices

@router.get("/{invoice_id}", response_model=InvoicePublic)
async def get_invoice(
    invoice_id: str,
    api_key: dict = Depends(get_current_api_key),
    _auth: bool = Depends(require_scope("read:invoices"))
):
    """
    Get a specific invoice.
    """
    db = get_db()
    user_id = api_key["user_id"]

    result = db.table("invoices")\
        .select("*")\
        .eq("tenant_id", user_id)\
        .eq("id", invoice_id)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Invoice not found")

    record = result.data[0]

    return InvoicePublic(
        id=record.get("id"),
        amount_due=record.get("amount", 0.0),
        amount_paid=record.get("amount", 0.0) if record.get("status") == "paid" else 0.0,
        status=record.get("status", "draft"),
        currency=record.get("currency", "USD"),
        created_at=record.get("created_at"),
        hosted_invoice_url=record.get("payment_url")
    )

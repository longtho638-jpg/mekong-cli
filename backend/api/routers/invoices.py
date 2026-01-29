from typing import List

from fastapi import APIRouter, Depends, HTTPException

from backend.api.security.rbac import require_viewer
from backend.models.invoice import Invoice, InvoiceStatus

router = APIRouter(prefix="/api/v1/invoices", tags=["invoices"])


@router.get("/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    """Get invoice by ID"""
    # Mock response for now
    return Invoice(
        id=invoice_id,
        invoice_number=f"INV-{invoice_id}",
        amount=100.0,
        tax=10.0,
        total=110.0,
        currency="USD",
        status=InvoiceStatus.SENT,
        service_type="consulting",
    )


@router.get("/", response_model=List[Invoice])
async def list_invoices():
    """List all invoices"""
    return [
        Invoice(
            id="123",
            invoice_number="INV-123",
            amount=100.0,
            tax=10.0,
            total=110.0,
            currency="USD",
            status=InvoiceStatus.SENT,
        )
    ]

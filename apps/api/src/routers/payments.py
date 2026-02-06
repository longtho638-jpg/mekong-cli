from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from src.database import get_db
from src.schemas import CheckoutSessionCreate, CheckoutSessionResponse
from src.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/checkout", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    request: CheckoutSessionCreate,
    user_id: UUID, # In a real app, this would be injected via current_user dependency
    db: AsyncSession = Depends(get_db)
):
    service = PaymentService(db)
    return await service.create_checkout_session(user_id, request.pack_id)

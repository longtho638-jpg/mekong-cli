from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.schemas import (
    UserCreate, UserRead,
    WalletRead,
    TransactionRead, CreditRequest, ChargeRequest
)
from src.services import LedgerService
from src.models import TransactionType

router = APIRouter(prefix="/ledger", tags=["ledger"])

@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    service = LedgerService(db)
    try:
        return await service.create_user(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}/wallet", response_model=WalletRead)
async def get_wallet(user_id: UUID, db: AsyncSession = Depends(get_db)):
    service = LedgerService(db)
    wallet = await service.get_wallet(user_id)
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

@router.post("/wallets/{wallet_id}/credit", response_model=TransactionRead)
async def credit_wallet(
    wallet_id: UUID,
    request: CreditRequest,
    db: AsyncSession = Depends(get_db)
):
    service = LedgerService(db)
    try:
        # Default to DEPOSIT for generic credits, but could be parameter
        return await service.credit_wallet(wallet_id, request, type=TransactionType.DEPOSIT)
    except ValueError as e:
        # Could be wallet not found or other issues
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wallets/{wallet_id}/charge", response_model=TransactionRead)
async def charge_wallet(
    wallet_id: UUID,
    request: ChargeRequest,
    db: AsyncSession = Depends(get_db)
):
    service = LedgerService(db)
    try:
        return await service.charge_wallet(wallet_id, request, type=TransactionType.USAGE)
    except ValueError as e:
        if "Insufficient funds" in str(e):
            raise HTTPException(status_code=402, detail=str(e)) # 402 Payment Required
        raise HTTPException(status_code=400, detail=str(e))

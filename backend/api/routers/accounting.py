from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/accounting", tags=["accounting"])

class LedgerEntry(BaseModel):
    id: str
    date: str
    amount: float
    description: str

class Transaction(BaseModel):
    id: str
    amount: float
    type: str
    status: str

@router.get("/ledger")
async def get_ledger() -> List[LedgerEntry]:
    """Get accounting ledger"""
    return []

@router.post("/transactions")
async def create_transaction(transaction: Transaction) -> Transaction:
    """Create accounting transaction"""
    return transaction

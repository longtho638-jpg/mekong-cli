from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from src.models import TransactionType

# --- User Schemas ---

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Wallet Schemas ---

class WalletBase(BaseModel):
    pass

class WalletRead(WalletBase):
    id: UUID
    user_id: UUID
    balance: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletCreate(WalletBase):
    user_id: UUID

# --- Transaction Schemas ---

class TransactionBase(BaseModel):
    amount: int
    type: TransactionType
    description: str
    reference_id: Optional[str] = None
    meta: Optional[dict] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: UUID
    wallet_id: UUID
    balance_after: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Service Request Schemas ---

class CreditRequest(BaseModel):
    amount: int = Field(gt=0, description="Amount to credit (positive integer)")
    description: str
    reference_id: Optional[str] = None
    meta: Optional[dict] = None

class ChargeRequest(BaseModel):
    amount: int = Field(gt=0, description="Amount to charge (positive integer)")
    description: str
    reference_id: Optional[str] = None
    meta: Optional[dict] = None

# --- Payment Schemas ---

class CheckoutSessionCreate(BaseModel):
    pack_id: UUID

class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

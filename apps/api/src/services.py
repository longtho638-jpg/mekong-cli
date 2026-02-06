from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models import User, Wallet, Transaction, TransactionType
from src.schemas import UserCreate, CreditRequest, ChargeRequest

class LedgerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_in: UserCreate) -> User:
        """Create a new user and initialize their wallet atomically."""
        # Check if user exists
        stmt = select(User).where(User.email == user_in.email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("User already exists")

        # Create User
        user = User(email=user_in.email)
        self.db.add(user)
        await self.db.flush() # flush to get user.id

        # Create Wallet
        wallet = Wallet(user_id=user.id)
        self.db.add(wallet)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_wallet(self, user_id: UUID) -> Optional[Wallet]:
        stmt = select(Wallet).where(Wallet.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_wallet_by_id(self, wallet_id: UUID) -> Optional[Wallet]:
        stmt = select(Wallet).where(Wallet.id == wallet_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def credit_wallet(self, wallet_id: UUID, request: CreditRequest, type: TransactionType = TransactionType.DEPOSIT) -> Transaction:
        """
        Add funds to a wallet.
        Uses pessimistic locking (FOR UPDATE) to ensure balance consistency.
        """
        # Handle transaction: use nested (SAVEPOINT) if already in transaction, otherwise begin new.
        if self.db.in_transaction():
             cm = self.db.begin_nested()
        else:
             cm = self.db.begin()

        async with cm:
            # Lock the wallet row
            stmt = select(Wallet).where(Wallet.id == wallet_id).with_for_update()
            result = await self.db.execute(stmt)
            wallet = result.scalar_one_or_none()

            if not wallet:
                raise ValueError("Wallet not found")

            # Check idempotency if reference_id is provided
            if request.reference_id:
                stmt = select(Transaction).where(Transaction.reference_id == request.reference_id)
                result = await self.db.execute(stmt)
                existing_tx = result.scalar_one_or_none()
                if existing_tx:
                    return existing_tx

            # Update Balance
            wallet.balance += request.amount
            wallet.version += 1 # Increment version

            # Create Transaction Record
            transaction = Transaction(
                wallet_id=wallet.id,
                amount=request.amount,
                balance_after=wallet.balance,
                type=type,
                description=request.description,
                reference_id=request.reference_id,
                meta=request.meta
            )
            self.db.add(transaction)
            await self.db.flush()

            # No need to commit here as the 'async with self.db.begin()' block handles commit/rollback
            return transaction

    async def charge_wallet(self, wallet_id: UUID, request: ChargeRequest, type: TransactionType = TransactionType.USAGE) -> Transaction:
        """
        Deduct funds from a wallet.
        Uses pessimistic locking to ensure sufficient funds and consistency.
        """
        # Handle transaction: use nested (SAVEPOINT) if already in transaction, otherwise begin new.
        if self.db.in_transaction():
             cm = self.db.begin_nested()
        else:
             cm = self.db.begin()

        async with cm:
            # Lock the wallet row
            stmt = select(Wallet).where(Wallet.id == wallet_id).with_for_update()
            result = await self.db.execute(stmt)
            wallet = result.scalar_one_or_none()

            if not wallet:
                raise ValueError("Wallet not found")

            # Check idempotency
            if request.reference_id:
                stmt = select(Transaction).where(Transaction.reference_id == request.reference_id)
                result = await self.db.execute(stmt)
                existing_tx = result.scalar_one_or_none()
                if existing_tx:
                    return existing_tx

            # Check sufficient funds
            if wallet.balance < request.amount:
                raise ValueError(f"Insufficient funds. Current balance: {wallet.balance}, Required: {request.amount}")

            # Deduct Balance
            wallet.balance -= request.amount
            wallet.version += 1

            # Create Transaction Record (negative amount logic handled in display/logic, but stored as absolute magnitude usually?
            # OR stored as negative?
            # Looking at models.py comment: "amount: Mapped[int] ... # +/- amount"
            # So we should store negative for charges to make aggregation easier.

            tx_amount = -request.amount

            transaction = Transaction(
                wallet_id=wallet.id,
                amount=tx_amount,
                balance_after=wallet.balance,
                type=type,
                description=request.description,
                reference_id=request.reference_id,
                meta=request.meta
            )
            self.db.add(transaction)
            await self.db.flush()

            return transaction

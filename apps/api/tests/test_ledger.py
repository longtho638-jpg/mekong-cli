import pytest
import uuid
from src.services import LedgerService
from src.schemas import CreditRequest, ChargeRequest
from src.models import TransactionType

@pytest.mark.asyncio
async def test_credit_wallet(db_session, test_wallet):
    service = LedgerService(db_session)
    amount = 1000
    request = CreditRequest(
        amount=amount,
        description="Test Deposit",
        reference_id=str(uuid.uuid4())
    )

    tx = await service.credit_wallet(test_wallet.id, request)

    assert tx.amount == amount
    assert tx.balance_after == amount
    assert tx.type == TransactionType.DEPOSIT

    # Verify wallet balance updated
    wallet = await service.get_wallet_by_id(test_wallet.id)
    assert wallet.balance == amount

@pytest.mark.asyncio
async def test_credit_wallet_idempotency(db_session, test_wallet):
    service = LedgerService(db_session)
    amount = 500
    ref_id = str(uuid.uuid4())
    request = CreditRequest(
        amount=amount,
        description="Test Idempotency",
        reference_id=ref_id
    )

    # First call
    tx1 = await service.credit_wallet(test_wallet.id, request)
    assert tx1.amount == amount

    # Second call with same ref_id
    tx2 = await service.credit_wallet(test_wallet.id, request)

    # Should return same transaction object (or at least same ID)
    assert tx1.id == tx2.id

    wallet = await service.get_wallet_by_id(test_wallet.id)
    # Balance should be just 'amount', not 2 * amount
    assert wallet.balance == amount

@pytest.mark.asyncio
async def test_charge_wallet(db_session, test_wallet):
    service = LedgerService(db_session)

    # Setup: Credit first
    credit_req = CreditRequest(amount=1000, description="Setup", reference_id=str(uuid.uuid4()))
    await service.credit_wallet(test_wallet.id, credit_req)

    # Charge
    charge_amount = 300
    charge_req = ChargeRequest(
        amount=charge_amount,
        description="Test Charge",
        reference_id=str(uuid.uuid4())
    )

    tx = await service.charge_wallet(test_wallet.id, charge_req)

    assert tx.amount == -charge_amount
    assert tx.type == TransactionType.USAGE
    assert tx.balance_after == 1000 - charge_amount

    wallet = await service.get_wallet_by_id(test_wallet.id)
    assert wallet.balance == 700

@pytest.mark.asyncio
async def test_insufficient_funds(db_session, test_wallet):
    service = LedgerService(db_session)

    # Wallet is 0 initially
    charge_req = ChargeRequest(
        amount=100,
        description="Fail Charge",
        reference_id=str(uuid.uuid4())
    )

    with pytest.raises(ValueError, match="Insufficient funds"):
        await service.charge_wallet(test_wallet.id, charge_req)

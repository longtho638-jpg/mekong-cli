import pytest
from unittest.mock import MagicMock, patch
from src.routers.webhooks import handle_checkout_session_completed
from src.services import LedgerService

@pytest.mark.asyncio
async def test_stripe_webhook_credit(db_session, test_user, test_wallet, test_credit_pack):
    """
    Test that handle_checkout_session_completed correctly credits the wallet
    using data from the Stripe session.
    """
    # Prepare session data simulating Stripe payload
    # Note: in webhooks.py we use session['id'] as reference_id
    session_data = {
        'id': 'sess_test_123',
        'client_reference_id': str(test_user.id),
        'metadata': {
            'type': 'credit_purchase',
            'pack_id': str(test_credit_pack.id),
            'credit_amount': str(test_credit_pack.credit_amount)
        }
    }

    # Call the handler
    await handle_checkout_session_completed(session_data, db_session)

    # Verify wallet credited
    service = LedgerService(db_session)
    wallet = await service.get_wallet_by_id(test_wallet.id)

    assert wallet.balance == test_credit_pack.credit_amount

    # Verify Idempotency (call again)
    await handle_checkout_session_completed(session_data, db_session)
    wallet_recheck = await service.get_wallet_by_id(test_wallet.id)
    assert wallet_recheck.balance == test_credit_pack.credit_amount # Should not double credit

@pytest.mark.asyncio
async def test_stripe_webhook_invalid_metadata(db_session):
    """Test that it returns early if metadata type is not credit_purchase"""
    session_data = {
        'id': 'sess_ignore',
        'metadata': {
            'type': 'subscription' # Not credit_purchase
        }
    }

    # Should just return None/void and not raise error
    await handle_checkout_session_completed(session_data, db_session)

@pytest.mark.asyncio
async def test_stripe_webhook_no_user(db_session):
    """Test that it handles missing client_reference_id gracefully"""
    session_data = {
        'id': 'sess_no_user',
        'metadata': {
            'type': 'credit_purchase',
            'credit_amount': '1000'
        }
        # missing client_reference_id
    }

    await handle_checkout_session_completed(session_data, db_session)

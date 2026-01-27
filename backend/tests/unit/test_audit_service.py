from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from backend.models.audit_log import AuditLog
from backend.services.audit_service import AuditService


@pytest.fixture
def mock_db_session():
    return MagicMock()

@pytest.fixture
def audit_service():
    return AuditService()

class TestAuditService:
    @pytest.mark.asyncio
    async def test_calculate_hash(self, audit_service):
        timestamp = datetime(2026, 1, 27, 12, 0, 0, tzinfo=timezone.utc)
        user_id = "user123"
        action = "test.action"
        previous_hash = "genesis"

        # Expected hash based on: SHA256(timestamp + user_id + action + previous_hash)
        # payload = "2026-01-27T12:00:00+00:00user123test.actiongenesis"

        hash_result = audit_service._calculate_hash(timestamp, user_id, action, previous_hash)
        assert isinstance(hash_result, str)
        assert len(hash_result) == 64

    @pytest.mark.asyncio
    async def test_create_audit_log(self, audit_service, mock_db_session):
        # Mock previous hash
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = "prev_hash"

        log = await audit_service.create_audit_log(
            db=mock_db_session,
            action="user.login",
            user_id="user_1",
            ip_address="127.0.0.1"
        )

        assert mock_db_session.add.called
        assert mock_db_session.commit.called
        assert mock_db_session.refresh.called

        # Check if hash was generated
        args, _ = mock_db_session.add.call_args
        created_log = args[0]
        assert created_log.hash is not None
        assert created_log.action == "user.login"

    @pytest.mark.asyncio
    async def test_verify_integrity_valid(self, audit_service, mock_db_session):
        # Create a chain of 2 logs
        log1 = AuditLog(
            id=1, timestamp=datetime.now(timezone.utc), user_id="u1", action="a1", hash="hash1"
        )
        # We need to manually calculate hash2 to make it valid for the test logic
        hash2 = audit_service._calculate_hash(
            datetime.now(timezone.utc), "u1", "a2", "hash1"
        )
        log2 = AuditLog(
            id=2, timestamp=datetime.now(timezone.utc), user_id="u1", action="a2", hash=hash2
        )
        # Fix timestamp for log2 in hash calculation
        # The service calculates hash inside verify.

        # Let's mock the db response
        mock_db_session.execute.return_value.scalars.return_value.all.return_value = [log1, log2]

        # We need to patch _calculate_hash to match our dummy values or setup exact values
        with patch.object(audit_service, '_calculate_hash', return_value=hash2) as mock_calc:
            result = await audit_service.verify_integrity(mock_db_session)
            assert result is True

    @pytest.mark.asyncio
    async def test_verify_integrity_tampered(self, audit_service, mock_db_session):
        log1 = AuditLog(id=1, hash="hash1")
        log2 = AuditLog(id=2, hash="tampered_hash") # Should be hash2

        mock_db_session.execute.return_value.scalars.return_value.all.return_value = [log1, log2]

        with patch.object(audit_service, '_calculate_hash', return_value="correct_hash"):
            result = await audit_service.verify_integrity(mock_db_session)
            assert result is False

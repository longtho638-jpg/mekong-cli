"""
Tests for RaaS Billing Sync Service

Tests cover:
- Idempotency key generation
- Payload schema validation
- Retry logic with exponential backoff
- Error handling
- Database operations
"""

import json
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from src.raas.billing_sync import (
    BillingSyncService,
    SyncConfig,
    UsageRecord,
    get_service,
    reset_service,
)


@pytest.fixture
def test_db_path(tmp_path):
    """Create temporary test database path."""
    return str(tmp_path / "test_usage.db")


@pytest.fixture
def sync_service(test_db_path):
    """Create BillingSyncService instance for testing."""
    config = SyncConfig(
        db_path=test_db_path,
        gateway_url="https://raas.agencyos.network/v2/usage",
        api_key="mk_test_key_12345",
        batch_size=10,
        max_retries=3,
        base_backoff_seconds=0.01,  # Fast backoff for tests
        max_backoff_seconds=0.1,
    )
    service = BillingSyncService(config)
    yield service
    service.close()


@pytest.fixture
def sample_records():
    """Create sample usage records for testing."""
    now = datetime.now(timezone.utc).isoformat()
    return [
        UsageRecord(
            id=1,
            event_id="evt_001",
            event_type="cli:command",
            tenant_id="tenant_123",
            timestamp=now,
            endpoint="/api/v1/cook",
            model="qwen3.5-plus",
            input_tokens=100,
            output_tokens=50,
            duration_ms=1500.0,
            metadata={"command": "cook", "exit_code": 0},
            synced=False,
            created_at=now,
        ),
        UsageRecord(
            id=2,
            event_id="evt_002",
            event_type="llm:call",
            tenant_id="tenant_123",
            timestamp=now,
            endpoint="/api/v1/plan",
            model="qwen3-coder-plus",
            input_tokens=200,
            output_tokens=100,
            duration_ms=2000.0,
            metadata={"command": "plan", "exit_code": 0},
            synced=False,
            created_at=now,
        ),
    ]


class TestIdempotencyKeyGeneration:
    """Test idempotency key generation."""

    def test_generates_unique_key(self, sync_service, sample_records):
        """Each unique batch should produce unique key."""
        key1 = sync_service.generate_idempotency_key(sample_records)
        assert key1.startswith("mk_idem_")
        assert len(key1) == len("mk_idem_") + 16  # 16 hex chars

    def test_same_records_produce_same_key(self, sync_service, sample_records):
        """Same records should always produce same key."""
        key1 = sync_service.generate_idempotency_key(sample_records)
        key2 = sync_service.generate_idempotency_key(sample_records)
        assert key1 == key2

    def test_different_records_produce_different_key(self, sync_service, sample_records):
        """Different records should produce different key."""
        key1 = sync_service.generate_idempotency_key(sample_records)

        # Create different records
        different_records = [
            UsageRecord(
                id=3,
                event_id="evt_003",  # Different event_id
                event_type="cli:command",
                tenant_id="tenant_123",
                timestamp=datetime.now(timezone.utc).isoformat(),
                endpoint="/api/v1/test",
                model="qwen3.5-plus",
                input_tokens=50,
                output_tokens=25,
                duration_ms=500.0,
                metadata={},
                synced=False,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        ]
        key2 = sync_service.generate_idempotency_key(different_records)
        assert key1 != key2

    def test_order_independent(self, sync_service, sample_records):
        """Key should be same regardless of record order."""
        key1 = sync_service.generate_idempotency_key(sample_records)
        # Reverse order
        reversed_records = list(reversed(sample_records))
        key2 = sync_service.generate_idempotency_key(reversed_records)
        assert key1 == key2


class TestPayloadBuilding:
    """Test payload building for RaaS Gateway."""

    def test_builds_valid_payload(self, sync_service, sample_records):
        """Payload should match expected schema."""
        payload = sync_service.build_payload(sample_records)

        assert "tenant_id" in payload
        assert "license_key" in payload
        assert "events" in payload
        assert "summary" in payload

        assert payload["tenant_id"] == "tenant_123"
        assert payload["license_key"] == "mk_test_key_12345"
        assert len(payload["events"]) == 2

    def test_events_have_required_fields(self, sync_service, sample_records):
        """Each event should have all required fields."""
        payload = sync_service.build_payload(sample_records)

        for event in payload["events"]:
            assert "event_id" in event
            assert "event_type" in event
            assert "timestamp" in event
            assert "input_tokens" in event
            assert "output_tokens" in event
            assert "duration_ms" in event
            assert "metadata" in event

    def test_summary_calculation(self, sync_service, sample_records):
        """Summary should correctly aggregate metrics."""
        payload = sync_service.build_payload(sample_records)
        summary = payload["summary"]

        assert summary["total_events"] == 2
        assert summary["total_input_tokens"] == 300  # 100 + 200
        assert summary["total_output_tokens"] == 150  # 50 + 100
        assert summary["total_duration_ms"] == 3500.0  # 1500 + 2000

    def test_empty_records(self, sync_service):
        """Should handle empty records list."""
        payload = sync_service.build_payload([])

        assert payload["tenant_id"] == ""
        assert payload["license_key"] == "mk_test_key_12345"
        assert payload["events"] == []
        assert payload["summary"]["total_events"] == 0


class TestDatabaseOperations:
    """Test SQLite database operations."""

    def test_fetch_unsynced_records(self, sync_service, sample_records):
        """Should fetch only unsynced records."""
        conn = sync_service._get_connection()

        # Insert test records
        for record in sample_records:
            conn.execute("""
                INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                    endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.event_id, record.event_type, record.tenant_id, record.timestamp,
                record.endpoint, record.model, record.input_tokens, record.output_tokens,
                record.duration_ms, json.dumps(record.metadata), 0
            ))
        conn.commit()

        # Fetch unsynced
        records = sync_service.fetch_unsynced_records()
        assert len(records) == 2

    def test_fetch_with_limit(self, sync_service, sample_records):
        """Should respect limit parameter."""
        conn = sync_service._get_connection()

        for record in sample_records:
            conn.execute("""
                INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                    endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.event_id, record.event_type, record.tenant_id, record.timestamp,
                record.endpoint, record.model, record.input_tokens, record.output_tokens,
                record.duration_ms, json.dumps(record.metadata), 0
            ))
        conn.commit()

        records = sync_service.fetch_unsynced_records(limit=1)
        assert len(records) == 1

    def test_mark_as_synced(self, sync_service, sample_records):
        """Should mark records as synced."""
        conn = sync_service._get_connection()

        # Insert record
        record = sample_records[0]
        conn.execute("""
            INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.event_id, record.event_type, record.tenant_id, record.timestamp,
            record.endpoint, record.model, record.input_tokens, record.output_tokens,
            record.duration_ms, json.dumps(record.metadata), 0
        ))
        conn.commit()

        # Mark as synced
        sync_service.mark_as_synced([record.id])

        # Verify
        cursor = conn.execute(
            "SELECT synced, synced_at FROM usage_records WHERE id = ?", (record.id,)
        )
        row = cursor.fetchone()
        assert row["synced"] == 1
        assert row["synced_at"] is not None

    def test_mark_sync_failed(self, sync_service, sample_records):
        """Should record failed sync attempts."""
        conn = sync_service._get_connection()

        record = sample_records[0]
        conn.execute("""
            INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.event_id, record.event_type, record.tenant_id, record.timestamp,
            record.endpoint, record.model, record.input_tokens, record.output_tokens,
            record.duration_ms, json.dumps(record.metadata), 0
        ))
        conn.commit()

        # Mark as failed
        sync_service.mark_sync_failed([record.id], "Test error message")

        # Verify
        cursor = conn.execute(
            "SELECT sync_attempts, last_sync_error FROM usage_records WHERE id = ?",
            (record.id,)
        )
        row = cursor.fetchone()
        assert row["sync_attempts"] >= 1
        assert row["last_sync_error"] == "Test error message"


class TestRetryLogic:
    """Test retry logic with exponential backoff."""

    def test_backoff_calculation(self, sync_service):
        """Backoff should follow exponential pattern."""
        # base_backoff_seconds = 0.01
        assert sync_service._calculate_backoff(0) == 0.01  # 0.01 * 2^0
        assert sync_service._calculate_backoff(1) == 0.02  # 0.01 * 2^1
        assert sync_service._calculate_backoff(2) == 0.04  # 0.01 * 2^2
        assert sync_service._calculate_backoff(3) == 0.08  # 0.01 * 2^3

    def test_backoff_respects_max(self, sync_service):
        """Backoff should not exceed max_backoff_seconds."""
        # max_backoff_seconds = 0.1
        backoff = sync_service._calculate_backoff(10)  # 0.01 * 2^10 = 10.24
        assert backoff == 0.1  # Capped at max

    @patch('httpx.Client')
    def test_retry_on_server_error(self, mock_client_class, sync_service):
        """Should retry on 5xx errors."""
        mock_response = MagicMock()
        mock_response.status_code = 503
        mock_response.text = "Service Unavailable"

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_class.return_value = mock_client

        payload = {"test": "data"}
        idempotency_key = "mk_idem_test"

        success, response, error = sync_service.send_to_gateway(payload, idempotency_key)

        # Should retry max_retries times (3)
        assert mock_client.post.call_count == 3
        assert success is False

    @patch('httpx.Client')
    def test_no_retry_on_client_error(self, mock_client_class, sync_service):
        """Should NOT retry on 4xx errors."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_class.return_value = mock_client

        payload = {"test": "data"}
        idempotency_key = "mk_idem_test"

        success, response, error = sync_service.send_to_gateway(payload, idempotency_key)

        # Should NOT retry on 4xx
        assert mock_client.post.call_count == 1
        assert success is False

    @patch('httpx.Client')
    def test_success_on_first_try(self, mock_client_class, sync_service):
        """Should return immediately on success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "accepted"}

        mock_client = MagicMock()
        mock_client.post.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_class.return_value = mock_client

        payload = {"test": "data"}
        idempotency_key = "mk_idem_test"

        success, response, error = sync_service.send_to_gateway(payload, idempotency_key)

        assert mock_client.post.call_count == 1
        assert success is True
        assert response == {"status": "accepted"}
        assert error is None


class TestSyncToGateway:
    """Test full sync workflow."""

    @patch.object(BillingSyncService, 'send_to_gateway')
    def test_successful_sync(self, mock_send, sync_service, sample_records):
        """Should sync records successfully."""
        # Mock successful send
        mock_send.return_value = (True, {"status": "accepted"}, None)

        # Insert records
        conn = sync_service._get_connection()
        for record in sample_records:
            conn.execute("""
                INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                    endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.event_id, record.event_type, record.tenant_id, record.timestamp,
                record.endpoint, record.model, record.input_tokens, record.output_tokens,
                record.duration_ms, json.dumps(record.metadata), 0
            ))
        conn.commit()

        # Sync
        result = sync_service.sync_to_gateway()

        assert result.success is True
        assert result.records_synced == 2
        assert result.records_failed == 0
        assert result.error is None

    @patch.object(BillingSyncService, 'send_to_gateway')
    def test_failed_sync(self, mock_send, sync_service, sample_records):
        """Should handle sync failure."""
        # Mock failed send
        mock_send.return_value = (False, None, "Gateway timeout")

        # Insert records
        conn = sync_service._get_connection()
        for record in sample_records:
            conn.execute("""
                INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                    endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.event_id, record.event_type, record.tenant_id, record.timestamp,
                record.endpoint, record.model, record.input_tokens, record.output_tokens,
                record.duration_ms, json.dumps(record.metadata), 0
            ))
        conn.commit()

        # Sync
        result = sync_service.sync_to_gateway()

        assert result.success is False
        assert result.records_synced == 0
        assert result.records_failed == 2
        assert result.error == "Gateway timeout"

    def test_sync_no_records(self, sync_service):
        """Should handle empty sync gracefully."""
        result = sync_service.sync_to_gateway()

        assert result.success is True
        assert result.records_synced == 0
        assert result.gateway_response == {"message": "No unsynced records"}


class TestSyncHistory:
    """Test sync history recording."""

    def test_record_sync_history(self, sync_service):
        """Should record sync attempts in history table."""
        sync_service.record_sync_history(
            idempotency_key="mk_idem_test",
            records_count=5,
            payload_size=1024,
            status="success",
            gateway_response={"status": "accepted"},
        )

        conn = sync_service._get_connection()
        cursor = conn.execute(
            "SELECT * FROM sync_history WHERE idempotency_key = ?",
            ("mk_idem_test",)
        )
        row = cursor.fetchone()

        assert row is not None
        assert row["records_count"] == 5
        assert row["payload_size"] == 1024
        assert row["status"] == "success"

    def test_get_sync_status(self, sync_service, sample_records):
        """Should return accurate sync status."""
        # Insert records
        conn = sync_service._get_connection()
        for i, record in enumerate(sample_records):
            synced = 1 if i == 0 else 0
            conn.execute("""
                INSERT INTO usage_records (event_id, event_type, tenant_id, timestamp,
                    endpoint, model, input_tokens, output_tokens, duration_ms, metadata, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.event_id, record.event_type, record.tenant_id, record.timestamp,
                record.endpoint, record.model, record.input_tokens, record.output_tokens,
                record.duration_ms, json.dumps(record.metadata), synced
            ))
        conn.commit()

        status = sync_service.get_sync_status()

        assert status["unsynced_records"] == 1
        assert status["synced_records"] == 1
        assert status["api_key_configured"] is True


class TestGlobalService:
    """Test global service instance."""

    def test_get_service(self):
        """Should return singleton instance."""
        reset_service()
        service1 = get_service()
        service2 = get_service()
        assert service1 is service2

    def test_reset_service(self):
        """Should reset singleton instance."""
        reset_service()
        service1 = get_service()
        reset_service()
        service2 = get_service()
        # After reset, should be different instance
        assert service1 is not service2


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_missing_api_key(self, test_db_path):
        """Should handle missing API key gracefully."""
        # Unset environment variables
        old_key = os.environ.pop("MEKONG_API_KEY", None)
        old_raas_key = os.environ.pop("RAAS_LICENSE_KEY", None)

        try:
            config = SyncConfig(db_path=test_db_path, api_key=None)
            service = BillingSyncService(config)

            # API key should be None
            assert service.api_key is None

            # Send should fail gracefully
            success, response, error = service.send_to_gateway({}, "mk_idem_test")
            assert success is False
            assert error == "API key not configured"

        finally:
            # Restore environment
            if old_key:
                os.environ["MEKONG_API_KEY"] = old_key
            if old_raas_key:
                os.environ["RAAS_LICENSE_KEY"] = old_raas_key

    def test_record_sync_history_error(self, sync_service):
        """Should handle error recording history."""
        # Test with None gateway_response
        sync_service.record_sync_history(
            idempotency_key="mk_idem_test2",
            records_count=3,
            payload_size=512,
            status="failed",
            error="Test error",
        )

        conn = sync_service._get_connection()
        cursor = conn.execute(
            "SELECT * FROM sync_history WHERE idempotency_key = ?",
            ("mk_idem_test2",)
        )
        row = cursor.fetchone()

        assert row is not None
        assert row["status"] == "failed"
        assert row["error"] == "Test error"
        assert row["gateway_response"] is None

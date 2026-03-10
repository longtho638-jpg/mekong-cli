"""
Tests for RaaS Payload Encryptor

Tests AES-256-GCM encryption and decryption.
"""

import pytest
import os

from src.raas.payload_encryptor import (
    PayloadEncryptor,
    PayloadBuilder,
    EncryptionError,
    get_encryptor,
    reset_encryptor,
)


class TestPayloadEncryptor:
    """Test PayloadEncryptor class."""

    def setup_method(self):
        """Reset encryptor before each test."""
        reset_encryptor()

    def test_init_with_random_key(self):
        """Test initialization with random key."""
        encryptor = PayloadEncryptor()

        assert len(encryptor.key) == 32  # 256 bits
        assert encryptor.key_id == "default"

    def test_init_with_custom_key(self):
        """Test initialization with custom 32-byte key."""
        key = os.urandom(32)
        encryptor = PayloadEncryptor(key=key, key_id="test_key")

        assert encryptor.key == key
        assert encryptor.key_id == "test_key"

    def test_init_with_invalid_key_length(self):
        """Test that invalid key length raises error."""
        with pytest.raises(EncryptionError) as exc_info:
            PayloadEncryptor(key=b"short_key")

        assert "Key must be 32 bytes" in str(exc_info.value)

    def test_encrypt_decrypt_round_trip(self):
        """Test that decrypt reverses encrypt."""
        encryptor = PayloadEncryptor()
        payload = {"usage": "data", "count": 42}

        encrypted = encryptor.encrypt(payload)
        decrypted = encryptor.decrypt(encrypted)

        assert decrypted == payload

    def test_encrypt_changes_data(self):
        """Test that encryption changes the data."""
        encryptor = PayloadEncryptor()
        payload = {"test": "data"}

        encrypted = encryptor.encrypt(payload)

        # Encrypted data should be different from original
        assert encrypted.ciphertext != '{"test": "data"}'

    def test_different_nonces(self):
        """Test that each encryption uses different nonce."""
        encryptor = PayloadEncryptor()
        payload = {"test": "data"}

        encrypted1 = encryptor.encrypt(payload)
        encrypted2 = encryptor.encrypt(payload)

        # Nonces should be different (random)
        assert encrypted1.nonce != encrypted2.nonce
        # But both should decrypt to same payload
        assert encryptor.decrypt(encrypted1) == payload
        assert encryptor.decrypt(encrypted2) == payload

    def test_decrypt_wrong_key_fails(self):
        """Test that decrypting with wrong key fails."""
        key1 = os.urandom(32)
        key2 = os.urandom(32)

        encryptor1 = PayloadEncryptor(key=key1)
        encryptor2 = PayloadEncryptor(key=key2)

        payload = {"secret": "data"}
        encrypted = encryptor1.encrypt(payload)

        with pytest.raises(EncryptionError):
            encryptor2.decrypt(encrypted)

    def test_decrypt_tampered_data_fails(self):
        """Test that decrypting tampered data fails."""
        encryptor = PayloadEncryptor()
        payload = {"test": "data"}

        encrypted = encryptor.encrypt(payload)
        # Tamper with ciphertext
        tampered_nonce = encrypted.nonce
        tampered_ciphertext = encrypted.ciphertext[:-1] + "X"

        from src.raas.usage_event_schema import EncryptedPayload
        tampered = EncryptedPayload(
            nonce=tampered_nonce,
            ciphertext=tampered_ciphertext,
        )

        with pytest.raises(EncryptionError):
            encryptor.decrypt(tampered)

    def test_encrypt_sync_request(self):
        """Test building encrypted sync request."""
        from src.raas.usage_event_schema import UsageSummary

        encryptor = PayloadEncryptor()
        events = [
            {"event_type": "cli:command", "tenant_id": "t1"},
            {"event_type": "llm:call", "tenant_id": "t1"},
        ]
        summary = UsageSummary(total_requests=2)

        request = encryptor.encrypt_sync_request(
            events=events,
            license_key="mk_test",
            tenant_id="t1",
            summary=summary,
        )

        assert request.license_key == "mk_test"
        assert request.tenant_id == "t1"
        assert request.checksum  # Has checksum
        assert request.encrypted_payload.nonce
        assert request.encrypted_payload.ciphertext

    def test_decrypt_sync_request_verifies_checksum(self):
        """Test that decrypt verifies checksum."""
        from src.raas.usage_event_schema import UsageSummary

        encryptor = PayloadEncryptor()
        events = [{"event_type": "cli:command"}]
        summary = UsageSummary(total_requests=1)

        request = encryptor.encrypt_sync_request(
            events=events,
            license_key="mk_test",
            tenant_id="t1",
            summary=summary,
        )

        # Decrypt should succeed with valid checksum
        payload = encryptor.decrypt_sync_request(request)
        assert len(payload["events"]) == 1

        # Tamper with checksum
        request.checksum = "invalid_checksum"

        with pytest.raises(ValueError) as exc_info:
            encryptor.decrypt_sync_request(request)

        assert "Checksum verification failed" in str(exc_info.value)

    def test_rotate_key(self):
        """Test key rotation."""
        encryptor = PayloadEncryptor()
        old_key_id = encryptor.key_id

        new_key = os.urandom(32)
        encryptor.rotate_key(new_key)

        assert encryptor.key_id != old_key_id
        assert encryptor.key == new_key


class TestPayloadBuilder:
    """Test PayloadBuilder class."""

    def test_add_single_event(self):
        """Test adding single event."""
        builder = PayloadBuilder(tenant_id="tenant", license_key="mk_key")

        builder.add_event({"event_type": "cli:command"})

        payload = builder.build()
        assert len(payload) == 1
        assert payload[0]["tenant_id"] == "tenant"
        assert payload[0]["license_key"] == "mk_key"

    def test_add_multiple_events(self):
        """Test adding multiple events."""
        builder = PayloadBuilder(tenant_id="tenant", license_key="mk_key")

        events = [
            {"event_type": "cli:command"},
            {"event_type": "llm:call"},
            {"event_type": "agent:spawn"},
        ]
        builder.add_events(events)

        payload = builder.build()
        assert len(payload) == 3

    def test_build_hourly_buckets(self):
        """Test building hourly buckets."""
        builder = PayloadBuilder(tenant_id="tenant", license_key="mk_key")

        # Add events with timestamps
        builder.add_events([
            {"event_type": "cli:command", "timestamp": "2024-01-01T10:00:00Z", "input_tokens": 100, "output_tokens": 50},
            {"event_type": "llm:call", "timestamp": "2024-01-01T10:30:00Z", "input_tokens": 200, "output_tokens": 100},
            {"event_type": "cli:command", "timestamp": "2024-01-01T11:00:00Z", "input_tokens": 150, "output_tokens": 75},
        ])

        buckets = builder.build_hourly_buckets()

        assert len(buckets) == 2  # Two different hours
        assert buckets[0]["hour_bucket"] == "2024-01-01-10"
        assert buckets[0]["event_count"] == 2
        assert buckets[1]["hour_bucket"] == "2024-01-01-11"
        assert buckets[1]["event_count"] == 1

    def test_chaining(self):
        """Test method chaining."""
        builder = PayloadBuilder(tenant_id="tenant", license_key="mk_key")

        result = builder.add_event({"type": "test"}).add_events([{"type": "test2"}])

        assert result is builder
        assert len(builder.build()) == 2


class TestGetEncryptor:
    """Test global encryptor functions."""

    def setup_method(self):
        reset_encryptor()

    def test_get_encryptor_creates_instance(self):
        """Test that get_encryptor creates instance."""
        encryptor = get_encryptor()

        assert encryptor is not None
        assert isinstance(encryptor, PayloadEncryptor)

    def test_get_encryptor_returns_singleton(self):
        """Test that get_encryptor returns same instance."""
        encryptor1 = get_encryptor()
        encryptor2 = get_encryptor()

        assert encryptor1 is encryptor2

    def test_reset_encryptor(self):
        """Test reset_encryptor clears instance."""
        encryptor1 = get_encryptor()
        reset_encryptor()
        encryptor2 = get_encryptor()

        assert encryptor1 is not encryptor2

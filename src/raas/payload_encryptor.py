"""
RaaS Payload Encryptor - AES-GCM Encryption for Usage Data

Provides secure encryption for usage event payloads before transmission
to RaaS Gateway. Uses AES-256-GCM for authenticated encryption.

Security Features:
- AES-256-GCM authenticated encryption
- Random nonce per encryption
- Base64 encoding for transport
- Key rotation support

Usage:
    from src.raas.payload_encryptor import PayloadEncryptor

    encryptor = PayloadEncryptor()
    encrypted = encryptor.encrypt({"usage": "data"})
    decrypted = encryptor.decrypt(encrypted)
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .usage_event_schema import EncryptedPayload, SyncRequest, UsageSummary


class EncryptionError(Exception):
    """Raised when encryption/decryption fails."""

    pass


class PayloadEncryptor:
    """
    AES-256-GCM Payload Encryptor.

    Uses a 256-bit key derived from RAAS_ENCRYPTION_KEY environment variable
    or generates a random key for local testing.

    Attributes:
        key: 32-byte encryption key
        key_id: Key identifier for rotation support
    """

    KEY_LENGTH = 32  # 256 bits
    NONCE_LENGTH = 12  # 96 bits for GCM
    VERSION = "v1"

    def __init__(self, key: Optional[bytes] = None, key_id: Optional[str] = None):
        """
        Initialize encryptor.

        Args:
            key: Optional encryption key (32 bytes). If not provided,
                 derives from RAAS_ENCRYPTION_KEY env var or generates random.
            key_id: Optional key identifier for rotation tracking.
        """
        if key is not None:
            if len(key) != self.KEY_LENGTH:
                raise EncryptionError(
                    f"Key must be {self.KEY_LENGTH} bytes, got {len(key)}"
                )
            self.key = key
        else:
            self.key = self._load_or_generate_key()

        self.key_id = key_id or "default"
        self.aesgcm = AESGCM(self.key)

    def _load_or_generate_key(self) -> bytes:
        """Load key from environment or generate random."""
        env_key = os.getenv("RAAS_ENCRYPTION_KEY")

        if env_key:
            # Derive 32-byte key from env var using SHA-256
            return hashlib.sha256(env_key.encode("utf-8")).digest()
        else:
            # Generate random key for local testing
            return os.urandom(self.KEY_LENGTH)

    def encrypt(self, payload: Dict[str, Any]) -> EncryptedPayload:
        """
        Encrypt payload dictionary.

        Args:
            payload: Dictionary to encrypt

        Returns:
            EncryptedPayload with nonce and ciphertext

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Serialize to JSON
            plaintext = json.dumps(payload, sort_keys=True).encode("utf-8")

            # Generate random nonce
            nonce = os.urandom(self.NONCE_LENGTH)

            # Encrypt with AES-GCM
            ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)

            return EncryptedPayload.from_bytes(nonce, ciphertext)

        except Exception as e:
            raise EncryptionError(f"Encryption failed: {str(e)}") from e

    def decrypt(self, encrypted: EncryptedPayload) -> Dict[str, Any]:
        """
        Decrypt EncryptedPayload.

        Args:
            encrypted: EncryptedPayload to decrypt

        Returns:
            Decrypted dictionary

        Raises:
            EncryptionError: If decryption fails (wrong key, tampered data)
        """
        try:
            nonce, ciphertext = encrypted.to_bytes()

            # Decrypt with AES-GCM
            plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)

            # Parse JSON
            return json.loads(plaintext.decode("utf-8"))

        except Exception as e:
            raise EncryptionError(f"Decryption failed: {str(e)}") from e

    def encrypt_sync_request(
        self,
        events: list[Dict[str, Any]],
        license_key: str,
        tenant_id: str,
        summary: UsageSummary,
    ) -> SyncRequest:
        """
        Build encrypted SyncRequest for /v1/usage/sync.

        Args:
            events: List of usage event dictionaries
            license_key: License key for auth
            tenant_id: Tenant identifier
            summary: Usage summary (unencrypted)

        Returns:
            SyncRequest with encrypted payload
        """
        # Build payload
        payload = {
            "events": events,
            "event_count": len(events),
            "tenant_id": tenant_id,
        }

        # Compute checksum of original payload
        payload_json = json.dumps(payload, sort_keys=True)
        checksum = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

        # Encrypt payload
        encrypted_payload = self.encrypt(payload)

        return SyncRequest(
            license_key=license_key,
            tenant_id=tenant_id,
            encrypted_payload=encrypted_payload,
            summary=summary,
            checksum=checksum,
        )

    def decrypt_sync_request(self, request: SyncRequest) -> Dict[str, Any]:
        """
        Decrypt SyncRequest payload.

        Args:
            request: SyncRequest to decrypt

        Returns:
            Decrypted payload dictionary

        Raises:
            EncryptionError: If decryption fails
            ValueError: If checksum verification fails
        """
        # Decrypt payload
        payload = self.decrypt(request.encrypted_payload)

        # Verify checksum
        payload_json = json.dumps(payload, sort_keys=True)
        computed_checksum = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

        if computed_checksum != request.checksum:
            raise ValueError("Checksum verification failed - payload may be tampered")

        return payload

    def get_key_id(self) -> str:
        """Get current key identifier."""
        return self.key_id

    def rotate_key(self, new_key: bytes) -> None:
        """
        Rotate to new encryption key.

        Args:
            new_key: New 32-byte encryption key
        """
        if len(new_key) != self.KEY_LENGTH:
            raise EncryptionError(
                f"Key must be {self.KEY_LENGTH} bytes, got {len(new_key)}"
            )

        self.key = new_key
        self.aesgcm = AESGCM(self.key)
        self.key_id = f"rotated-{os.urandom(4).hex()}"


class PayloadBuilder:
    """
    Builder for constructing usage event payloads.

    Aggregates events and builds hourly buckets for sync.

    Usage:
        builder = PayloadBuilder(tenant_id="tenant_123")
        builder.add_event(event_dict)
        builder.add_event(event_dict)
        payload = builder.build()
    """

    def __init__(self, tenant_id: str, license_key: str):
        """
        Initialize payload builder.

        Args:
            tenant_id: Tenant identifier
            license_key: License key for attribution
        """
        self.tenant_id = tenant_id
        self.license_key = license_key
        self.events: list[Dict[str, Any]] = []

    def add_event(self, event: Dict[str, Any]) -> "PayloadBuilder":
        """
        Add usage event to payload.

        Args:
            event: Event dictionary with required fields

        Returns:
            Self for chaining
        """
        # Ensure tenant_id and license_key are set
        event["tenant_id"] = self.tenant_id
        event["license_key"] = self.license_key

        self.events.append(event)
        return self

    def add_events(self, events: list[Dict[str, Any]]) -> "PayloadBuilder":
        """
        Add multiple events.

        Args:
            events: List of event dictionaries

        Returns:
            Self for chaining
        """
        for event in events:
            self.add_event(event)
        return self

    def build(self) -> list[Dict[str, Any]]:
        """
        Build final payload.

        Returns:
            List of event dictionaries ready for encryption
        """
        return self.events

    def build_hourly_buckets(self) -> list[Dict[str, Any]]:
        """
        Aggregate events into hourly buckets.

        Returns:
            List of hourly bucket dictionaries
        """
        from datetime import datetime

        # Group by hour
        buckets: dict[str, list[Dict[str, Any]]] = {}

        for event in self.events:
            timestamp = event.get("timestamp", "")
            if not timestamp:
                continue

            try:
                # Parse timestamp
                if isinstance(timestamp, str):
                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                else:
                    dt = timestamp

                hour_bucket = dt.strftime("%Y-%m-%d-%H")

                if hour_bucket not in buckets:
                    buckets[hour_bucket] = []
                buckets[hour_bucket].append(event)

            except (ValueError, AttributeError):
                continue

        # Build bucket summaries
        result = []
        for hour_bucket, events in sorted(buckets.items()):
            total_tokens = sum(
                e.get("input_tokens", 0) + e.get("output_tokens", 0) for e in events
            )

            # Count by type
            events_by_type: dict[str, int] = {}
            for event in events:
                event_type = event.get("event_type", "unknown")
                events_by_type[event_type] = events_by_type.get(event_type, 0) + 1

            result.append(
                {
                    "hour_bucket": hour_bucket,
                    "tenant_id": self.tenant_id,
                    "event_count": len(events),
                    "total_tokens": total_tokens,
                    "events_by_type": events_by_type,
                }
            )

        return result


# Global instance for reuse
_encryptor: Optional[PayloadEncryptor] = None


def get_encryptor() -> PayloadEncryptor:
    """Get global encryptor instance."""
    global _encryptor
    if _encryptor is None:
        _encryptor = PayloadEncryptor()
    return _encryptor


def reset_encryptor() -> None:
    """Reset global encryptor (for testing)."""
    global _encryptor
    _encryptor = None

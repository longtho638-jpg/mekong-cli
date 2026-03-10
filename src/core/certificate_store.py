"""
Certificate Store - Secure Storage for Device Certificates

Provides secure storage and rotation for device certificates using
the existing secure_storage.py infrastructure.

Features:
- Encrypted storage of private keys
- Certificate metadata caching
- Automatic rotation before expiry
- Cross-platform secure storage (Keychain/Vault/encrypted file)

Usage:
    from src.core.certificate_store import CertificateStore

    store = CertificateStore()
    cert = store.load_certificate()
    if cert and cert.should_rotate:
        cert = store.rotate_certificate()
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from src.core.device_certificate import DeviceCertificate, CertificateSigner
from src.auth.secure_storage import get_secure_storage, SecureStorage


class CertificateStoreError(Exception):
    """Base exception for certificate store operations."""
    pass


@dataclass
class CertificateMetadata:
    """
    Certificate metadata for quick lookup.

    Attributes:
        certificate_id: Certificate UUID
        device_id: Device fingerprint
        valid_from: Validity start date
        valid_until: Validity end date
        created_at: Storage creation timestamp
        rotated_count: Number of times certificate was rotated
    """

    certificate_id: str
    device_id: str
    valid_from: datetime
    valid_until: datetime
    created_at: datetime
    rotated_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "certificate_id": self.certificate_id,
            "device_id": self.device_id,
            "valid_from": self.valid_from.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "created_at": self.created_at.isoformat(),
            "rotated_count": self.rotated_count,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CertificateMetadata":
        """Deserialize from dictionary."""
        return cls(
            certificate_id=data["certificate_id"],
            device_id=data["device_id"],
            valid_from=datetime.fromisoformat(data["valid_from"]),
            valid_until=datetime.fromisoformat(data["valid_until"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            rotated_count=data.get("rotated_count", 0),
        )

    @property
    def should_rotate(self) -> bool:
        """Check if certificate should be rotated (within 7 days of expiry)."""
        delta = self.valid_until - datetime.now(timezone.utc)
        return delta.days <= 7

    @property
    def is_expired(self) -> bool:
        """Check if certificate has expired."""
        return datetime.now(timezone.utc) > self.valid_until


class CertificateStore:
    """
    Secure certificate storage with rotation support.

    Stores:
    - Private key in secure storage (Keychain/Vault/encrypted)
    - Public key and metadata in certificate file
    - Rotation history for audit

    Storage paths:
    - ~/.mekong/certificate/ - Certificate directory
    - ~/.mekong/certificate/cert.json - Public cert + metadata
    - Secure storage key: "device_certificate_private_key"
    """

    CERTIFICATE_DIR = "~/.mekong/certificate"
    CERTIFICATE_FILE = "cert.json"
    ROTATION_HISTORY_FILE = "rotation_history.json"
    SECURE_STORAGE_KEY = "device_certificate_private_key"

    # Rotation settings
    ROTATION_WARNING_DAYS = 7  # Warn when within 7 days of expiry
    DEFAULT_VALIDITY_DAYS = 30  # New certificates valid for 30 days

    def __init__(
        self,
        certificate_dir: Optional[str] = None,
        use_secure_storage: bool = True
    ):
        """
        Initialize certificate store.

        Args:
            certificate_dir: Custom certificate directory path
            use_secure_storage: Use platform secure storage for private key
        """
        self.cert_dir = Path(certificate_dir or self.CERTIFICATE_DIR).expanduser()
        self.cert_file = self.cert_dir / self.CERTIFICATE_FILE
        self.history_file = self.cert_dir / self.ROTATION_HISTORY_FILE
        self.use_secure_storage = use_secure_storage
        self._secure_storage: Optional[SecureStorage] = None
        self._metadata: Optional[CertificateMetadata] = None

        if self.use_secure_storage:
            try:
                self._secure_storage = get_secure_storage()
            except Exception:
                self._secure_storage = None

        # Ensure certificate directory exists
        self._ensure_cert_dir()

        # Load metadata on init
        self._metadata = self._load_metadata()

    def _ensure_cert_dir(self) -> None:
        """Ensure certificate directory exists with proper permissions."""
        self.cert_dir.mkdir(parents=True, exist_ok=True)
        # Set restrictive permissions (owner read/write/execute only)
        os.chmod(self.cert_dir, 0o700)

    def _load_metadata(self) -> Optional[CertificateMetadata]:
        """
        Load certificate metadata from file.

        Returns:
            CertificateMetadata if file exists and valid, None otherwise
        """
        if not self.cert_file.exists():
            return None

        try:
            with open(self.cert_file, "r") as f:
                data = json.load(f)

            # Load metadata portion
            metadata = CertificateMetadata.from_dict(data.get("metadata", {}))

            # Check if certificate is expired
            if metadata.is_expired:
                self._clear_metadata()
                return None

            return metadata

        except (json.JSONDecodeError, IOError, KeyError, ValueError):
            # Corrupted file - clear and return None
            self._clear_metadata()
            return None

    def _clear_metadata(self) -> bool:
        """
        Clear certificate metadata file.

        Returns:
            True if cleared, False if no file existed
        """
        if self.cert_file.exists():
            try:
                os.remove(self.cert_file)
                return True
            except OSError:
                return False
        return False

    def _save_metadata(self, metadata: CertificateMetadata) -> None:
        """
        Save certificate metadata to file.

        Note: Only saves metadata, not the private key (stored separately).

        Args:
            metadata: CertificateMetadata to persist
        """
        self._ensure_cert_dir()

        # Load existing cert data to preserve public key
        existing_data = {}
        if self.cert_file.exists():
            try:
                with open(self.cert_file, "r") as f:
                    existing_data = json.load(f)
            except Exception:
                pass

        # Update metadata
        existing_data["metadata"] = metadata.to_dict()

        # Write atomically
        temp_file = self.cert_file.with_suffix(".tmp")
        with open(temp_file, "w") as f:
            json.dump(existing_data, f, indent=2)

        # Rename to final file (atomic on POSIX)
        os.replace(temp_file, self.cert_file)

        # Set restrictive permissions
        os.chmod(self.cert_file, 0o600)

    def _load_private_key(self) -> Optional[bytes]:
        """
        Load private key from secure storage or file fallback.

        Returns:
            Private key PEM bytes if found, None otherwise
        """
        # Try secure storage first if enabled
        if self.use_secure_storage and self._secure_storage:
            try:
                key = self._secure_storage.get_license()
                if key:
                    return key.encode("utf-8")
            except Exception:
                pass

        # Fallback: load from file
        key_file = self.cert_dir / "private_key.pem"
        if key_file.exists():
            try:
                with open(key_file, "rb") as f:
                    return f.read()
            except Exception:
                pass

        return None

    def _save_private_key(self, private_key_pem: bytes) -> None:
        """
        Save private key to secure storage.

        Args:
            private_key_pem: Private key in PEM format
        """
        if self.use_secure_storage and self._secure_storage:
            try:
                self._secure_storage.store_license(private_key_pem.decode("utf-8"))
                return
            except Exception:
                pass

        # Fallback: save to file (less secure)
        key_file = self.cert_dir / "private_key.pem"
        with open(key_file, "wb") as f:
            f.write(private_key_pem)
        os.chmod(key_file, 0o600)

    def _clear_private_key(self) -> bool:
        """
        Clear private key from storage.

        Returns:
            True if cleared, False otherwise
        """
        cleared = False

        # Clear from secure storage
        if self.use_secure_storage and self._secure_storage:
            try:
                if self._secure_storage.delete_license():
                    cleared = True
            except Exception:
                pass

        # Clear from file fallback
        key_file = self.cert_dir / "private_key.pem"
        if key_file.exists():
            try:
                os.remove(key_file)
                cleared = True
            except OSError:
                pass

        return cleared

    def _load_rotation_history(self) -> list[Dict[str, Any]]:
        """
        Load certificate rotation history.

        Returns:
            List of rotation records (newest first)
        """
        if not self.history_file.exists():
            return []

        try:
            with open(self.history_file, "r") as f:
                history = json.load(f)
            return history if isinstance(history, list) else []
        except Exception:
            return []

    def _save_rotation_record(self, record: Dict[str, Any]) -> None:
        """
        Save a certificate rotation record.

        Args:
            record: Rotation record with old/new certificate info
        """
        history = self._load_rotation_history()
        history.insert(0, record)  # Newest first

        # Keep only last 10 rotations
        history = history[:10]

        temp_file = self.history_file.with_suffix(".tmp")
        with open(temp_file, "w") as f:
            json.dump(history, f, indent=2)
        os.replace(temp_file, self.history_file)
        os.chmod(self.history_file, 0o600)

    def has_certificate(self) -> bool:
        """
        Check if a valid certificate exists.

        Returns:
            True if certificate exists and not expired
        """
        return self._metadata is not None and not self._metadata.is_expired

    def load_certificate(self) -> Optional[DeviceCertificate]:
        """
        Load full certificate from storage.

        Returns:
            DeviceCertificate with private key loaded, or None if not found
        """
        if not self._metadata:
            return None

        # Load certificate data
        if not self.cert_file.exists():
            return None

        try:
            with open(self.cert_file, "r") as f:
                data = json.load(f)

            # Load private key
            private_key_pem = self._load_private_key()
            if not private_key_pem:
                return None

            # Reconstruct certificate
            cert_data = data.get("certificate", {})
            return DeviceCertificate(
                certificate_id=cert_data.get("certificate_id", self._metadata.certificate_id),
                device_id=cert_data.get("device_id", self._metadata.device_id),
                private_key_pem=private_key_pem,
                public_key_pem=data.get("public_key_pem", "").encode("utf-8"),
                valid_from=self._metadata.valid_from,
                valid_until=self._metadata.valid_until,
                serial_number=cert_data.get("serial_number", 0),
                signature=bytes.fromhex(cert_data["signature"]) if cert_data.get("signature") else None,
            )

        except Exception:
            return None

    def save_certificate(
        self,
        cert: DeviceCertificate,
        rotation_reason: str = "manual"
    ) -> None:
        """
        Save certificate to storage.

        Args:
            cert: DeviceCertificate to save
            rotation_reason: Reason for save (initial/rotation/expired/error)
        """
        # Check if this is a rotation
        is_rotation = self._metadata is not None
        old_cert_id = self._metadata.certificate_id if self._metadata else None

        # Save private key to secure storage or file
        self._save_private_key(cert.private_key_pem)

        # Save certificate data and metadata
        cert_data = {
            "certificate_id": cert.certificate_id,
            "device_id": cert.device_id,
            "serial_number": cert.serial_number,
            "signature": cert.signature.hex() if cert.signature else None,
        }

        metadata = CertificateMetadata(
            certificate_id=cert.certificate_id,
            device_id=cert.device_id,
            valid_from=cert.valid_from,
            valid_until=cert.valid_until,
            created_at=datetime.now(timezone.utc),
            rotated_count=self._metadata.rotated_count + 1 if self._metadata else 0,
        )

        # Save full certificate data including public key
        data = {
            "certificate": cert_data,
            "metadata": metadata.to_dict(),
            "public_key_pem": cert.public_key_pem.decode("utf-8"),
        }

        # Write atomically
        temp_file = self.cert_file.with_suffix(".tmp")
        with open(temp_file, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(temp_file, self.cert_file)
        os.chmod(self.cert_file, 0o600)

        # Update in-memory metadata
        self._metadata = metadata

        # Record rotation
        if is_rotation:
            self._save_rotation_record({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reason": rotation_reason,
                "old_certificate_id": old_cert_id,
                "new_certificate_id": cert.certificate_id,
                "new_valid_until": cert.valid_until.isoformat(),
            })

    def generate_and_save(
        self,
        device_fingerprint: Optional[str] = None,
        valid_days: int = 30,
        auto_sign: bool = True
    ) -> DeviceCertificate:
        """
        Generate new certificate and save to storage.

        Args:
            device_fingerprint: Optional custom device fingerprint
            valid_days: Certificate validity period
            auto_sign: Auto-sign certificate with local signer

        Returns:
            Generated DeviceCertificate
        """
        # Generate new certificate
        cert = DeviceCertificate.generate(
            device_fingerprint=device_fingerprint,
            valid_days=valid_days
        )

        # Sign certificate
        if auto_sign:
            signer = CertificateSigner()
            cert.signature = signer.sign_certificate(cert)

        # Save to storage
        rotation_reason = "rotation" if self._metadata else "initial"
        self.save_certificate(cert, rotation_reason=rotation_reason)

        return cert

    def rotate_certificate(
        self,
        valid_days: Optional[int] = None
    ) -> Optional[DeviceCertificate]:
        """
        Rotate certificate before expiry.

        Args:
            valid_days: New certificate validity period (default: 30 days)

        Returns:
            New DeviceCertificate if rotation successful, None if no cert to rotate
        """
        # Check if rotation is needed
        if not self._metadata:
            # No existing cert - generate new one
            return self.generate_and_save(valid_days=valid_days or self.DEFAULT_VALIDITY_DAYS)

        if not self._metadata.should_rotate and not self._metadata.is_expired:
            # Not yet time to rotate
            return None

        # Generate new certificate with same device fingerprint
        new_cert = self.generate_and_save(
            device_fingerprint=self._metadata.device_id,
            valid_days=valid_days or self.DEFAULT_VALIDITY_DAYS,
        )

        return new_cert

    def get_metadata(self) -> Optional[CertificateMetadata]:
        """Get current certificate metadata."""
        return self._metadata

    def get_rotation_history(self) -> list[Dict[str, Any]]:
        """Get certificate rotation history."""
        return self._load_rotation_history()

    def clear(self) -> bool:
        """
        Clear all certificate data.

        Returns:
            True if cleared successfully
        """
        cleared = False

        # Clear private key
        if self._clear_private_key():
            cleared = True

        # Clear certificate file
        if self._clear_metadata():
            cleared = True

        # Clear rotation history
        if self.history_file.exists():
            try:
                os.remove(self.history_file)
                cleared = True
            except OSError:
                pass

        # Clear in-memory state
        self._metadata = None

        return cleared

    def export_for_request(self) -> Optional[Dict[str, str]]:
        """
        Export certificate data for API request headers.

        Returns:
            Dict with X-Cert-ID and X-Cert-Sig headers, or None if no cert
        """
        cert = self.load_certificate()
        if not cert:
            return None

        # Create signature for request
        # Sign: certificate_id + timestamp
        timestamp = datetime.now(timezone.utc).isoformat()
        data_to_sign = f"{cert.certificate_id}:{timestamp}".encode("utf-8")
        signature = cert.sign_request(data_to_sign)

        return {
            "X-Cert-ID": cert.certificate_id,
            "X-Cert-Sig": signature.hex(),
            "X-Cert-Timestamp": timestamp,
        }


# Singleton instance
_certificate_store: Optional[CertificateStore] = None


def get_certificate_store(
    certificate_dir: Optional[str] = None,
    use_secure_storage: bool = True
) -> CertificateStore:
    """
    Get or create certificate store singleton.

    Args:
        certificate_dir: Custom certificate directory
        use_secure_storage: Use platform secure storage

    Returns:
        CertificateStore instance
    """
    global _certificate_store
    if _certificate_store is None:
        _certificate_store = CertificateStore(
            certificate_dir=certificate_dir,
            use_secure_storage=use_secure_storage
        )
    return _certificate_store

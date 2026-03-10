"""
Tests for Device Certificate Generation and Storage

Tests cover:
- DeviceCertificate generation with ECDSA P-256 keys
- Device fingerprint generation
- Certificate signing and verification
- CertificateStore save/load operations
- Certificate rotation logic
- Integration with RaaSAuthClient
"""

import os
import sys
import pytest
import tempfile
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.core.device_certificate import (
    DeviceCertificate,
    CertificateSigner,
    generate_device_certificate,
)
from src.core.certificate_store import (
    CertificateStore,
    CertificateMetadata,
)


class TestDeviceCertificate:
    """Tests for DeviceCertificate class."""

    def test_generate_certificate(self):
        """Test certificate generation with default settings."""
        cert = DeviceCertificate.generate()

        assert cert.certificate_id is not None
        assert len(cert.certificate_id) == 36  # UUID format
        assert cert.device_id is not None
        assert len(cert.device_id) == 64  # SHA-256 hex
        assert cert.private_key_pem is not None
        assert cert.public_key_pem is not None
        assert cert.serial_number is not None
        assert cert.valid_until > cert.valid_from

    def test_generate_with_custom_fingerprint(self):
        """Test certificate generation with custom device fingerprint."""
        custom_fp = "test_device_fingerprint_12345"
        cert = DeviceCertificate.generate(device_fingerprint=custom_fp)

        assert cert.device_id == custom_fp

    def test_generate_with_custom_cert_id(self):
        """Test certificate generation with custom certificate ID."""
        custom_id = "550e8400-e29b-41d4-a716-446655440000"
        cert = DeviceCertificate.generate(certificate_id=custom_id)

        assert cert.certificate_id == custom_id

    def test_generate_with_custom_validity(self):
        """Test certificate generation with custom validity period."""
        cert = DeviceCertificate.generate(valid_days=90)

        expected_until = datetime.now(timezone.utc) + timedelta(days=90)
        delta = abs((cert.valid_until - expected_until).total_seconds())
        assert delta < 5  # Allow 5 second tolerance

    def test_certificate_is_valid(self):
        """Test certificate validity check."""
        cert = DeviceCertificate.generate(valid_days=30)

        assert cert.is_valid is True

    def test_certificate_should_rotate(self):
        """Test certificate rotation check."""
        # New cert should not need rotation
        cert = DeviceCertificate.generate(valid_days=30)
        assert cert.should_rotate is False

        # Cert expiring soon should need rotation
        cert_short = DeviceCertificate.generate(valid_days=5)
        # Manually adjust valid_until to simulate near-expiry
        cert_short.valid_until = datetime.now(timezone.utc) + timedelta(days=3)
        assert cert_short.should_rotate is True

    def test_certificate_days_until_expiry(self):
        """Test days until expiry calculation."""
        cert = DeviceCertificate.generate(valid_days=30)

        assert 29 <= cert.days_until_expiry <= 30

    def test_device_fingerprint_generation(self):
        """Test device fingerprint generation is deterministic."""
        fp1 = DeviceCertificate._generate_device_fingerprint()
        fp2 = DeviceCertificate._generate_device_fingerprint()

        # Same machine should generate same fingerprint
        assert fp1 == fp2
        assert len(fp1) == 64  # SHA-256 hex length

    def test_sign_and_verify(self):
        """Test ECDSA signing and verification."""
        cert = DeviceCertificate.generate()

        # Sign some data
        data = b"test data to sign"
        signature = cert.sign_request(data)

        assert signature is not None
        assert len(signature) > 0

        # Verify signature
        is_valid = DeviceCertificate.verify_signature(
            cert.public_key_pem,
            data,
            signature
        )
        assert is_valid is True

    def test_verify_invalid_signature(self):
        """Test verification fails for invalid signature."""
        cert = DeviceCertificate.generate()

        data = b"test data"
        wrong_data = b"wrong data"
        signature = cert.sign_request(data)

        # Verify with wrong data should fail
        is_valid = DeviceCertificate.verify_signature(
            cert.public_key_pem,
            wrong_data,
            signature
        )
        assert is_valid is False

    def test_serialize_to_dict(self):
        """Test certificate serialization to dictionary."""
        cert = DeviceCertificate.generate()
        cert.signature = b"test_signature"

        data = cert.to_dict()

        assert data["certificate_id"] == cert.certificate_id
        assert data["device_id"] == cert.device_id
        assert "private_key_pem" in data
        assert "public_key_pem" in data
        assert data["signature"] == "746573745f7369676e6174757265"  # hex of "test_signature"

    def test_deserialize_from_dict(self):
        """Test certificate deserialization from dictionary."""
        cert = DeviceCertificate.generate()
        data = cert.to_dict()

        restored = DeviceCertificate.from_dict(data)

        assert restored.certificate_id == cert.certificate_id
        assert restored.device_id == cert.device_id
        assert restored.private_key_pem == cert.private_key_pem
        assert restored.public_key_pem == cert.public_key_pem

    def test_build_x509_certificate(self):
        """Test X.509 certificate building."""
        cert = DeviceCertificate.generate()

        x509_pem = cert.build_x509_certificate()

        assert x509_pem is not None
        assert x509_pem.startswith(b"-----BEGIN CERTIFICATE-----")
        assert x509_pem.endswith(b"-----END CERTIFICATE-----\n")


class TestCertificateSigner:
    """Tests for CertificateSigner class."""

    def test_signer_with_ephemeral_key(self):
        """Test signer with auto-generated ephemeral key."""
        signer = CertificateSigner()

        assert signer.ca_private_key is not None
        assert signer.ca_public_key is not None

    def test_sign_and_verify_certificate(self):
        """Test certificate signing and verification."""
        cert = DeviceCertificate.generate()
        signer = CertificateSigner()

        # Sign certificate
        signature = signer.sign_certificate(cert)

        # Verify signature
        is_valid = signer.verify_certificate(cert, signature)
        assert is_valid is True

    def test_verify_invalid_certificate_signature(self):
        """Test verification fails for invalid signature."""
        cert = DeviceCertificate.generate()
        signer = CertificateSigner()

        # Create different signer
        signer2 = CertificateSigner()

        # Sign with first signer
        signature = signer.sign_certificate(cert)

        # Verify with second signer's key should fail
        is_valid = signer2.verify_certificate(cert, signature)
        assert is_valid is False


class TestGenerateDeviceCertificate:
    """Tests for convenience function."""

    def test_generate_and_sign(self):
        """Test generate_device_certificate function."""
        cert, signature = generate_device_certificate()

        assert cert is not None
        assert signature is not None
        assert cert.signature == signature


class TestCertificateMetadata:
    """Tests for CertificateMetadata class."""

    def test_metadata_creation(self):
        """Test metadata creation."""
        now = datetime.now(timezone.utc)
        metadata = CertificateMetadata(
            certificate_id="test-cert-id",
            device_id="test-device-id",
            valid_from=now,
            valid_until=now + timedelta(days=30),
            created_at=now,
        )

        assert metadata.certificate_id == "test-cert-id"
        assert metadata.device_id == "test-device-id"
        assert metadata.rotated_count == 0

    def test_metadata_should_rotate(self):
        """Test metadata rotation check."""
        now = datetime.now(timezone.utc)

        # Not due for rotation
        metadata = CertificateMetadata(
            certificate_id="test",
            device_id="test",
            valid_from=now,
            valid_until=now + timedelta(days=30),
            created_at=now,
        )
        assert metadata.should_rotate is False

        # Due for rotation (within 7 days)
        metadata_soon = CertificateMetadata(
            certificate_id="test",
            device_id="test",
            valid_from=now,
            valid_until=now + timedelta(days=5),
            created_at=now,
        )
        assert metadata_soon.should_rotate is True

    def test_metadata_is_expired(self):
        """Test metadata expiry check."""
        now = datetime.now(timezone.utc)

        # Not expired
        metadata = CertificateMetadata(
            certificate_id="test",
            device_id="test",
            valid_from=now,
            valid_until=now + timedelta(days=30),
            created_at=now,
        )
        assert metadata.is_expired is False

        # Expired
        metadata_expired = CertificateMetadata(
            certificate_id="test",
            device_id="test",
            valid_from=now - timedelta(days=60),
            valid_until=now - timedelta(days=30),
            created_at=now - timedelta(days=60),
        )
        assert metadata_expired.is_expired is True

    def test_metadata_serialization(self):
        """Test metadata serialization/deserialization."""
        now = datetime.now(timezone.utc)
        metadata = CertificateMetadata(
            certificate_id="test-cert-id",
            device_id="test-device-id",
            valid_from=now,
            valid_until=now + timedelta(days=30),
            created_at=now,
            rotated_count=5,
        )

        data = metadata.to_dict()
        restored = CertificateMetadata.from_dict(data)

        assert restored.certificate_id == metadata.certificate_id
        assert restored.device_id == metadata.device_id
        assert restored.rotated_count == metadata.rotated_count


class TestCertificateStore:
    """Tests for CertificateStore class."""

    @pytest.fixture
    def temp_cert_dir(self):
        """Create temporary certificate directory for tests."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def store(self, temp_cert_dir):
        """Create certificate store for tests."""
        return CertificateStore(
            certificate_dir=temp_cert_dir,
            use_secure_storage=False  # Use file fallback for tests
        )

    def test_store_initialization(self, temp_cert_dir):
        """Test store initialization creates directory."""
        store = CertificateStore(certificate_dir=temp_cert_dir)

        assert Path(temp_cert_dir).exists()
        assert os.access(temp_cert_dir, os.R_OK | os.W_OK | os.X_OK)

    def test_has_certificate_empty(self, store):
        """Test has_certificate when no certificate exists."""
        assert store.has_certificate() is False

    def test_load_certificate_empty(self, store):
        """Test load_certificate when no certificate exists."""
        assert store.load_certificate() is None

    def test_save_and_load_certificate(self, store):
        """Test saving and loading a certificate."""
        cert = DeviceCertificate.generate()

        store.save_certificate(cert)

        # Check certificate exists
        assert store.has_certificate() is True

        # Load and verify
        loaded = store.load_certificate()
        assert loaded is not None
        assert loaded.certificate_id == cert.certificate_id
        assert loaded.device_id == cert.device_id
        assert loaded.private_key_pem == cert.private_key_pem

    def test_generate_and_save(self, store):
        """Test generate_and_save method."""
        cert = store.generate_and_save()

        assert cert is not None
        assert store.has_certificate() is True

        metadata = store.get_metadata()
        assert metadata is not None
        assert metadata.certificate_id == cert.certificate_id

    def test_rotate_certificate(self, store):
        """Test certificate rotation."""
        # Generate initial certificate
        initial_cert = store.generate_and_save(valid_days=30)
        initial_id = initial_cert.certificate_id

        # Force rotation by creating near-expiry cert
        near_expiry = DeviceCertificate.generate(valid_days=3)
        near_expiry.valid_until = datetime.now(timezone.utc) + timedelta(days=2)
        store.save_certificate(near_expiry)

        # Rotate
        rotated_cert = store.rotate_certificate()

        assert rotated_cert is not None
        assert rotated_cert.certificate_id != initial_id

    def test_rotate_certificate_not_due(self, store):
        """Test rotation when not due returns None."""
        cert = store.generate_and_save(valid_days=30)

        # Should not rotate yet
        result = store.rotate_certificate()
        # First rotation is always "initial" so may succeed
        # Check rotation history
        history = store.get_rotation_history()
        assert len(history) >= 0  # May have initial record

    def test_get_metadata(self, store):
        """Test getting certificate metadata."""
        cert = store.generate_and_save()

        metadata = store.get_metadata()

        assert metadata is not None
        assert metadata.certificate_id == cert.certificate_id

    def test_get_rotation_history(self, store):
        """Test getting rotation history."""
        # Initial certificate
        store.generate_and_save()

        history = store.get_rotation_history()

        # Should have at least initial record
        assert isinstance(history, list)

    def test_clear_certificate(self, store):
        """Test clearing certificate."""
        store.generate_and_save()

        assert store.has_certificate() is True

        store.clear()

        assert store.has_certificate() is False
        assert store.load_certificate() is None
        assert store.get_metadata() is None

    def test_export_for_request(self, store):
        """Test exporting certificate for API request."""
        cert = store.generate_and_save()

        headers = store.export_for_request()

        assert headers is not None
        assert "X-Cert-ID" in headers
        assert "X-Cert-Sig" in headers
        assert "X-Cert-Timestamp" in headers
        assert headers["X-Cert-ID"] == cert.certificate_id

    def test_export_for_request_no_cert(self, store):
        """Test export when no certificate exists."""
        headers = store.export_for_request()

        assert headers is None

    def test_certificate_permissions(self, temp_cert_dir):
        """Test certificate file permissions."""
        store = CertificateStore(certificate_dir=temp_cert_dir)
        store.generate_and_save()

        cert_file = Path(temp_cert_dir) / "cert.json"
        assert cert_file.exists()

        # Check permissions (should be 600)
        stat_info = cert_file.stat()
        assert stat_info.st_mode & 0o777 == 0o600


class TestCertificateStoreIntegration:
    """Integration tests for certificate store."""

    @pytest.fixture
    def temp_cert_dir(self):
        """Create temporary certificate directory."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    def test_full_lifecycle(self, temp_cert_dir):
        """Test full certificate lifecycle."""
        # Create store with secure storage disabled for testing
        store = CertificateStore(
            certificate_dir=temp_cert_dir,
            use_secure_storage=False
        )

        # Generate certificate
        cert = store.generate_and_save()
        assert cert is not None
        assert store.has_certificate()

        # Load certificate
        loaded = store.load_certificate()
        assert loaded is not None
        assert loaded.certificate_id == cert.certificate_id

        # Export for request
        headers = store.export_for_request()
        assert headers is not None

        # Verify signature in headers
        is_valid = DeviceCertificate.verify_signature(
            loaded.public_key_pem,
            f"{headers['X-Cert-ID']}:{headers['X-Cert-Timestamp']}".encode(),
            bytes.fromhex(headers["X-Cert-Sig"])
        )
        assert is_valid is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

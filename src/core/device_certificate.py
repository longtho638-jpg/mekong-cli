"""
Device Certificate Generation for Certificate-Based Auth

ECDSA P-256 certificate generation and signing for device authentication.
Generates certificates from device fingerprints (MAC address + hostname)
with 30-day validity period.

Usage:
    from src.core.device_certificate import DeviceCertificate

    cert = DeviceCertificate.generate()
    print(f"Certificate ID: {cert.certificate_id}")
    print(f"Device ID: {cert.device_id}")
    print(f"Private Key: {cert.private_key_pem}")
    print(f"Public Key: {cert.public_key_pem}")
    print(f"Valid Until: {cert.valid_until}")
"""

from __future__ import annotations

import hashlib
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import (
    Name,
    NameAttribute,
    CertificateBuilder,
    SubjectAlternativeName,
    DNSName,
    ObjectIdentifier,
)


@dataclass
class DeviceCertificate:
    """
    Device certificate with ECDSA P-256 key pair.

    Attributes:
        certificate_id: Unique certificate identifier (UUID v4)
        device_id: Device fingerprint (SHA-256 of MAC + hostname)
        private_key_pem: ECDSA P-256 private key in PEM format
        public_key_pem: ECDSA P-256 public key in PEM format
        valid_from: Certificate validity start date
        valid_until: Certificate validity end date (30 days from valid_from)
        serial_number: Certificate serial number
        signature: Signed certificate signature (if signed)
    """

    certificate_id: str
    device_id: str
    private_key_pem: bytes
    public_key_pem: bytes
    valid_from: datetime
    valid_until: datetime
    serial_number: int
    signature: Optional[bytes] = None

    @property
    def private_key(self) -> ec.EllipticCurvePrivateKey:
        """Load private key from PEM bytes."""
        return serialization.load_pem_private_key(
            self.private_key_pem,
            password=None,
            backend=default_backend()
        )

    @property
    def public_key(self) -> ec.EllipticCurvePublicKey:
        """Load public key from PEM bytes."""
        return serialization.load_pem_public_key(
            self.public_key_pem,
            backend=default_backend()
        )

    @property
    def is_valid(self) -> bool:
        """Check if certificate is currently valid."""
        now = datetime.now(timezone.utc)
        return self.valid_from <= now <= self.valid_until

    @property
    def days_until_expiry(self) -> int:
        """Get number of days until certificate expires."""
        delta = self.valid_until - datetime.now(timezone.utc)
        return max(0, delta.days)

    @property
    def should_rotate(self) -> bool:
        """Check if certificate should be rotated (within 7 days of expiry)."""
        return self.days_until_expiry <= 7

    def to_dict(self) -> Dict[str, Any]:
        """Serialize certificate to dictionary."""
        return {
            "certificate_id": self.certificate_id,
            "device_id": self.device_id,
            "private_key_pem": self.private_key_pem.decode("utf-8"),
            "public_key_pem": self.public_key_pem.decode("utf-8"),
            "valid_from": self.valid_from.isoformat(),
            "valid_until": self.valid_until.isoformat(),
            "serial_number": self.serial_number,
            "signature": self.signature.hex() if self.signature else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DeviceCertificate":
        """Deserialize certificate from dictionary."""
        return cls(
            certificate_id=data["certificate_id"],
            device_id=data["device_id"],
            private_key_pem=data["private_key_pem"].encode("utf-8"),
            public_key_pem=data["public_key_pem"].encode("utf-8"),
            valid_from=datetime.fromisoformat(data["valid_from"]),
            valid_until=datetime.fromisoformat(data["valid_until"]),
            serial_number=data["serial_number"],
            signature=bytes.fromhex(data["signature"]) if data.get("signature") else None,
        )

    def sign_request(self, data: bytes) -> bytes:
        """
        Sign data using ECDSA P-256.

        Args:
            data: Data to sign

        Returns:
            ECDSA signature in DER format
        """
        return self.private_key.sign(
            data,
            ec.ECDSA(hashes.SHA256())
        )

    @staticmethod
    def verify_signature(public_key_pem: bytes, data: bytes, signature: bytes) -> bool:
        """
        Verify ECDSA signature.

        Args:
            public_key_pem: Public key in PEM format
            data: Original data that was signed
            signature: Signature to verify

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem,
                backend=default_backend()
            )
            public_key.verify(
                signature,
                data,
                ec.ECDSA(hashes.SHA256())
            )
            return True
        except Exception:
            return False

    @classmethod
    def generate(
        cls,
        device_fingerprint: Optional[str] = None,
        valid_days: int = 30,
        certificate_id: Optional[str] = None
    ) -> "DeviceCertificate":
        """
        Generate a new device certificate.

        Args:
            device_fingerprint: Optional custom device fingerprint.
                               If None, generates from MAC address + hostname.
            valid_days: Certificate validity period in days (default: 30)
            certificate_id: Optional custom certificate ID (UUID).
                           If None, generates new UUID v4.

        Returns:
            New DeviceCertificate instance with generated keys
        """
        # Generate or use provided certificate ID
        cert_id = certificate_id or str(uuid.uuid4())

        # Generate or use provided device fingerprint
        device_id = device_fingerprint or cls._generate_device_fingerprint()

        # Generate ECDSA P-256 key pair
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()

        # Serialize keys to PEM format
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # Generate serial number (random 160-bit integer, max 2^159 for X.509)
        serial_number = int.from_bytes(os.urandom(19), byteorder='big') | (1 << 152)  # Ensure 159 bits

        # Calculate validity dates
        now = datetime.now(timezone.utc)
        valid_from = now
        valid_until = now + timedelta(days=valid_days)

        return cls(
            certificate_id=cert_id,
            device_id=device_id,
            private_key_pem=private_key_pem,
            public_key_pem=public_key_pem,
            valid_from=valid_from,
            valid_until=valid_until,
            serial_number=serial_number,
        )

    @staticmethod
    def _generate_device_fingerprint() -> str:
        """
        Generate unique device fingerprint from hardware identifiers.

        Uses MAC address (primary NIC) + hostname, hashed with SHA-256.

        Returns:
            64-character hexadecimal SHA-256 hash
        """
        import socket
        import uuid

        # Get hostname
        hostname = socket.gethostname()

        # Get MAC address from primary network interface
        mac_address = None
        # Try to get MAC from all interfaces
        for iface in [0, 1, 2, 3]:
            try:
                mac = uuid.getnode()
                if mac:
                    mac_address = ':'.join([
                        f'{(mac >> elements) & 0xff:02x}'
                        for elements in range(0, 48, 8)
                    ])
                    break
            except Exception:
                continue

        # Fallback to random UUID if MAC not available
        if not mac_address:
            mac_address = str(uuid.uuid4())

        # Combine hostname and MAC address
        fingerprint_data = f"{hostname}:{mac_address}".encode("utf-8")

        # Generate SHA-256 hash
        fingerprint_hash = hashlib.sha256(fingerprint_data).hexdigest()

        return fingerprint_hash

    def build_x509_certificate(
        self,
        subject_name: Optional[str] = None,
        issuer_name: Optional[str] = None
    ) -> bytes:
        """
        Build X.509 certificate in PEM format.

        Args:
            subject_name: Certificate subject name (default: shortened device_id)
            issuer_name: Certificate issuer name (default: same as subject for self-signed)

        Returns:
            X.509 certificate in PEM format
        """
        # Truncate subject to <= 64 characters for X.509 compliance
        short_id = self.device_id[:16]
        subject = subject_name or f"Device:{short_id}"
        issuer = issuer_name or subject

        # Build certificate
        builder = CertificateBuilder()
        builder = builder.subject_name(Name([
            NameAttribute(ObjectIdentifier("2.5.4.3"), subject)  # Common Name
        ]))
        builder = builder.issuer_name(Name([
            NameAttribute(ObjectIdentifier("2.5.4.3"), issuer)
        ]))
        builder = builder.public_key(self.public_key)
        builder = builder.serial_number(self.serial_number)
        builder = builder.not_valid_before(self.valid_from)
        builder = builder.not_valid_after(self.valid_until)

        # Add subject alternative name using proper extension wrapper
        builder = builder.add_extension(
            SubjectAlternativeName([DNSName(f"device-{short_id}.mekong.local")]),
            critical=False
        )

        # Sign certificate with private key
        certificate = builder.sign(
            private_key=self.private_key,
            algorithm=hashes.SHA256(),
            backend=default_backend()
        )

        # Serialize to PEM
        return certificate.public_bytes(serialization.Encoding.PEM)


class CertificateSigner:
    """
    Certificate signing utility for RaaS Gateway.

    Signs device certificates with gateway's CA key.
    In production, this would be on the gateway side.
    For local development, provides self-signing capability.
    """

    def __init__(self, ca_private_key_pem: Optional[bytes] = None):
        """
        Initialize certificate signer.

        Args:
            ca_private_key_pem: CA private key in PEM format.
                               If None, generates ephemeral key for self-signing.
        """
        if ca_private_key_pem:
            self.ca_private_key = serialization.load_pem_private_key(
                ca_private_key_pem,
                password=None,
                backend=default_backend()
            )
        else:
            # Generate ephemeral CA key for self-signing
            self.ca_private_key = ec.generate_private_key(
                ec.SECP256R1(),
                default_backend()
            )

        self.ca_public_key = self.ca_private_key.public_key()

    def sign_certificate(self, cert: DeviceCertificate) -> bytes:
        """
        Sign a device certificate.

        Args:
            cert: DeviceCertificate to sign

        Returns:
            Signature bytes (ECDSA P-256 in DER format)
        """
        # Create data to sign: certificate_id + device_id + serial + validity
        data_to_sign = f"{cert.certificate_id}:{cert.device_id}:{cert.serial_number}:{cert.valid_until.isoformat()}".encode("utf-8")

        # Sign with CA key
        signature = self.ca_private_key.sign(
            data_to_sign,
            ec.ECDSA(hashes.SHA256())
        )

        return signature

    def verify_certificate(self, cert: DeviceCertificate, signature: bytes) -> bool:
        """
        Verify a signed certificate.

        Args:
            cert: DeviceCertificate to verify
            signature: Signature to verify

        Returns:
            True if signature is valid
        """
        data_to_sign = f"{cert.certificate_id}:{cert.device_id}:{cert.serial_number}:{cert.valid_until.isoformat()}".encode("utf-8")

        try:
            self.ca_public_key.verify(
                signature,
                data_to_sign,
                ec.ECDSA(hashes.SHA256())
            )
            return True
        except Exception:
            return False


def generate_device_certificate(
    device_fingerprint: Optional[str] = None,
    valid_days: int = 30
) -> Tuple[DeviceCertificate, bytes]:
    """
    Convenience function to generate and sign a device certificate.

    Args:
        device_fingerprint: Optional custom device fingerprint
        valid_days: Certificate validity period in days

    Returns:
        Tuple of (DeviceCertificate, signature)
    """
    # Generate certificate
    cert = DeviceCertificate.generate(
        device_fingerprint=device_fingerprint,
        valid_days=valid_days
    )

    # Sign certificate
    signer = CertificateSigner()
    signature = signer.sign_certificate(cert)
    cert.signature = signature

    return cert, signature

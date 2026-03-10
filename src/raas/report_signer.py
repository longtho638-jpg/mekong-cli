"""
Report Signer — ROIaaS Phase 7

Digital signing for audit report integrity and authenticity.
Uses SHA-256 hash chains and RSA signatures.
"""

from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass
import hashlib
import json
import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature
from cryptography.x509 import load_pem_x509_certificate


@dataclass
class SignatureResult:
    """Result of signing operation.

    Attributes:
        signature: Base64-encoded signature
        hash_value: SHA-256 hash of content
        timestamp: Signing timestamp
        key_id: Key identifier used for signing
    """
    signature: str
    hash_value: str
    timestamp: str
    key_id: str


@dataclass
class VerificationResult:
    """Result of signature verification.

    Attributes:
        valid: True if signature is valid
        hash_match: True if content hash matches
        timestamp: Verification timestamp
        error: Error message if verification failed
    """
    valid: bool
    hash_match: bool = True
    timestamp: str = ""
    error: Optional[str] = None


class ReportSigner:
    """Digital signing for audit reports.

    Features:
    - SHA-256 hash chain for log integrity
    - RSA signature for authenticity
    - Timestamp certificates
    - Signature verification
    """

    def __init__(
        self,
        private_key_path: Optional[str] = None,
        public_key_path: Optional[str] = None
    ) -> None:
        """Initialize signer with key paths.

        Args:
            private_key_path: Path to RSA private key PEM file
            public_key_path: Path to RSA public key PEM file (for verification)
        """
        self._private_key: Optional[rsa.RSAPrivateKey] = None
        self._public_key: Optional[rsa.RSAPublicKey] = None
        self._key_id = "default"

        if private_key_path:
            self.load_private_key(private_key_path)
        if public_key_path:
            self.load_public_key(public_key_path)

    def generate_key_pair(
        self,
        key_size: int = 2048,
        private_key_path: str = "~/.mekong/keys/audit_signing.pem",
        public_key_path: str = "~/.mekong/keys/audit_signing_pub.pem"
    ) -> Tuple[str, str]:
        """Generate new RSA key pair.

        Args:
            key_size: RSA key size in bits
            private_key_path: Output path for private key
            public_key_path: Output path for public key

        Returns:
            Tuple of (private_key_path, public_key_path)
        """
        from pathlib import Path

        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )

        # Derive public key
        public_key = private_key.public_key()

        # Create directory if needed
        priv_path = Path(private_key_path).expanduser()
        pub_path = Path(public_key_path).expanduser()
        priv_path.parent.mkdir(parents=True, exist_ok=True)

        # Write private key
        priv_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(priv_path, "wb") as f:
            f.write(priv_pem)
        priv_path.chmod(0o600)  # Restrictive permissions

        # Write public key
        pub_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        with open(pub_path, "wb") as f:
            f.write(pub_pem)

        self._private_key = private_key
        self._public_key = public_key
        self._key_id = self._compute_key_id(public_key)

        return str(priv_path), str(pub_path)

    def load_private_key(self, key_path: str) -> None:
        """Load RSA private key from PEM file.

        Args:
            key_path: Path to private key PEM file
        """
        path = Path(key_path).expanduser()
        with open(path, "rb") as f:
            key_data = f.read()

        self._private_key = serialization.load_pem_private_key(
            key_data,
            password=None,
            backend=default_backend()
        )

        # Extract public key for key_id
        self._public_key = self._private_key.public_key()
        self._key_id = self._compute_key_id(self._public_key)

    def load_public_key(self, key_path: str) -> None:
        """Load RSA public key from PEM file.

        Args:
            key_path: Path to public key PEM file
        """
        path = Path(key_path).expanduser()
        with open(path, "rb") as f:
            key_data = f.read()

        self._public_key = serialization.load_pem_public_key(
            key_data,
            backend=default_backend()
        )
        self._key_id = self._compute_key_id(self._public_key)

    def load_certificate(self, cert_path: str) -> None:
        """Load certificate and extract public key.

        Args:
            cert_path: Path to X.509 certificate PEM file
        """
        path = Path(cert_path).expanduser()
        with open(path, "rb") as f:
            cert_data = f.read()

        cert = load_pem_x509_certificate(cert_data, backend=default_backend())
        self._public_key = cert.public_key()
        self._key_id = self._compute_key_id(self._public_key)

    def sign_report(
        self,
        content: bytes,
        include_timestamp: bool = True
    ) -> SignatureResult:
        """Sign report content with RSA private key.

        Args:
            content: Report content to sign (bytes)
            include_timestamp: Include timestamp in signature metadata

        Returns:
            SignatureResult with signature and metadata

        Raises:
            ValueError: If private key not loaded
        """
        if self._private_key is None:
            raise ValueError("Private key not loaded. Call load_private_key() first.")

        # Compute SHA-256 hash
        hash_value = hashlib.sha256(content).hexdigest()

        # Sign the hash
        signature_bytes = self._private_key.sign(
            content,
            padding.PKCS1v15(),
            hashes.SHA256()
        )

        timestamp = datetime.now(timezone.utc).isoformat() if include_timestamp else ""

        return SignatureResult(
            signature=base64.b64encode(signature_bytes).decode("utf-8"),
            hash_value=hash_value,
            timestamp=timestamp,
            key_id=self._key_id
        )

    def verify_signature(
        self,
        content: bytes,
        signature_b64: str,
        expected_hash: Optional[str] = None
    ) -> VerificationResult:
        """Verify report signature.

        Args:
            content: Original report content (bytes)
            signature_b64: Base64-encoded signature
            expected_hash: Expected SHA-256 hash (optional)

        Returns:
            VerificationResult with verification status
        """
        if self._public_key is None:
            return VerificationResult(
                valid=False,
                hash_match=False,
                timestamp=datetime.now(timezone.utc).isoformat(),
                error="Public key not loaded"
            )

        # Verify hash match if provided
        actual_hash = hashlib.sha256(content).hexdigest()
        hash_match = expected_hash is None or actual_hash == expected_hash

        # Decode signature
        try:
            signature_bytes = base64.b64decode(signature_b64)
        except Exception as e:
            return VerificationResult(
                valid=False,
                hash_match=hash_match,
                timestamp=datetime.now(timezone.utc).isoformat(),
                error=f"Invalid signature encoding: {e}"
            )

        # Verify signature
        try:
            self._public_key.verify(
                signature_bytes,
                content,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            valid = True
            error = None
        except InvalidSignature:
            valid = False
            error = "Signature verification failed"
        except Exception as e:
            valid = False
            error = str(e)

        return VerificationResult(
            valid=valid,
            hash_match=hash_match,
            timestamp=datetime.now(timezone.utc).isoformat(),
            error=error
        )

    def create_signature_file(
        self,
        report_path: str,
        signature_output_path: str
    ) -> SignatureResult:
        """Sign report and save signature to file.

        Args:
            report_path: Path to report file
            signature_output_path: Path for signature output file

        Returns:
            SignatureResult with signing metadata
        """
        # Read report content
        path = Path(report_path).expanduser()
        with open(path, "rb") as f:
            content = f.read()

        # Sign
        result = self.sign_report(content)

        # Save signature metadata
        signature_data = {
            "signature": result.signature,
            "hash_value": result.hash_value,
            "timestamp": result.timestamp,
            "key_id": result.key_id,
            "signed_file": str(path),
        }

        sig_path = Path(signature_output_path).expanduser()
        sig_path.parent.mkdir(parents=True, exist_ok=True)
        with open(sig_path, "w", encoding="utf-8") as f:
            json.dump(signature_data, f, indent=2)

        return result

    def verify_signature_file(
        self,
        report_path: str,
        signature_file_path: str
    ) -> VerificationResult:
        """Verify report against signature file.

        Args:
            report_path: Path to report file
            signature_file_path: Path to signature file

        Returns:
            VerificationResult with verification status
        """
        # Read report content
        path = Path(report_path).expanduser()
        with open(path, "rb") as f:
            content = f.read()

        # Read signature metadata
        sig_path = Path(signature_file_path).expanduser()
        with open(sig_path, "r", encoding="utf-8") as f:
            signature_data = json.load(f)

        return self.verify_signature(
            content,
            signature_data["signature"],
            signature_data.get("hash_value")
        )

    def compute_hash_chain(
        self,
        events: List[Dict[str, Any]],
        previous_hash: str = "0" * 64
    ) -> str:
        """Compute hash chain for event sequence.

        Args:
            events: List of event dictionaries
            previous_hash: Hash of previous block (for chaining)

        Returns:
            SHA-256 hash of chained events
        """
        # Sort events by timestamp for deterministic ordering
        sorted_events = sorted(
            events,
            key=lambda e: e.get("occurred_at", e.get("created_at", e.get("validated_at", "")))
        )

        # Compute hash
        hasher = hashlib.sha256()
        hasher.update(previous_hash.encode())

        for event in sorted_events:
            # Canonical JSON representation (sorted keys)
            event_json = json.dumps(event, sort_keys=True)
            hasher.update(event_json.encode())

        return hasher.hexdigest()

    def _compute_key_id(self, public_key: rsa.RSAPublicKey) -> str:
        """Compute key ID from public key fingerprint.

        Args:
            public_key: RSA public key

        Returns:
            Hex-encoded key ID (first 16 chars of SHA-256 fingerprint)
        """
        pub_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        fingerprint = hashlib.sha256(pub_pem).hexdigest()
        return fingerprint[:16]

    @property
    def key_id(self) -> str:
        """Get current key identifier."""
        return self._key_id


# Module-level convenience functions
_signer: Optional[ReportSigner] = None


def get_signer() -> ReportSigner:
    """Get global signer instance."""
    global _signer
    if _signer is None:
        _signer = ReportSigner()
    return _signer


def sign_file(
    report_path: str,
    signature_path: str,
    private_key_path: Optional[str] = None
) -> SignatureResult:
    """Sign a report file.

    Args:
        report_path: Path to report file
        signature_path: Path for signature output
        private_key_path: Path to private key (uses default if None)

    Returns:
        SignatureResult with signing metadata
    """
    signer = get_signer()
    if private_key_path:
        signer.load_private_key(private_key_path)
    return signer.create_signature_file(report_path, signature_path)


def verify_file(
    report_path: str,
    signature_path: str,
    public_key_path: Optional[str] = None
) -> VerificationResult:
    """Verify a report file signature.

    Args:
        report_path: Path to report file
        signature_path: Path to signature file
        public_key_path: Path to public key (uses default if None)

    Returns:
        VerificationResult with verification status
    """
    signer = get_signer()
    if public_key_path:
        signer.load_public_key(public_key_path)
    return signer.verify_signature_file(report_path, signature_path)


__all__ = [
    "ReportSigner",
    "SignatureResult",
    "VerificationResult",
    "get_signer",
    "sign_file",
    "verify_file",
]

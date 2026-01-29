"""
Signature Service for Webhooks.
Handles multi-algorithm signature generation and verification.
"""

import base64
import hashlib
import hmac
import time
from typing import Optional, Tuple, Union

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519, padding, rsa


class SignatureService:
    """
    Service for generating and verifying webhook signatures using various algorithms.
    Supported algorithms: HMAC-SHA256, HMAC-SHA512, Ed25519, RSA.
    """

    @staticmethod
    def generate_hmac_signature(
        payload: Union[str, bytes], secret: str, algorithm: str = "sha256"
    ) -> str:
        """
        Generate HMAC signature.
        """
        if isinstance(payload, str):
            payload = payload.encode("utf-8")

        digest_method = getattr(hashlib, algorithm, hashlib.sha256)

        signature = hmac.new(
            key=secret.encode("utf-8"), msg=payload, digestmod=digest_method
        ).hexdigest()

        return signature

    @staticmethod
    def generate_ed25519_signature(payload: Union[str, bytes], private_key_pem: str) -> str:
        """
        Generate Ed25519 signature.
        """
        if isinstance(payload, str):
            payload = payload.encode("utf-8")

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode("utf-8"), password=None
        )

        if not isinstance(private_key, ed25519.Ed25519PrivateKey):
            raise ValueError("Invalid key type. Expected Ed25519PrivateKey.")

        signature = private_key.sign(payload)
        return base64.b64encode(signature).decode("utf-8")

    @staticmethod
    def generate_rsa_signature(payload: Union[str, bytes], private_key_pem: str) -> str:
        """
        Generate RSA signature (SHA256).
        """
        if isinstance(payload, str):
            payload = payload.encode("utf-8")

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode("utf-8"), password=None
        )

        if not isinstance(private_key, rsa.RSAPrivateKey):
            raise ValueError("Invalid key type. Expected RSAPrivateKey.")

        signature = private_key.sign(
            payload,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return base64.b64encode(signature).decode("utf-8")

    @staticmethod
    def verify_hmac_signature(
        payload: Union[str, bytes], secret: str, signature: str, algorithm: str = "sha256"
    ) -> bool:
        """
        Verify HMAC signature.
        """
        expected_signature = SignatureService.generate_hmac_signature(payload, secret, algorithm)
        return hmac.compare_digest(expected_signature, signature)

    @staticmethod
    def verify_ed25519_signature(
        payload: Union[str, bytes], public_key_pem: str, signature: str
    ) -> bool:
        """
        Verify Ed25519 signature.
        """
        if isinstance(payload, str):
            payload = payload.encode("utf-8")

        try:
            public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
            signature_bytes = base64.b64decode(signature)

            if not isinstance(public_key, ed25519.Ed25519PublicKey):
                return False

            public_key.verify(signature_bytes, payload)
            return True
        except (InvalidSignature, Exception):
            return False

    @staticmethod
    def verify_rsa_signature(
        payload: Union[str, bytes], public_key_pem: str, signature: str
    ) -> bool:
        """
        Verify RSA signature.
        """
        if isinstance(payload, str):
            payload = payload.encode("utf-8")

        try:
            public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
            signature_bytes = base64.b64decode(signature)

            if not isinstance(public_key, rsa.RSAPublicKey):
                return False

            public_key.verify(
                signature_bytes,
                payload,
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA256(),
            )
            return True
        except (InvalidSignature, Exception):
            return False

    @staticmethod
    def construct_header_value(timestamp: int, signature: str, version: str = "v1") -> str:
        """
        Construct standard signature header value.
        Format: t=TIMESTAMP,v1=SIGNATURE
        """
        return f"t={timestamp},{version}={signature}"

    @staticmethod
    def verify_timestamp(timestamp: int, tolerance: int = 300) -> bool:
        """
        Verify timestamp is within tolerance (default 5 minutes).
        """
        now = int(time.time())
        return abs(now - timestamp) <= tolerance

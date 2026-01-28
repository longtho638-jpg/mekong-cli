import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519, rsa

from backend.services.webhooks.signature_service import SignatureService


class TestSignatureService:

    def test_hmac_sha256(self):
        payload = "test_payload"
        secret = "test_secret"

        signature = SignatureService.generate_hmac_signature(payload, secret, 'sha256')
        assert signature is not None

        is_valid = SignatureService.verify_hmac_signature(payload, secret, signature, 'sha256')
        assert is_valid is True

        is_invalid = SignatureService.verify_hmac_signature(payload, "wrong_secret", signature, 'sha256')
        assert is_invalid is False

    def test_ed25519(self):
        # Generate keys
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()

        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        payload = "data_to_sign"
        signature = SignatureService.generate_ed25519_signature(payload, private_pem)

        assert SignatureService.verify_ed25519_signature(payload, public_pem, signature) is True
        assert SignatureService.verify_ed25519_signature("modified_data", public_pem, signature) is False

    def test_rsa(self):
        # Generate keys
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        public_key = private_key.public_key()

        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        payload = "rsa_payload"
        signature = SignatureService.generate_rsa_signature(payload, private_pem)

        assert SignatureService.verify_rsa_signature(payload, public_pem, signature) is True
        assert SignatureService.verify_rsa_signature(payload, public_pem, "invalid_sig") is False

    def test_timestamp_verification(self):
        now = int(time.time())
        assert SignatureService.verify_timestamp(now) is True
        assert SignatureService.verify_timestamp(now - 200) is True  # Within 300s
        assert SignatureService.verify_timestamp(now - 400) is False # Outside 300s

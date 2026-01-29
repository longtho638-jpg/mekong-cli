import base64
import io
import os
from typing import BinaryIO

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from backend.services.backup.interfaces import IEncryptionService


class AesEncryptionService(IEncryptionService):
    def __init__(self, key: str = None):
        """
        Initialize with a key.
        If no key provided, tries to load from BACKUP_ENCRYPTION_KEY env var.
        """
        self.key = key or os.getenv("BACKUP_ENCRYPTION_KEY")
        if not self.key:
            # Fallback for dev/test if allowed, or raise error in prod
            # For now we generate one if missing but this won't be persistent!
            # In production this MUST be provided.
            pass

    def _get_fernet(self) -> Fernet:
        if not self.key:
            raise ValueError("Encryption key is required for AesEncryptionService")

        # Ensure key is 32 url-safe base64-encoded bytes
        # If the provided key is a password, we should derive a key,
        # but for simplicity assuming a pre-generated Fernet key or similar strong secret.
        # If it's a raw string, let's derive a key.

        try:
            return Fernet(self.key)
        except Exception:
            # Assume it's a password and derive
            salt = b"agency_os_backup_salt"  # In prod, store salt with backup
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.key.encode()))
            return Fernet(key)

    def encrypt(self, data: BinaryIO) -> BinaryIO:
        f = self._get_fernet()
        # Fernet encrypts bytes. We need to read the stream.
        # Note: For very large streams, this loads into memory.
        # Production grade should use streaming encryption (e.g. cryptography hazmat primitives directly).
        # For MVP/IPO readiness with reasonable DB sizes, this is okay but could be improved.
        raw_data = data.read()
        encrypted_data = f.encrypt(raw_data)
        return io.BytesIO(encrypted_data)

    def decrypt(self, data: BinaryIO) -> BinaryIO:
        f = self._get_fernet()
        encrypted_data = data.read()
        decrypted_data = f.decrypt(encrypted_data)
        return io.BytesIO(decrypted_data)

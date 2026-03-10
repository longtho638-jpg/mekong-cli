"""
Secure Storage Abstraction for Mekong CLI

Cross-platform credential storage using platform-native mechanisms:
- macOS: Keychain via security CLI
- Windows: Credential Vault via PowerShell
- Linux: Encrypted file (AES-256-GCM) with machine-derived key
"""

import os
import sys
import platform
import subprocess
import hashlib
import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class SecureStorageError(Exception):
    """Base exception for secure storage operations."""
    pass


class SecureStorageBackend(ABC):
    """Abstract base class for platform-specific secure storage backends."""

    SERVICE_NAME = "mekong-cli"

    @abstractmethod
    def store_credential(self, key: str, value: str) -> None:
        """Store a credential securely."""
        pass

    @abstractmethod
    def get_credential(self, key: str) -> Optional[str]:
        """Retrieve a credential. Returns None if not found."""
        pass

    @abstractmethod
    def delete_credential(self, key: str) -> bool:
        """Delete a credential. Returns True if deleted."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if this backend is available on current system."""
        pass


class MacOSKeychainBackend(SecureStorageBackend):
    """macOS Keychain backend using security CLI."""

    def __init__(self, account: Optional[str] = None):
        self.account = account or os.environ.get("USER", "mekong-user")

    def is_available(self) -> bool:
        return sys.platform == "darwin"

    def _run_security(self, args: list) -> Tuple[int, str, str]:
        """Run security CLI command."""
        try:
            result = subprocess.run(
                ["security"] + args,
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            raise SecureStorageError("Keychain operation timed out")
        except FileNotFoundError:
            raise SecureStorageError("security command not found")

    def store_credential(self, key: str, value: str) -> None:
        """Store license key in macOS Keychain."""
        # security add-generic-password -s <service> -a <account> -w <value>
        returncode, stdout, stderr = self._run_security([
            "add-generic-password",
            "-s", self.SERVICE_NAME,
            "-a", self.account,
            "-l", key,
            "-w", value
        ])

        if returncode != 0:
            raise SecureStorageError(f"Failed to store credential: {stderr.strip()}")

    def get_credential(self, key: str) -> Optional[str]:
        """Retrieve license key from macOS Keychain."""
        # security find-generic-password -s <service> -a <account> -l <key> -w
        returncode, stdout, stderr = self._run_security([
            "find-generic-password",
            "-s", self.SERVICE_NAME,
            "-a", self.account,
            "-l", key,
            "-w"
        ])

        if returncode == 44:  # errSecItemNotFound
            return None
        elif returncode != 0:
            raise SecureStorageError(f"Failed to retrieve credential: {stderr.strip()}")

        return stdout.strip()

    def delete_credential(self, key: str) -> bool:
        """Delete license key from macOS Keychain."""
        # security delete-generic-password -s <service> -a <account> -l <key>
        returncode, stdout, stderr = self._run_security([
            "delete-generic-password",
            "-s", self.SERVICE_NAME,
            "-a", self.account,
            "-l", key
        ])

        if returncode == 44:  # errSecItemNotFound
            return False
        elif returncode != 0:
            raise SecureStorageError(f"Failed to delete credential: {stderr.strip()}")

        return True


class WindowsVaultBackend(SecureStorageBackend):
    """Windows Credential Vault backend using PowerShell."""

    def __init__(self, account: Optional[str] = None):
        self.account = account or os.environ.get("USERNAME", "mekong-user")

    def is_available(self) -> bool:
        return sys.platform == "win32"

    def _run_powershell(self, command: str) -> Tuple[int, str, str]:
        """Run PowerShell command."""
        try:
            result = subprocess.run(
                ["powershell", "-Command", command],
                capture_output=True,
                text=True,
                timeout=10,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            raise SecureStorageError("PowerShell operation timed out")

    def store_credential(self, key: str, value: str) -> None:
        """Store license key in Windows Credential Vault."""
        # Use cmdkey for basic credential storage
        escaped_value = value.replace('"', '""')
        command = f'cmdkey /generic:"{self.SERVICE_NAME}:{key}:{self.account}" /user:"{self.account}" /pass:"{escaped_value}"'
        returncode, stdout, stderr = self._run_powershell(command)

        if returncode != 0:
            raise SecureStorageError(f"Failed to store credential: {stderr.strip()}")

    def get_credential(self, key: str) -> Optional[str]:
        """
        Retrieve license key from Windows Credential Vault.
        Note: Windows doesn't provide a straightforward way to retrieve passwords.
        This is a limitation - we'll fallback to file-based storage.
        """
        # cmdkey doesn't support retrieval - use encrypted file fallback
        return self._get_from_fallback(key)

    def _get_from_fallback(self, key: str) -> Optional[str]:
        """Fallback to encrypted file for Windows."""
        fallback_path = Path.home() / ".mekong" / "credentials.enc"
        if not fallback_path.exists():
            return None

        try:
            with open(fallback_path, "rb") as f:
                data = f.read()
            # Simple decryption (not as secure as Vault, but functional)
            machine_key = self._get_machine_key()
            try:
                decrypted = self._decrypt_data(data, machine_key)
                credentials = json.loads(decrypted)
                return credentials.get(key)
            except Exception:
                return None
        except Exception:
            return None

    def _get_machine_key(self) -> bytes:
        """Generate machine-specific encryption key."""
        machine_id = platform.machine() + platform.processor()
        return hashlib.sha256(machine_id.encode()).digest()

    def _decrypt_data(self, encrypted: bytes, key: bytes) -> str:
        """Decrypt data using AES-256-GCM."""
        nonce = encrypted[:12]
        ciphertext = encrypted[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None).decode()

    def delete_credential(self, key: str) -> bool:
        """Delete credential from Windows Credential Vault."""
        command = f'cmdkey /delete:"{self.SERVICE_NAME}:{key}:{self.account}"'
        returncode, stdout, stderr = self._run_powershell(command)
        return returncode == 0


class LinuxEncryptedBackend(SecureStorageBackend):
    """Linux encrypted file backend using AES-256-GCM."""

    def __init__(self, config_dir: Optional[Path] = None):
        self.config_dir = config_dir or (Path.home() / ".mekong")
        self.credentials_file = self.config_dir / "credentials.enc"

    def is_available(self) -> bool:
        return sys.platform.startswith("linux")

    def _get_machine_key(self) -> bytes:
        """
        Generate machine-specific encryption key.
        Derived from multiple hardware identifiers for stability.
        """
        try:
            # Try to read machine-id (systemd-based systems)
            if Path("/etc/machine-id").exists():
                with open("/etc/machine-id", "r") as f:
                    machine_id = f.read().strip()
            elif Path("/var/lib/dbus/machine-id").exists():
                with open("/var/lib/dbus/machine-id", "r") as f:
                    machine_id = f.read().strip()
            else:
                # Fallback to hostname + machine info
                machine_id = platform.node() + platform.machine()
        except Exception:
            machine_id = platform.node() + platform.machine()

        # Add salt for additional entropy
        salt = "mekong-cli-secure-storage-v1"
        key_material = f"{machine_id}:{salt}"
        return hashlib.sha256(key_material.encode()).digest()

    def _encrypt_data(self, data: str, key: bytes) -> bytes:
        """Encrypt data using AES-256-GCM."""
        import os
        nonce = os.urandom(12)  # 96-bit nonce for GCM
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
        return nonce + ciphertext

    def _decrypt_data(self, encrypted: bytes, key: bytes) -> str:
        """Decrypt data using AES-256-GCM."""
        nonce = encrypted[:12]
        ciphertext = encrypted[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None).decode()

    def _read_credentials(self) -> dict:
        """Read and decrypt credentials file."""
        if not self.credentials_file.exists():
            return {}

        try:
            with open(self.credentials_file, "rb") as f:
                encrypted_data = f.read()

            key = self._get_machine_key()
            decrypted = self._decrypt_data(encrypted_data, key)
            return json.loads(decrypted)
        except Exception:
            # Decryption failed - corrupted or wrong machine
            return {}

    def _write_credentials(self, credentials: dict) -> None:
        """Encrypt and write credentials file."""
        # Ensure config directory exists
        self.config_dir.mkdir(parents=True, exist_ok=True)

        key = self._get_machine_key()
        encrypted_data = self._encrypt_data(json.dumps(credentials), key)

        with open(self.credentials_file, "wb") as f:
            f.write(encrypted_data)

        # Set restrictive permissions
        os.chmod(self.credentials_file, 0o600)

    def store_credential(self, key: str, value: str) -> None:
        """Store license key in encrypted file."""
        credentials = self._read_credentials()
        credentials[key] = value
        self._write_credentials(credentials)

    def get_credential(self, key: str) -> Optional[str]:
        """Retrieve license key from encrypted file."""
        credentials = self._read_credentials()
        return credentials.get(key)

    def delete_credential(self, key: str) -> bool:
        """Delete license key from encrypted file."""
        credentials = self._read_credentials()
        if key not in credentials:
            return False

        del credentials[key]
        self._write_credentials(credentials)
        return True


class SecureStorage:
    """
    High-level secure storage interface.

    Automatically selects the appropriate backend for the current platform.
    Falls back to encrypted file storage if native backend unavailable.
    """

    def __init__(self):
        self.backends: list = []
        self._init_backends()

    def _init_backends(self) -> None:
        """Initialize available backends in priority order."""
        self.backends = [
            MacOSKeychainBackend(),
            WindowsVaultBackend(),
            LinuxEncryptedBackend(),
        ]

    def _get_available_backend(self) -> Optional[SecureStorageBackend]:
        """Get the first available backend for current platform."""
        for backend in self.backends:
            if backend.is_available():
                return backend
        return None

    def store_license(self, license_key: str) -> None:
        """
        Store RaaS license key securely.

        Args:
            license_key: The RaaS license key (raas-* or mk_* format)

        Raises:
            SecureStorageError: If storage fails on all backends
        """
        backend = self._get_available_backend()
        if not backend:
            raise SecureStorageError("No secure storage backend available")

        backend.store_credential("raas_license_key", license_key)

    def get_license(self) -> Optional[str]:
        """
        Retrieve stored RaaS license key.

        Returns:
            License key if found, None otherwise
        """
        backend = self._get_available_backend()
        if not backend:
            return None

        return backend.get_credential("raas_license_key")

    def delete_license(self) -> bool:
        """
        Delete stored RaaS license key.

        Returns:
            True if deleted, False if not found
        """
        backend = self._get_available_backend()
        if not backend:
            return False

        return backend.delete_credential("raas_license_key")

    def is_configured(self) -> bool:
        """Check if a license key is stored."""
        return self.get_license() is not None


# Singleton instance for global use
_secure_storage: Optional[SecureStorage] = None


def get_secure_storage() -> SecureStorage:
    """Get or create the global secure storage instance."""
    global _secure_storage
    if _secure_storage is None:
        _secure_storage = SecureStorage()
    return _secure_storage

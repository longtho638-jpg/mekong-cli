"""
Two-Factor Authentication (2FA/TOTP) Service

Provides comprehensive 2FA/TOTP functionality including:
- TOTP secret generation and QR code URL generation
- TOTP code verification
- Enable/disable 2FA per user
- Backup codes generation and verification
- Secure secret storage recommendations

Uses pyotp for TOTP implementation following RFC 6238.
"""

import hashlib
import logging
import os
import secrets
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# Try to import pyotp, fallback to mock if not available
try:
    import base64
    import io

    import pyotp
    import qrcode
    PYOTP_AVAILABLE = True
except ImportError:
    PYOTP_AVAILABLE = False
    pyotp = None
    qrcode = None

logger = logging.getLogger(__name__)


class TwoFactorService:
    """
    Two-Factor Authentication service using TOTP (Time-based One-Time Password)

    Features:
    - Generate TOTP secrets
    - Generate QR codes for easy setup with authenticator apps
    - Verify TOTP codes with time window tolerance
    - Generate backup codes for account recovery
    - Verify backup codes (one-time use)
    """

    def __init__(
        self,
        issuer_name: Optional[str] = None,
        mock_mode: bool = False,
        backup_codes_count: int = 10,
        totp_interval: int = 30,
        totp_digits: int = 6,
    ):
        """
        Initialize Two-Factor Authentication service

        Args:
            issuer_name: Name of the service/issuer for TOTP (shown in authenticator apps)
            mock_mode: If True, use mock implementation without pyotp
            backup_codes_count: Number of backup codes to generate (default: 10)
            totp_interval: TOTP time step in seconds (default: 30)
            totp_digits: Number of digits in TOTP code (default: 6)
        """
        self.issuer_name = issuer_name or os.getenv("APP_NAME", "Agency OS")
        self.mock_mode = mock_mode or not PYOTP_AVAILABLE
        self.backup_codes_count = backup_codes_count
        self.totp_interval = totp_interval
        self.totp_digits = totp_digits

        if self.mock_mode:
            logger.warning(
                "TwoFactorService running in MOCK MODE - "
                "pyotp not available or mock_mode=True"
            )

    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret (base32-encoded random key)

        Returns:
            str: Base32-encoded secret key (32 characters)

        Example:
            >>> service = TwoFactorService()
            >>> secret = service.generate_secret()
            >>> len(secret)
            32
        """
        if self.mock_mode:
            # Mock: generate a realistic-looking base32 secret
            return secrets.token_urlsafe(20)[:32].upper().replace("-", "A").replace("_", "B")

        return pyotp.random_base32()

    def get_provisioning_uri(
        self,
        secret: str,
        user_identifier: str,
        issuer_name: Optional[str] = None,
    ) -> str:
        """
        Generate provisioning URI for QR code generation

        Args:
            secret: The TOTP secret key
            user_identifier: User's email or username
            issuer_name: Override issuer name (optional)

        Returns:
            str: Provisioning URI (otpauth://totp/...)

        Example:
            >>> service = TwoFactorService(issuer_name="MyApp")
            >>> uri = service.get_provisioning_uri("JBSWY3DPEHPK3PXP", "user@example.com")
            >>> uri.startswith("otpauth://totp/")
            True
        """
        issuer = issuer_name or self.issuer_name

        if self.mock_mode:
            # Mock: generate a realistic provisioning URI
            return (
                f"otpauth://totp/{issuer}:{user_identifier}"
                f"?secret={secret}&issuer={issuer}&digits={self.totp_digits}&period={self.totp_interval}"
            )

        totp = pyotp.TOTP(
            secret,
            interval=self.totp_interval,
            digits=self.totp_digits,
        )
        return totp.provisioning_uri(
            name=user_identifier,
            issuer_name=issuer,
        )

    def get_qr_code_url(
        self,
        secret: str,
        user_identifier: str,
        issuer_name: Optional[str] = None,
    ) -> str:
        """
        Generate QR code URL for TOTP setup

        This returns a data URL that can be embedded in HTML as:
        <img src="{{ qr_code_url }}" alt="2FA QR Code">

        Args:
            secret: The TOTP secret key
            user_identifier: User's email or username
            issuer_name: Override issuer name (optional)

        Returns:
            str: Data URL for QR code image (data:image/png;base64,...)

        Example:
            >>> service = TwoFactorService()
            >>> url = service.get_qr_code_url("JBSWY3DPEHPK3PXP", "user@example.com")
            >>> url.startswith("data:image/png;base64,")
            True
        """
        provisioning_uri = self.get_provisioning_uri(
            secret,
            user_identifier,
            issuer_name,
        )

        if self.mock_mode:
            # Mock: return a placeholder data URL
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64 data URL
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"

    def verify_totp(
        self,
        secret: str,
        code: str,
        valid_window: int = 1,
    ) -> bool:
        """
        Verify a TOTP code against the secret

        Args:
            secret: The TOTP secret key
            code: The 6-digit code from authenticator app
            valid_window: Number of time windows to check (default: 1)
                         This allows for clock skew tolerance
                         valid_window=1 checks current + 1 past + 1 future window

        Returns:
            bool: True if code is valid, False otherwise

        Example:
            >>> service = TwoFactorService()
            >>> secret = service.generate_secret()
            >>> # In real usage, get code from authenticator app
            >>> service.verify_totp(secret, "123456")
            False  # Unless code matches current time window
        """
        if not code or not secret:
            return False

        # Remove spaces and ensure 6 digits
        code = code.replace(" ", "").strip()
        if not code.isdigit() or len(code) != self.totp_digits:
            logger.warning(f"Invalid TOTP code format: {len(code)} digits")
            return False

        if self.mock_mode:
            # Mock: accept code "123456" for testing
            logger.info(f"MOCK: Verifying TOTP code: {code}")
            return code == "123456"

        totp = pyotp.TOTP(
            secret,
            interval=self.totp_interval,
            digits=self.totp_digits,
        )

        # Verify with time window tolerance
        is_valid = totp.verify(code, valid_window=valid_window)

        if is_valid:
            logger.info("TOTP code verified successfully")
        else:
            logger.warning("TOTP code verification failed")

        return is_valid

    def generate_backup_codes(self, count: Optional[int] = None) -> List[str]:
        """
        Generate backup codes for account recovery

        Backup codes should be:
        - Stored hashed in the database (like passwords)
        - Shown to user only once during generation
        - Marked as used after verification

        Args:
            count: Number of backup codes to generate (default: from init)

        Returns:
            List[str]: List of backup codes (e.g., ["XXXX-XXXX", ...])

        Example:
            >>> service = TwoFactorService(backup_codes_count=5)
            >>> codes = service.generate_backup_codes()
            >>> len(codes)
            5
            >>> len(codes[0])
            9  # Format: XXXX-XXXX
        """
        count = count or self.backup_codes_count
        codes = []

        for _ in range(count):
            # Generate 8-character alphanumeric code
            # Format: XXXX-XXXX (easier to read and type)
            # Use token_hex for purely alphanumeric output (0-9, A-F)
            code = secrets.token_hex(4).upper()  # 4 bytes = 8 hex chars
            formatted_code = f"{code[:4]}-{code[4:]}"
            codes.append(formatted_code)

        logger.info(f"Generated {count} backup codes")
        return codes

    def hash_backup_code(self, code: str) -> str:
        """
        Hash a backup code for secure storage

        Use this before storing backup codes in the database.
        Store the hash, not the plain code.

        Args:
            code: Plain backup code (e.g., "ABCD-EFGH")

        Returns:
            str: SHA-256 hash of the code (hex string)

        Example:
            >>> service = TwoFactorService()
            >>> hashed = service.hash_backup_code("ABCD-EFGH")
            >>> len(hashed)
            64  # SHA-256 hex length
        """
        # Remove hyphens and normalize to uppercase
        normalized = code.replace("-", "").upper().strip()

        # Hash with SHA-256
        return hashlib.sha256(normalized.encode()).hexdigest()

    def verify_backup_code(
        self,
        code: str,
        stored_hashes: List[str],
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify a backup code against stored hashes

        Returns both validity and the matching hash (for one-time use marking).

        Args:
            code: Plain backup code from user
            stored_hashes: List of hashed backup codes from database

        Returns:
            Tuple[bool, Optional[str]]: (is_valid, matching_hash)
                - is_valid: True if code matches any stored hash
                - matching_hash: The hash that matched (to mark as used)

        Example:
            >>> service = TwoFactorService()
            >>> codes = service.generate_backup_codes(count=3)
            >>> hashes = [service.hash_backup_code(c) for c in codes]
            >>> is_valid, matched = service.verify_backup_code(codes[0], hashes)
            >>> is_valid
            True
            >>> matched in hashes
            True
        """
        if not code or not stored_hashes:
            return False, None

        code_hash = self.hash_backup_code(code)

        if code_hash in stored_hashes:
            logger.info("Backup code verified successfully")
            return True, code_hash

        logger.warning("Backup code verification failed")
        return False, None

    def enable_2fa_for_user(
        self,
        user_id: str,
        secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Enable 2FA for a user

        This is a helper method that generates all necessary data for 2FA setup.

        Args:
            user_id: User identifier (email or username)
            secret: Optional pre-generated secret (will generate if not provided)

        Returns:
            Dict with:
                - secret: TOTP secret key (store encrypted in DB)
                - qr_code_url: Data URL for QR code
                - provisioning_uri: URI for manual entry
                - backup_codes: List of plain backup codes (show once!)
                - backup_codes_hashed: List of hashed codes (store in DB)

        Example:
            >>> service = TwoFactorService()
            >>> result = service.enable_2fa_for_user("user@example.com")
            >>> "secret" in result
            True
            >>> "qr_code_url" in result
            True
            >>> len(result["backup_codes"])
            10
        """
        # Generate or use provided secret
        secret = secret or self.generate_secret()

        # Generate QR code and provisioning URI
        qr_code_url = self.get_qr_code_url(secret, user_id)
        provisioning_uri = self.get_provisioning_uri(secret, user_id)

        # Generate backup codes
        backup_codes = self.generate_backup_codes()
        backup_codes_hashed = [self.hash_backup_code(code) for code in backup_codes]

        logger.info(f"2FA enabled for user: {user_id}")

        return {
            "secret": secret,
            "qr_code_url": qr_code_url,
            "provisioning_uri": provisioning_uri,
            "backup_codes": backup_codes,  # Show to user ONCE
            "backup_codes_hashed": backup_codes_hashed,  # Store in DB
        }

    def disable_2fa_for_user(self, user_id: str) -> bool:
        """
        Disable 2FA for a user

        This is a helper method for the disable flow.
        In practice, you would:
        1. Verify user identity (password or backup code)
        2. Delete TOTP secret from database
        3. Delete backup codes from database
        4. Update user's 2FA status

        Args:
            user_id: User identifier

        Returns:
            bool: True if disabled successfully

        Example:
            >>> service = TwoFactorService()
            >>> service.disable_2fa_for_user("user@example.com")
            True
        """
        logger.info(f"2FA disabled for user: {user_id}")
        return True


# Singleton instance for dependency injection
_two_factor_service: Optional[TwoFactorService] = None


def get_two_factor_service() -> TwoFactorService:
    """
    Get or create the TwoFactorService singleton instance

    Returns:
        TwoFactorService: The service instance
    """
    global _two_factor_service
    if _two_factor_service is None:
        _two_factor_service = TwoFactorService()
    return _two_factor_service

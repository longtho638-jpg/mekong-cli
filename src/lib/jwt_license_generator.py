"""
JWT License Token Generator — ROIaaS Phase 7

Generates and validates JWT-based offline license tokens with embedded quotas.
Format: raasjwt-[tier]-[jwt_token]

Features:
- RSA-signed JWT for cryptographic verification
- Embedded quotas (commands_per_day, max_projects, features)
- Embedded expiration timestamp
- Works fully offline (no server contact needed)
- Public key for verification, private key for signing

Reference: docs/HIEN_PHAP_ROIAAS.md - ROIaaS Phase 7
"""

import os
from typing import Optional, Tuple, Dict, Any
from datetime import datetime, timezone, timedelta

from jose import jwt, JWSError
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

from src.config.logging_config import get_logger

logger = get_logger(__name__)

# JWT configuration
JWT_ALGORITHM = "RS256"
JWT_EXPIRY_HOURS = 24 * 30  # 30 days default
JWT_ISSUER = "mekong-cli-raas"
JWT_AUDIENCE = "raas-license"

# Keys paths
PRIVATE_KEY_PATH = os.path.expanduser("~/.mekong/raas/jwt_private_key.pem")
PUBLIC_KEY_PATH = os.path.expanduser("~/.mekong/raas/jwt_public_key.pem")


class JWTLicenseGenerator:
    """Generate and validate JWT-based offline license tokens."""

    def __init__(
        self,
        private_key_path: str = PRIVATE_KEY_PATH,
        public_key_path: str = PUBLIC_KEY_PATH,
    ) -> None:
        """
        Initialize generator with key paths.

        Args:
            private_key_path: Path to RSA private key (for signing)
            public_key_path: Path to RSA public key (for verification)
        """
        self._private_key_path = private_key_path
        self._public_key_path = public_key_path
        self._private_key: Optional[Any] = None
        self._public_key: Optional[Any] = None

    def _ensure_keys_exist(self) -> Tuple[str, str]:
        """
        Ensure RSA key pair exists, generate if missing.

        Returns:
            Tuple of (private_key_path, public_key_path)
        """
        # Check if keys exist
        if os.path.exists(self._private_key_path) and os.path.exists(self._public_key_path):
            return self._private_key_path, self._public_key_path

        # Generate new key pair
        logger.info(
            "jwt_license_generator.generating_keys",
            message="Generating new RSA key pair for JWT licenses",
        )

        # Generate RSA 2048-bit key pair
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )

        # Create directory if needed
        os.makedirs(os.path.dirname(self._private_key_path), exist_ok=True)

        # Save private key (PEM format)
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        with open(self._private_key_path, "wb") as f:
            f.write(private_pem)
        os.chmod(self._private_key_path, 0o600)  # Private key: read-only for owner

        # Save public key (PEM format)
        public_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        with open(self._public_key_path, "wb") as f:
            f.write(public_pem)

        logger.info(
            "jwt_license_generator.keys_generated",
            message=f"RSA key pair generated: {self._private_key_path}, {self._public_key_path}",
        )

        return self._private_key_path, self._public_key_path

    def _load_private_key(self) -> Any:
        """Load private key from file."""
        if self._private_key is not None:
            return self._private_key

        self._ensure_keys_exist()

        with open(self._private_key_path, "rb") as f:
            self._private_key = serialization.load_pem_private_key(
                f.read(),
                password=None,
                backend=default_backend(),
            )

        return self._private_key

    def _load_public_key(self) -> Any:
        """Load public key from file."""
        if self._public_key is not None:
            return self._public_key

        self._ensure_keys_exist()

        with open(self._public_key_path, "rb") as f:
            self._public_key = serialization.load_pem_public_key(
                f.read(),
                backend=default_backend(),
            )

        return self._public_key

    def generate_token(
        self,
        tier: str,
        key_id: str,
        email: str,
        days: Optional[int] = None,
        custom_quotas: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate a new JWT license token.

        Args:
            tier: License tier (free, trial, pro, enterprise)
            key_id: Unique key identifier
            email: User email
            days: Optional expiry in days (default: 30)
            custom_quotas: Optional custom quota overrides

        Returns:
            JWT token string: raasjwt-[tier]-[jwt_token]

        Raises:
            ValueError: If tier is invalid
        """
        if tier not in {"free", "trial", "pro", "enterprise"}:
            raise ValueError(f"Invalid tier: {tier}")

        # Get default quotas for tier
        quotas = self._get_tier_quotas(tier)

        # Override with custom quotas if provided
        if custom_quotas:
            quotas.update(custom_quotas)

        # Build JWT payload
        now = datetime.now(timezone.utc)
        expiry_days = days or JWT_EXPIRY_HOURS // 24
        exp = now + timedelta(days=expiry_days)

        payload = {
            # Standard JWT claims
            "iss": JWT_ISSUER,
            "aud": JWT_AUDIENCE,
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "jti": key_id,  # Unique token ID

            # License-specific claims
            "tier": tier,
            "key_id": key_id,
            "email": email,

            # Embedded quotas (for offline enforcement)
            "quotas": quotas,

            # Features enabled
            "features": self._get_tier_features(tier),
        }

        # Sign JWT
        private_key = self._load_private_key()
        token = jwt.encode(
            payload,
            private_key,
            algorithm=JWT_ALGORITHM,
        )

        # Format: raasjwt-[tier]-[jwt_token]
        return f"raasjwt-{tier}-{token}"

    def validate_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Validate a JWT license token.

        Args:
            token: JWT token to validate (raasjwt-[tier]-[jwt_token])

        Returns:
            Tuple of (is_valid, decoded_payload, error_message)

        Validation checks:
        1. Format: raasjwt-[tier]-[jwt]
        2. Signature: RSA-signed by trusted private key
        3. Expiration: exp > now
        4. Issuer: iss == "mekong-cli-raas"
        5. Audience: aud == "raas-license"
        """
        # Parse format: raasjwt-[tier]-[jwt_token]
        parts = token.split("-", 2)
        if len(parts) < 3:
            return False, None, "Invalid format: expected raasjwt-[tier]-[jwt_token]"

        if parts[0] != "raasjwt":
            return False, None, "Invalid prefix: must start with 'raasjwt-'"

        tier = parts[1]
        if tier not in {"free", "trial", "pro", "enterprise"}:
            return False, None, f"Invalid tier: {tier}"

        jwt_token = parts[2]

        try:
            # Load public key for verification
            public_key = self._load_public_key()

            # Decode and verify JWT
            payload = jwt.decode(
                jwt_token,
                public_key,
                algorithms=[JWT_ALGORITHM],
                issuer=JWT_ISSUER,
                audience=JWT_AUDIENCE,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_iss": True,
                    "verify_aud": True,
                },
            )

            # Validate payload has required fields
            required_fields = ["tier", "key_id", "quotas", "exp"]
            for field in required_fields:
                if field not in payload:
                    return False, None, f"Missing required field: {field}"

            # Validate tier matches
            if payload["tier"] != tier:
                return False, None, f"Tier mismatch: token says {tier}, payload says {payload['tier']}"

            # Validate expiration
            exp_timestamp = payload["exp"]
            now = datetime.now(timezone.utc)
            exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            if exp_datetime < now:
                return False, None, f"Token expired on {exp_datetime.isoformat()}"

            return True, payload, ""

        except JWSError as e:
            logger.error(
                "jwt_license_generator.signature_error",
                error=str(e),
            )
            return False, None, f"Invalid signature: {str(e)}"
        except Exception as e:
            logger.error(
                "jwt_license_generator.validation_error",
                error=str(e),
            )
            return False, None, f"Validation failed: {str(e)}"

    def _get_tier_quotas(self, tier: str) -> Dict[str, Any]:
        """Get default quotas for tier."""
        quotas = {
            "free": {
                "commands_per_day": 10,
                "commands_per_month": 300,
                "max_projects": 1,
                "max_agents": 1,
                "max_concurrent_runs": 1,
                "features": ["basic_cli", "open_source_agents"],
            },
            "trial": {
                "commands_per_day": 50,
                "commands_per_month": 350,
                "max_projects": 3,
                "max_agents": 3,
                "max_concurrent_runs": 2,
                "features": ["basic_cli", "open_source_agents", "premium_agents"],
            },
            "pro": {
                "commands_per_day": 1000,
                "commands_per_month": 20000,
                "max_projects": 10,
                "max_agents": 10,
                "max_concurrent_runs": 5,
                "features": [
                    "basic_cli", "open_source_agents", "premium_agents",
                    "advanced_patterns", "priority_support", "custom_workflows",
                ],
            },
            "enterprise": {
                "commands_per_day": -1,  # Unlimited
                "commands_per_month": -1,
                "max_projects": -1,
                "max_agents": -1,
                "max_concurrent_runs": -1,
                "features": ["all"],
            },
        }
        return quotas.get(tier, quotas["free"])

    def _get_tier_features(self, tier: str) -> list:
        """Get enabled features for tier."""
        quotas = self._get_tier_quotas(tier)
        return quotas.get("features", [])

    def get_quota_from_payload(self, payload: Dict[str, Any], quota_name: str) -> int:
        """
        Get specific quota from decoded payload.

        Args:
            payload: Decoded JWT payload
            quota_name: Quota name (e.g., "commands_per_day")

        Returns:
            Quota value (-1 for unlimited)
        """
        quotas = payload.get("quotas", {})
        return quotas.get(quota_name, 0)

    def is_feature_enabled(self, payload: Dict[str, Any], feature: str) -> bool:
        """
        Check if feature is enabled in token.

        Args:
            payload: Decoded JWT payload
            feature: Feature name to check

        Returns:
            True if feature is enabled
        """
        features = payload.get("features", [])
        if "all" in features:
            return True
        return feature in features

    def get_days_remaining(self, payload: Dict[str, Any]) -> int:
        """
        Get days remaining until token expiration.

        Args:
            payload: Decoded JWT payload

        Returns:
            Days remaining (0 if expired)
        """
        exp_timestamp = payload.get("exp", 0)
        now = datetime.now(timezone.utc)
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)

        if exp_datetime < now:
            return 0

        delta = exp_datetime - now
        return delta.days


# Global instance
_jwt_generator: Optional[JWTLicenseGenerator] = None


def get_jwt_generator() -> JWTLicenseGenerator:
    """Get global JWT generator instance."""
    global _jwt_generator
    if _jwt_generator is None:
        _jwt_generator = JWTLicenseGenerator()
    return _jwt_generator


def generate_jwt_license(
    tier: str,
    email: str,
    days: Optional[int] = None,
    custom_quotas: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generate a new JWT license token.

    Args:
        tier: License tier
        email: User email
        days: Optional expiry in days
        custom_quotas: Optional custom quota overrides

    Returns:
        JWT license token
    """
    import uuid
    key_id = str(uuid.uuid4())[:8]
    return get_jwt_generator().generate_token(tier, key_id, email, days, custom_quotas)


def validate_jwt_license(token: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Validate a JWT license token.

    Args:
        token: JWT token to validate

    Returns:
        Tuple of (is_valid, decoded_payload, error_message)
    """
    return get_jwt_generator().validate_token(token)


def export_public_key() -> str:
    """
    Export public key for distribution.

    Returns:
        Public key as PEM string
    """
    generator = get_jwt_generator()
    generator._ensure_keys_exist()

    with open(PUBLIC_KEY_PATH, "rb") as f:
        return f.read().decode("utf-8")


__all__ = [
    "JWTLicenseGenerator",
    "get_jwt_generator",
    "generate_jwt_license",
    "validate_jwt_license",
    "export_public_key",
    "JWT_ALGORITHM",
    "JWT_EXPIRY_HOURS",
    "JWT_ISSUER",
    "JWT_AUDIENCE",
]

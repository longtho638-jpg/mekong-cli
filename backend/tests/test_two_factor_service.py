"""
Tests for Two-Factor Authentication Service

Comprehensive test coverage for:
- TOTP secret generation
- QR code URL generation
- TOTP code verification
- Backup codes generation and verification
- Enable/disable 2FA flows
"""

import pytest
from backend.services.two_factor_service import (
    TwoFactorService,
    get_two_factor_service,
    PYOTP_AVAILABLE,
)


class TestTwoFactorService:
    """Test suite for TwoFactorService"""

    def test_initialization(self):
        """Test service initialization with default values"""
        service = TwoFactorService()
        assert service.issuer_name == "Agency OS"
        assert service.backup_codes_count == 10
        assert service.totp_interval == 30
        assert service.totp_digits == 6

    def test_initialization_custom_values(self):
        """Test service initialization with custom values"""
        service = TwoFactorService(
            issuer_name="Custom App",
            backup_codes_count=8,
            totp_interval=60,
            totp_digits=8,
        )
        assert service.issuer_name == "Custom App"
        assert service.backup_codes_count == 8
        assert service.totp_interval == 60
        assert service.totp_digits == 8

    def test_generate_secret(self):
        """Test TOTP secret generation"""
        service = TwoFactorService()
        secret = service.generate_secret()

        # Should return a non-empty string
        assert isinstance(secret, str)
        assert len(secret) > 0

        # Should be base32-compatible characters (A-Z, 2-7)
        if not service.mock_mode:
            assert all(c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567" for c in secret)
            assert len(secret) == 32  # Standard base32 secret length

    def test_generate_multiple_secrets_are_unique(self):
        """Test that multiple secret generations produce unique values"""
        service = TwoFactorService()
        secrets = [service.generate_secret() for _ in range(5)]

        # All secrets should be unique
        assert len(secrets) == len(set(secrets))

    def test_get_provisioning_uri(self):
        """Test provisioning URI generation"""
        service = TwoFactorService(issuer_name="TestApp")
        secret = "JBSWY3DPEHPK3PXP"
        user = "user@example.com"

        uri = service.get_provisioning_uri(secret, user)

        # Should be a valid otpauth URI
        assert uri.startswith("otpauth://totp/")
        assert "TestApp" in uri
        assert user in uri
        assert secret in uri

    def test_get_provisioning_uri_with_custom_issuer(self):
        """Test provisioning URI with custom issuer override"""
        service = TwoFactorService(issuer_name="DefaultApp")
        secret = "JBSWY3DPEHPK3PXP"
        user = "user@example.com"

        uri = service.get_provisioning_uri(
            secret,
            user,
            issuer_name="CustomIssuer"
        )

        # Should use custom issuer
        assert "CustomIssuer" in uri
        assert "DefaultApp" not in uri

    def test_get_qr_code_url(self):
        """Test QR code URL generation"""
        service = TwoFactorService()
        secret = "JBSWY3DPEHPK3PXP"
        user = "user@example.com"

        qr_url = service.get_qr_code_url(secret, user)

        # Should be a data URL
        assert qr_url.startswith("data:image/png;base64,")
        assert len(qr_url) > 50  # Should be a substantial base64 string

    def test_verify_totp_mock_mode(self):
        """Test TOTP verification in mock mode"""
        service = TwoFactorService(mock_mode=True)
        secret = service.generate_secret()

        # Mock mode accepts "123456"
        assert service.verify_totp(secret, "123456") is True

        # Mock mode rejects other codes
        assert service.verify_totp(secret, "000000") is False

    def test_verify_totp_invalid_format(self):
        """Test TOTP verification with invalid code formats"""
        service = TwoFactorService()
        secret = service.generate_secret()

        # Too short
        assert service.verify_totp(secret, "123") is False

        # Too long
        assert service.verify_totp(secret, "1234567") is False

        # Non-numeric
        assert service.verify_totp(secret, "ABCDEF") is False

        # Empty
        assert service.verify_totp(secret, "") is False

        # None
        assert service.verify_totp(secret, None) is False

    def test_verify_totp_with_spaces(self):
        """Test TOTP verification handles spaces in code"""
        service = TwoFactorService(mock_mode=True)
        secret = service.generate_secret()

        # Should accept code with spaces (mock accepts 123456)
        assert service.verify_totp(secret, "123 456") is True
        assert service.verify_totp(secret, " 123456 ") is True

    @pytest.mark.skipif(not PYOTP_AVAILABLE, reason="pyotp not installed")
    def test_verify_totp_real_mode(self):
        """Test TOTP verification with real pyotp"""
        import pyotp

        service = TwoFactorService(mock_mode=False)
        secret = service.generate_secret()

        # Generate current valid code
        totp = pyotp.TOTP(secret)
        current_code = totp.now()

        # Should verify successfully
        assert service.verify_totp(secret, current_code) is True

        # Should reject invalid code
        assert service.verify_totp(secret, "000000") is False

    def test_generate_backup_codes_default_count(self):
        """Test backup codes generation with default count"""
        service = TwoFactorService(backup_codes_count=10)
        codes = service.generate_backup_codes()

        assert len(codes) == 10
        # All codes should be unique
        assert len(codes) == len(set(codes))

        # Check format: XXXX-XXXX
        for code in codes:
            assert len(code) == 9  # 4 + 1 + 4
            assert code[4] == "-"
            assert code[:4].isalnum()
            assert code[5:].isalnum()

    def test_generate_backup_codes_custom_count(self):
        """Test backup codes generation with custom count"""
        service = TwoFactorService()
        codes = service.generate_backup_codes(count=5)

        assert len(codes) == 5
        assert len(codes) == len(set(codes))

    def test_hash_backup_code(self):
        """Test backup code hashing"""
        service = TwoFactorService()
        code = "ABCD-EFGH"

        hashed = service.hash_backup_code(code)

        # Should be a 64-character hex string (SHA-256)
        assert isinstance(hashed, str)
        assert len(hashed) == 64
        assert all(c in "0123456789abcdef" for c in hashed)

    def test_hash_backup_code_consistency(self):
        """Test that same code produces same hash"""
        service = TwoFactorService()
        code = "ABCD-EFGH"

        hash1 = service.hash_backup_code(code)
        hash2 = service.hash_backup_code(code)

        assert hash1 == hash2

    def test_hash_backup_code_case_insensitive(self):
        """Test that backup code hashing is case-insensitive"""
        service = TwoFactorService()

        hash1 = service.hash_backup_code("ABCD-EFGH")
        hash2 = service.hash_backup_code("abcd-efgh")

        assert hash1 == hash2

    def test_hash_backup_code_ignores_hyphens(self):
        """Test that backup code hashing ignores hyphens"""
        service = TwoFactorService()

        hash1 = service.hash_backup_code("ABCD-EFGH")
        hash2 = service.hash_backup_code("ABCDEFGH")

        assert hash1 == hash2

    def test_verify_backup_code_success(self):
        """Test successful backup code verification"""
        service = TwoFactorService()
        codes = service.generate_backup_codes(count=3)
        hashes = [service.hash_backup_code(code) for code in codes]

        # Verify first code
        is_valid, matched_hash = service.verify_backup_code(codes[0], hashes)

        assert is_valid is True
        assert matched_hash is not None
        assert matched_hash in hashes
        assert matched_hash == service.hash_backup_code(codes[0])

    def test_verify_backup_code_failure(self):
        """Test failed backup code verification"""
        service = TwoFactorService()
        codes = service.generate_backup_codes(count=3)
        hashes = [service.hash_backup_code(code) for code in codes]

        # Try to verify invalid code
        is_valid, matched_hash = service.verify_backup_code("INVALID-CODE", hashes)

        assert is_valid is False
        assert matched_hash is None

    def test_verify_backup_code_empty_inputs(self):
        """Test backup code verification with empty inputs"""
        service = TwoFactorService()

        # Empty code
        is_valid, matched = service.verify_backup_code("", ["hash1", "hash2"])
        assert is_valid is False
        assert matched is None

        # Empty hashes
        is_valid, matched = service.verify_backup_code("ABCD-EFGH", [])
        assert is_valid is False
        assert matched is None

    def test_enable_2fa_for_user(self):
        """Test enabling 2FA for a user"""
        service = TwoFactorService()
        user_id = "test@example.com"

        result = service.enable_2fa_for_user(user_id)

        # Should return all required fields
        assert "secret" in result
        assert "qr_code_url" in result
        assert "provisioning_uri" in result
        assert "backup_codes" in result
        assert "backup_codes_hashed" in result

        # Secret should be valid
        assert isinstance(result["secret"], str)
        assert len(result["secret"]) > 0

        # QR code URL should be valid
        assert result["qr_code_url"].startswith("data:image/png;base64,")

        # Provisioning URI should contain user
        assert user_id in result["provisioning_uri"]

        # Backup codes should match expected count
        assert len(result["backup_codes"]) == service.backup_codes_count
        assert len(result["backup_codes_hashed"]) == service.backup_codes_count

        # Hashed codes should match plain codes
        for plain, hashed in zip(result["backup_codes"], result["backup_codes_hashed"]):
            assert service.hash_backup_code(plain) == hashed

    def test_enable_2fa_with_custom_secret(self):
        """Test enabling 2FA with a pre-generated secret"""
        service = TwoFactorService()
        custom_secret = "CUSTOMSECRET12345678"

        result = service.enable_2fa_for_user(
            "user@example.com",
            secret=custom_secret
        )

        assert result["secret"] == custom_secret

    def test_disable_2fa_for_user(self):
        """Test disabling 2FA for a user"""
        service = TwoFactorService()
        user_id = "test@example.com"

        result = service.disable_2fa_for_user(user_id)

        assert result is True

    def test_get_two_factor_service_singleton(self):
        """Test singleton service getter"""
        service1 = get_two_factor_service()
        service2 = get_two_factor_service()

        # Should return same instance
        assert service1 is service2

    def test_backup_codes_uniqueness(self):
        """Test that backup codes are unique within a set"""
        service = TwoFactorService()
        codes = service.generate_backup_codes(count=20)

        # All codes should be unique
        assert len(codes) == len(set(codes))

    def test_multiple_enable_2fa_produces_different_secrets(self):
        """Test that multiple 2FA enablements produce different secrets"""
        service = TwoFactorService()

        result1 = service.enable_2fa_for_user("user1@example.com")
        result2 = service.enable_2fa_for_user("user2@example.com")

        # Secrets should be different
        assert result1["secret"] != result2["secret"]

        # Backup codes should be different
        assert result1["backup_codes"] != result2["backup_codes"]


class TestIntegrationScenarios:
    """Integration tests for complete 2FA workflows"""

    def test_complete_2fa_setup_flow(self):
        """Test complete 2FA setup workflow"""
        service = TwoFactorService(mock_mode=True)
        user_id = "user@example.com"

        # 1. Enable 2FA
        setup_data = service.enable_2fa_for_user(user_id)

        # 2. User scans QR code (simulated)
        assert setup_data["qr_code_url"] is not None

        # 3. User enters TOTP code
        is_valid = service.verify_totp(setup_data["secret"], "123456")
        assert is_valid is True

        # 4. User saves backup codes (simulated)
        assert len(setup_data["backup_codes"]) > 0

    def test_backup_code_usage_flow(self):
        """Test backup code usage workflow"""
        service = TwoFactorService()

        # 1. Generate backup codes
        codes = service.generate_backup_codes(count=5)
        hashes = [service.hash_backup_code(code) for code in codes]

        # 2. User uses first backup code
        is_valid, used_hash = service.verify_backup_code(codes[0], hashes)
        assert is_valid is True

        # 3. Remove used code from database (simulated)
        remaining_hashes = [h for h in hashes if h != used_hash]
        assert len(remaining_hashes) == 4

        # 4. Try to use same code again (should fail)
        is_valid, _ = service.verify_backup_code(codes[0], remaining_hashes)
        assert is_valid is False

        # 5. Use another backup code
        is_valid, used_hash2 = service.verify_backup_code(codes[1], remaining_hashes)
        assert is_valid is True

    @pytest.mark.skipif(not PYOTP_AVAILABLE, reason="pyotp not installed")
    def test_real_totp_verification_flow(self):
        """Test real TOTP verification with pyotp"""
        import pyotp
        import time

        service = TwoFactorService(mock_mode=False)

        # 1. Generate secret
        secret = service.generate_secret()

        # 2. Create TOTP generator
        totp = pyotp.TOTP(secret)

        # 3. Get current code
        code = totp.now()

        # 4. Verify code
        assert service.verify_totp(secret, code) is True

        # 5. Wait for next time window (optional test - commented to avoid slow tests)
        # time.sleep(31)
        # old_code = code
        # new_code = totp.now()
        # assert old_code != new_code
        # assert service.verify_totp(secret, new_code) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

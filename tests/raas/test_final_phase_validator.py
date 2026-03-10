"""
Tests for Final Phase Validator and Completion Certificate.

Tests Phase 6: Terminal Validation - End-to-end RaaS integration validation.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone

from src.raas.final_phase_validator import (
    FinalPhaseValidator,
    ValidationResult,
    Phase6ValidationResult,
    get_validator,
    reset_validator,
)
from src.raas.completion_certificate import (
    CompletionCertificate,
    generate_certificate,
    load_certificate,
    save_certificate,
    get_certificate_path,
)
from src.core.raas_auth import AuthResult, TenantContext


class TestValidationResult:
    """Test ValidationResult dataclass."""

    def test_create_validation_result(self):
        """Test creating ValidationResult."""
        result = ValidationResult(
            name="Test Validation",
            passed=True,
            message="Test passed",
        )

        assert result.name == "Test Validation"
        assert result.passed is True
        assert result.message == "Test passed"
        assert result.details == {}
        assert result.errors == []

    def test_validation_result_with_details(self):
        """Test ValidationResult with details."""
        result = ValidationResult(
            name="Test",
            passed=False,
            message="Test failed",
            details={"key": "value"},
            errors=["Error 1", "Error 2"],
        )

        assert result.details == {"key": "value"}
        assert result.errors == ["Error 1", "Error 2"]


class TestPhase6ValidationResult:
    """Test Phase6ValidationResult dataclass."""

    def test_create_phase6_result(self):
        """Test creating Phase6ValidationResult."""
        result = Phase6ValidationResult(
            all_passed=True,
            project_id="test-project",
            license_key_hash="abc123",
            total_billed_usage=1000,
            attestation="attestation-hash",
            gateway_issuer="https://raas.example.com",
            validation_timestamp=datetime.now(timezone.utc).isoformat(),
        )

        assert result.all_passed is True
        assert result.project_id == "test-project"
        assert result.license_key_hash == "abc123"
        assert result.total_billed_usage == 1000
        assert result.attestation == "attestation-hash"
        assert result.gateway_issuer == "https://raas.example.com"
        assert result.validation_timestamp != ""


class TestFinalPhaseValidator:
    """Test FinalPhaseValidator class."""

    @pytest.fixture
    def validator(self):
        """Create validator instance."""
        return FinalPhaseValidator(gateway_url="https://raas.test.com")

    def test_init(self, validator):
        """Test validator initialization."""
        assert validator.gateway_url == "https://raas.test.com"
        assert validator._auth_client is None

    def test_get_project_id_from_env(self, validator, monkeypatch):
        """Test getting project ID from environment."""
        monkeypatch.setenv("MEKONG_PROJECT_ID", "test-project-123")
        assert validator._get_project_id() == "test-project-123"

    def test_get_project_id_fallback(self, validator, monkeypatch):
        """Test project ID fallback when env not set."""
        monkeypatch.delenv("MEKONG_PROJECT_ID", raising=False)
        project_id = validator._get_project_id()
        assert isinstance(project_id, str)
        assert len(project_id) == 16

    def test_hash_license_key(self, validator):
        """Test license key hashing."""
        hash1 = validator._hash_license_key("test-key-123")
        hash2 = validator._hash_license_key("test-key-123")
        hash3 = validator._hash_license_key("different-key")

        assert hash1 == hash2
        assert hash1 != hash3
        assert len(hash1) == 16

    def test_hash_license_key_empty(self, validator):
        """Test hashing empty license key."""
        assert validator._hash_license_key("") == "none"
        assert validator._hash_license_key(None) == "none"

    @pytest.mark.asyncio
    async def test_validate_license_auth_no_key(self, validator, monkeypatch):
        """Test license validation with no key."""
        monkeypatch.delenv("RAAS_LICENSE_KEY", raising=False)

        with patch.object(validator, '_get_license_key', return_value=None):
            result = await validator.validate_license_authentication()

            assert result.passed is False
            assert "No license key found" in result.message

    @pytest.mark.asyncio
    async def test_validate_license_auth_success(self, validator):
        """Test successful license authentication."""
        with patch.object(validator, '_get_license_key', return_value="mk_test_key"):
            with patch.object(validator, '_get_auth_client') as mock_client:
                mock_auth_client = Mock()
                mock_auth_client.validate_credentials.return_value = AuthResult(
                    valid=True,
                    tenant=TenantContext(
                        tenant_id="test-tenant",
                        tier="pro",
                        role="pro",
                        license_key="mk_test_key",
                        features=["feature1", "feature2"],
                    ),
                )
                mock_client.return_value = mock_auth_client

                result = await validator.validate_license_authentication()

                assert result.passed is True
                assert result.details.get("tenant_id") == "test-tenant"
                assert result.details.get("tier") == "pro"

    @pytest.mark.asyncio
    async def test_validate_usage_reporting_success(self, validator):
        """Test usage reporting validation."""
        with patch.object(validator, '_get_license_key', return_value=None):
            result = await validator.validate_usage_reporting()

            # Should pass if usage meter module is available
            assert result.details.get("usage_meter_loaded") is True

    @pytest.mark.asyncio
    async def test_validate_billing_sync_success(self, validator):
        """Test billing sync validation."""
        with patch.object(validator, '_get_license_key', return_value=None):
            result = await validator.validate_billing_sync()

            # Check billing middleware availability
            assert "billing_middleware_loaded" in result.details

    @pytest.mark.asyncio
    async def test_validate_gateway_attestation_no_key(self, validator, monkeypatch):
        """Test gateway attestation with no key."""
        monkeypatch.delenv("RAAS_LICENSE_KEY", raising=False)

        with patch.object(validator, '_get_license_key', return_value=None):
            result = await validator.validate_gateway_attestation()

            assert result.passed is False
            assert "No license key" in result.message

    @pytest.mark.asyncio
    async def test_validate_all(self, validator):
        """Test running all validations."""
        with patch.object(validator, '_get_license_key', return_value=None):
            with patch.object(validator, '_get_auth_client') as mock_client:
                mock_auth_client = Mock()
                mock_auth_client.validate_credentials.return_value = AuthResult(
                    valid=False,
                    error="No license",
                )
                mock_client.return_value = mock_auth_client

                result = await validator.validate_all()

                # Should have 4 validation results
                assert len(result.results) == 4
                # License auth should fail
                assert result.results[0].passed is False


class TestCompletionCertificate:
    """Test CompletionCertificate class."""

    @pytest.fixture
    def sample_validation_result(self):
        """Create sample validation result."""
        return Phase6ValidationResult(
            all_passed=True,
            project_id="test-project",
            license_key_hash="abc123hash",
            total_billed_usage=5000,
            attestation="attestation-hash",
            gateway_issuer="https://raas.test.com",
            validation_timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def test_create_certificate(self, sample_validation_result):
        """Test creating completion certificate."""
        cert = generate_certificate(sample_validation_result)

        assert cert.project_id == "test-project"
        assert cert.license_key_hash == "abc123hash"
        assert cert.total_billed_usage_units == 5000
        assert cert.gateway_issuer == "https://raas.test.com"
        assert cert.all_phases_operational is True
        assert cert.certificate_id.startswith("CERT-")

    def test_certificate_signature(self, sample_validation_result):
        """Test certificate signature generation."""
        cert = generate_certificate(sample_validation_result)

        assert cert.signature != ""
        assert len(cert.signature) == 64  # SHA-256 hex

    def test_certificate_signature_verification(self, sample_validation_result):
        """Test certificate signature verification."""
        cert = generate_certificate(sample_validation_result)

        assert cert.verify_signature() is True

    def test_certificate_to_dict(self, sample_validation_result):
        """Test certificate to dictionary."""
        cert = generate_certificate(sample_validation_result)
        data = cert.to_dict()

        assert data["project_id"] == "test-project"
        assert data["license_key_hash"] == "abc123hash"
        assert data["total_billed_usage_units"] == 5000
        assert "certificate_id" in data

    def test_certificate_to_json(self, sample_validation_result):
        """Test certificate to JSON."""
        cert = generate_certificate(sample_validation_result)
        json_str = cert.to_json()

        assert "test-project" in json_str
        assert "abc123hash" in json_str

    def test_certificate_export(self, sample_validation_result, tmp_path):
        """Test certificate export to file."""
        cert = generate_certificate(sample_validation_result)
        output_path = tmp_path / "certificate.json"

        result = cert.export(str(output_path))

        assert result is True
        assert output_path.exists()

        # Verify can load back
        loaded = load_certificate(str(output_path))
        assert loaded is not None
        assert loaded.project_id == "test-project"

    def test_certificate_from_dict(self, sample_validation_result):
        """Test certificate from dictionary."""
        cert1 = generate_certificate(sample_validation_result)
        data = cert1.to_dict()
        cert2 = CompletionCertificate.from_dict(data)

        assert cert2.project_id == cert1.project_id
        assert cert2.license_key_hash == cert1.license_key_hash
        assert cert2.signature == cert1.signature


class TestCertificateGeneration:
    """Test certificate generation with different scenarios."""

    def test_generate_with_all_phases(self):
        """Test certificate generation with all phases operational."""
        validation_result = Phase6ValidationResult(
            all_passed=True,
            project_id="proj-123",
            license_key_hash="hash-abc",
            total_billed_usage=10000,
            attestation="attest-xyz",
            gateway_issuer="https://raas.example.com",
        )

        phases_status = {
            "Phase 1": True,
            "Phase 2": True,
            "Phase 3": True,
            "Phase 4": True,
            "Phase 5": True,
            "Phase 6": True,
        }

        cert = generate_certificate(validation_result, phases_status=phases_status)

        assert cert.all_phases_operational is True
        assert len(cert.phases_completed) == 6
        assert all(cert.phases_completed.values())

    def test_generate_with_missing_phases(self):
        """Test certificate generation with incomplete phases."""
        validation_result = Phase6ValidationResult(
            all_passed=True,
            project_id="proj-123",
            license_key_hash="hash-abc",
            total_billed_usage=0,
            attestation="attest-xyz",
            gateway_issuer="https://raas.example.com",
        )

        phases_status = {
            "Phase 1": True,
            "Phase 2": False,
            "Phase 3": True,
            "Phase 4": True,
            "Phase 5": True,
            "Phase 6": True,
        }

        cert = generate_certificate(validation_result, phases_status=phases_status)

        assert cert.all_phases_operational is False
        assert cert.phases_completed["Phase 2"] is False


class TestSingleton:
    """Test singleton pattern for validators."""

    def test_get_validator_singleton(self):
        """Test validator singleton."""
        v1 = get_validator()
        v2 = get_validator()

        assert v1 is v2

    def test_get_validator_with_custom_url(self):
        """Test validator with custom URL."""
        reset_validator()
        v1 = get_validator(gateway_url="https://custom.example.com")
        v2 = get_validator()

        assert v1.gateway_url == "https://custom.example.com"
        assert v2.gateway_url == "https://custom.example.com"

    def test_reset_validator(self):
        """Test resetting validator singleton."""
        v1 = get_validator()
        reset_validator()
        v2 = get_validator()

        assert v1 is not v2


class TestCertificatePath:
    """Test certificate path management."""

    def test_get_certificate_path(self):
        """Test default certificate path."""
        path = get_certificate_path()
        assert path.endswith(".mekong/raas/completion-certificate.json")

    def test_save_certificate(self, tmp_path):
        """Test saving certificate to custom path."""
        validation_result = Phase6ValidationResult(
            all_passed=True,
            project_id="test",
            license_key_hash="hash",
            total_billed_usage=0,
        )
        cert = generate_certificate(validation_result)

        custom_path = tmp_path / "my-cert.json"
        result = save_certificate(cert, str(custom_path))

        assert result is True
        assert custom_path.exists()


__all__ = [
    "TestValidationResult",
    "TestPhase6ValidationResult",
    "TestFinalPhaseValidator",
    "TestCompletionCertificate",
    "TestCertificateGeneration",
    "TestSingleton",
    "TestCertificatePath",
]

"""
License Management API Endpoints

Provides REST API for license generation, validation, activation and management.
Connects to LicenseService for database persistence.
"""

from datetime import datetime
from typing import Optional, Dict

from fastapi import APIRouter, HTTPException, Header, Depends, status
from pydantic import BaseModel, Field

from backend.core.licensing import (
    License,
    LicensePlan,
    LicenseStatus,
)
from backend.api.services.license_service import LicenseService

router = APIRouter(prefix="/api/licenses", tags=["licenses"])


# --- Request/Response Models ---

class GenerateLicenseRequest(BaseModel):
    """Request to generate a new license"""

    tenant_id: str = Field(..., description="Unique tenant identifier")
    plan: LicensePlan = Field(LicensePlan.SOLO, description="License plan tier")
    duration_days: int = Field(365, ge=1, le=3650, description="License duration")
    bound_domain: Optional[str] = Field(None, description="Bind to specific domain")
    hardware_fingerprint: Optional[str] = Field(
        None, description="Bind to specific hardware"
    )
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")


class ValidateLicenseRequest(BaseModel):
    """Request to validate a license"""

    license_key: str = Field(..., description="License key to validate")
    domain: Optional[str] = Field(None, description="Current domain")
    hardware_fingerprint: Optional[str] = Field(None, description="Current hardware ID")


class ActivateLicenseRequest(BaseModel):
    """Request to activate a license seat"""
    license_key: str = Field(..., description="License key to activate")
    fingerprint: str = Field(..., description="Unique fingerprint of the device/instance")
    hostname: Optional[str] = Field(None, description="Hostname of the device")
    ip_address: Optional[str] = Field(None, description="IP address of the device")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional metadata")


class DeactivateLicenseRequest(BaseModel):
    """Request to deactivate a license seat"""
    license_key: str = Field(..., description="License key")
    fingerprint: str = Field(..., description="Unique fingerprint to deactivate")


class LicenseResponse(BaseModel):
    """License response"""

    license_key: str
    tenant_id: str
    plan: str
    status: str
    issued_at: datetime
    expires_at: datetime
    days_remaining: int
    is_expired: bool
    features: list[str]
    max_activations: int
    bound_domain: Optional[str]
    hardware_fingerprint: Optional[str]


class ValidationResponse(BaseModel):
    """Validation response"""

    valid: bool
    reason: str
    license: Optional[LicenseResponse] = None


class ActivationResponse(BaseModel):
    """Activation response"""
    success: bool
    message: str


# --- Dependencies ---

def get_license_service() -> LicenseService:
    """Dependency to get license service instance"""
    return LicenseService()


async def verify_admin_token(authorization: str = Header(None)):
    """Verify admin authorization"""
    # TODO: Implement real JWT or API key verification
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")

    token = authorization.replace("Bearer ", "")

    # Placeholder validation - replace with real implementation
    # In a real app, check against env var or DB
    if token != "admin_secret_key_replace_me":
         # Allow "dev-secret-key" for development if configured
         if token == "dev-secret-key-CHANGE-IN-PRODUCTION":
             return True
         raise HTTPException(status_code=403, detail="Invalid admin credentials")

    return True


# --- Endpoints ---

@router.post("/generate", response_model=LicenseResponse)
async def generate_license(
    request: GenerateLicenseRequest,
    _admin: bool = Depends(verify_admin_token),
    service: LicenseService = Depends(get_license_service)
):
    """
    Generate a new license key (Admin only).
    """
    try:
        license_obj = service.create_license(
            tenant_id=request.tenant_id,
            plan=request.plan,
            duration_days=request.duration_days,
            bound_domain=request.bound_domain,
            hardware_fingerprint=request.hardware_fingerprint,
            metadata=request.metadata
        )

        # Calculate days remaining
        days_remaining = (license_obj.expires_at - datetime.utcnow()).days
        is_expired = days_remaining < 0

        return LicenseResponse(
            license_key=license_obj.license_key,
            tenant_id=license_obj.tenant_id,
            plan=license_obj.plan.value,
            status=license_obj.status.value,
            issued_at=license_obj.issued_at,
            expires_at=license_obj.expires_at,
            days_remaining=max(0, days_remaining),
            is_expired=is_expired,
            features=license_obj.features,
            max_activations=license_obj.max_activations,
            bound_domain=license_obj.bound_domain,
            hardware_fingerprint=license_obj.hardware_fingerprint
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"License generation failed: {str(e)}")


@router.post("/validate", response_model=ValidationResponse)
async def validate_license(
    request: ValidateLicenseRequest,
    service: LicenseService = Depends(get_license_service)
):
    """
    Validate a license key against database and constraints.
    """
    try:
        result = service.validate_license(
            license_key=request.license_key,
            domain=request.domain,
            hardware_fingerprint=request.hardware_fingerprint,
        )

        response = ValidationResponse(
            valid=result.valid,
            reason=result.reason,
        )

        if result.license:
            days_remaining = (result.license.expires_at - datetime.utcnow()).days
            is_expired = days_remaining < 0

            response.license = LicenseResponse(
                license_key=result.license.license_key,
                tenant_id=result.license.tenant_id,
                plan=result.license.plan.value,
                status=result.license.status.value,
                issued_at=result.license.issued_at,
                expires_at=result.license.expires_at,
                days_remaining=max(0, days_remaining),
                is_expired=is_expired,
                features=result.license.features,
                max_activations=result.license.max_activations,
                bound_domain=result.license.bound_domain,
                hardware_fingerprint=result.license.hardware_fingerprint
            )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/info/{license_key}", response_model=LicenseResponse)
async def get_license_info(
    license_key: str,
    service: LicenseService = Depends(get_license_service)
):
    """
    Get public license information.
    """
    try:
        # First check locally for format
        if not service.validator.validate(license_key).valid:
            raise HTTPException(status_code=400, detail="Invalid license key format")

        license_obj = service.get_license_by_key(license_key)
        if not license_obj:
            raise HTTPException(status_code=404, detail="License not found")

        days_remaining = (license_obj.expires_at - datetime.utcnow()).days
        is_expired = days_remaining < 0

        return LicenseResponse(
            license_key=license_obj.license_key,
            tenant_id=license_obj.tenant_id,
            plan=license_obj.plan.value,
            status=license_obj.status.value,
            issued_at=license_obj.issued_at,
            expires_at=license_obj.expires_at,
            days_remaining=max(0, days_remaining),
            is_expired=is_expired,
            features=license_obj.features,
            max_activations=license_obj.max_activations,
            bound_domain=license_obj.bound_domain,
            hardware_fingerprint=license_obj.hardware_fingerprint
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get license info: {str(e)}")


@router.post("/activate", response_model=ActivationResponse)
async def activate_license_seat(
    request: ActivateLicenseRequest,
    service: LicenseService = Depends(get_license_service)
):
    """
    Activate a license seat (register a device/instance).
    """
    success, message = service.activate_license(
        license_key=request.license_key,
        fingerprint=request.fingerprint,
        hostname=request.hostname,
        ip_address=request.ip_address,
        metadata=request.metadata
    )

    if not success:
        # Return 409 Conflict if limit reached, or 400/404 based on message
        # For simplicity, returning 400 for logic errors
        if "limit reached" in message:
            raise HTTPException(status_code=409, detail=message)
        if "not found" in message:
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=400, detail=message)

    return ActivationResponse(success=True, message=message)


@router.post("/deactivate", response_model=ActivationResponse)
async def deactivate_license_seat(
    request: DeactivateLicenseRequest,
    service: LicenseService = Depends(get_license_service)
):
    """
    Deactivate a license seat.
    """
    success = service.deactivate_license(
        license_key=request.license_key,
        fingerprint=request.fingerprint
    )

    if not success:
         raise HTTPException(status_code=400, detail="Deactivation failed (license not found or fingerprint mismatch)")

    return ActivationResponse(success=True, message="Deactivated successfully")


@router.post("/renew/{license_key}", response_model=LicenseResponse)
async def renew_license(
    license_key: str,
    _admin: bool = Depends(verify_admin_token),
    service: LicenseService = Depends(get_license_service)
):
    """
    Renew an existing license (extend expiration by 365 days).
    """
    # This logic needs to be implemented in Service properly
    # Currently Service doesn't have renew_license method that saves to DB
    # Let's add basic implementation or keep placeholder
    raise HTTPException(status_code=501, detail="Renew endpoint pending implementation in service layer")

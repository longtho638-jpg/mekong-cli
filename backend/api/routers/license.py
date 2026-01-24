"""
License Verification API Router

Provides endpoints for license key validation, feature checks, and activation.
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Ensure core is reachable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import license validation logic
from antigravity.core.licensing.validation import validate_license_key, get_tier_from_key
from core.licensing.logic.engine import LicenseGenerator

router = APIRouter(prefix="/api/license", tags=["License Management"])

# Feature definitions per tier
TIER_FEATURES: Dict[str, List[str]] = {
    "free": [
        "template_generation",
        "basic_support",
    ],
    "starter": [
        "template_generation",
        "basic_support",
        "email_support",
    ],
    "pro": [
        "template_generation",
        "ai_generation",
        "basic_support",
        "email_support",
        "priority_support",
    ],
    "franchise": [
        "template_generation",
        "ai_generation",
        "export_pdf",
        "basic_support",
        "email_support",
        "priority_support",
        "multi_user",
    ],
    "enterprise": [
        "template_generation",
        "ai_generation",
        "export_pdf",
        "custom_branding",
        "basic_support",
        "email_support",
        "priority_support",
        "multi_user",
        "dedicated_support",
        "sla_guarantee",
    ],
}

# Feature descriptions
FEATURE_DESCRIPTIONS: Dict[str, str] = {
    "template_generation": "Generate business plans from templates",
    "ai_generation": "AI-powered business plan generation",
    "export_pdf": "Export business plans to PDF format",
    "custom_branding": "Custom branding and white-labeling",
    "basic_support": "Community support via forums",
    "email_support": "Email support",
    "priority_support": "Priority email and chat support",
    "multi_user": "Multi-user collaboration",
    "dedicated_support": "Dedicated account manager",
    "sla_guarantee": "Service Level Agreement guarantee",
}


# Request/Response Models
class LicenseVerifyRequest(BaseModel):
    """Request model for license verification."""
    license_key: Optional[str] = Field(None, description="License key to verify (None for free tier)")


class LicenseVerifyResponse(BaseModel):
    """Response model for license verification."""
    valid: bool = Field(..., description="Whether the license is valid")
    tier: str = Field(..., description="License tier (free, starter, pro, franchise, enterprise)")
    message: str = Field(..., description="Human-readable validation message")
    features: List[str] = Field(..., description="List of available features for this tier")


class FeatureInfo(BaseModel):
    """Feature information model."""
    name: str = Field(..., description="Feature identifier")
    description: str = Field(..., description="Feature description")


class TierFeaturesResponse(BaseModel):
    """Response model for tier features."""
    tier: str = Field(..., description="License tier")
    features: List[FeatureInfo] = Field(..., description="List of features available for this tier")


class LicenseActivateRequest(BaseModel):
    """Request model for license activation."""
    license_key: str = Field(..., description="License key to activate")
    email: Optional[str] = Field(None, description="User email (optional)")
    product_id: Optional[str] = Field(None, description="Product ID (optional)")


class LicenseActivateResponse(BaseModel):
    """Response model for license activation."""
    success: bool = Field(..., description="Whether activation was successful")
    tier: str = Field(..., description="Activated license tier")
    activated_at: str = Field(..., description="Activation timestamp (ISO format)")
    message: str = Field(..., description="Activation message")


# Endpoints

@router.post("/verify", response_model=LicenseVerifyResponse)
async def verify_license(request: LicenseVerifyRequest):
    """
    Verify a license key and return tier and features.

    Args:
        request: License verification request with optional license key

    Returns:
        License verification response with tier and features
    """
    # Validate the license key
    is_valid, tier, message = validate_license_key(request.license_key)

    # Get features for the tier
    features = TIER_FEATURES.get(tier, [])

    return LicenseVerifyResponse(
        valid=is_valid,
        tier=tier,
        message=message,
        features=features
    )


@router.get("/features/{tier}", response_model=TierFeaturesResponse)
async def get_tier_features(tier: str):
    """
    Get available features for a specific license tier.

    Args:
        tier: License tier (free, starter, pro, franchise, enterprise)

    Returns:
        List of features available for the tier

    Raises:
        HTTPException: If tier is invalid
    """
    tier_lower = tier.lower()

    # Validate tier
    if tier_lower not in TIER_FEATURES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tier: {tier}. Valid tiers are: {', '.join(TIER_FEATURES.keys())}"
        )

    # Get features for the tier
    feature_list = TIER_FEATURES[tier_lower]

    # Build feature info list
    features = [
        FeatureInfo(
            name=feature,
            description=FEATURE_DESCRIPTIONS.get(feature, f"Feature: {feature}")
        )
        for feature in feature_list
    ]

    return TierFeaturesResponse(
        tier=tier_lower,
        features=features
    )


@router.post("/activate", response_model=LicenseActivateResponse)
async def activate_license(request: LicenseActivateRequest):
    """
    Activate a license key (record first use).

    Args:
        request: License activation request with key and optional metadata

    Returns:
        Activation confirmation with tier and timestamp

    Raises:
        HTTPException: If license key is invalid
    """
    # Validate the license key
    is_valid, tier, message = validate_license_key(request.license_key)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid license key: {message}"
        )

    # Record activation timestamp
    activated_at = datetime.utcnow().isoformat() + "Z"

    # In a production system, you would:
    # 1. Store activation in database
    # 2. Link to user account
    # 3. Send confirmation email
    # 4. Track activation analytics

    return LicenseActivateResponse(
        success=True,
        tier=tier,
        activated_at=activated_at,
        message=f"License activated successfully for {tier.upper()} tier"
    )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the license service.

    Returns:
        Service status information
    """
    return {
        "status": "operational",
        "service": "license-verification",
        "tiers_available": list(TIER_FEATURES.keys()),
        "features_count": len(FEATURE_DESCRIPTIONS),
    }

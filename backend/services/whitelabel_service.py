"""
White-Label Configuration Service

Manages brand customization for organizations including:
- Logo URLs
- Primary brand colors
- Company names
- Enterprise tier validation

Only enterprise tier organizations can use white-label features.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional


class LicenseTier(str, Enum):
    """License tier definitions"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"


class BrandConfig:
    """Represents brand configuration for an organization"""

    def __init__(
        self,
        org_id: str,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
        company_name: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.org_id = org_id
        self.logo_url = logo_url
        self.primary_color = primary_color
        self.company_name = company_name
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "org_id": self.org_id,
            "logo_url": self.logo_url,
            "primary_color": self.primary_color,
            "company_name": self.company_name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class WhiteLabelService:
    """Service for managing white-label brand configurations"""

    def __init__(self):
        # In-memory storage (replace with database in production)
        self._brand_configs: Dict[str, BrandConfig] = {}
        # Store organization tier mappings (in production, query from org service)
        self._org_tiers: Dict[str, LicenseTier] = {}

    def _validate_enterprise_tier(self, org_id: str) -> bool:
        """
        Validate that organization has enterprise tier license

        Args:
            org_id: Organization ID

        Returns:
            True if organization has enterprise tier

        Raises:
            ValueError: If organization not found or tier is not enterprise
        """
        tier = self._org_tiers.get(org_id)
        if not tier:
            raise ValueError(f"Organization not found: {org_id}")

        if tier != LicenseTier.ENTERPRISE:
            raise ValueError(
                f"White-label features require enterprise tier. "
                f"Current tier: {tier.value}"
            )

        return True

    def _validate_color(self, color: str) -> bool:
        """
        Validate hex color format

        Args:
            color: Hex color string (e.g., #FF5733)

        Returns:
            True if valid

        Raises:
            ValueError: If color format is invalid
        """
        if not color:
            return True

        # Allow both #RGB and #RRGGBB formats
        if not color.startswith("#"):
            raise ValueError("Color must start with #")

        hex_part = color[1:]
        if len(hex_part) not in [3, 6]:
            raise ValueError("Color must be in #RGB or #RRGGBB format")

        try:
            int(hex_part, 16)
        except ValueError:
            raise ValueError("Color must contain valid hexadecimal characters")

        return True

    def _validate_url(self, url: str) -> bool:
        """
        Validate URL format

        Args:
            url: URL string

        Returns:
            True if valid

        Raises:
            ValueError: If URL format is invalid
        """
        if not url:
            return True

        if not url.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")

        return True

    def set_org_tier(self, org_id: str, tier: str) -> None:
        """
        Set organization tier (for testing/provisioning)

        Args:
            org_id: Organization ID
            tier: License tier (free, starter, pro, franchise, enterprise)

        Raises:
            ValueError: If tier is invalid
        """
        try:
            tier_enum = LicenseTier(tier.lower())
            self._org_tiers[org_id] = tier_enum
        except ValueError:
            raise ValueError(
                f"Invalid license tier: {tier}. "
                f"Must be one of: {', '.join([t.value for t in LicenseTier])}"
            )

    def create_or_update_brand_config(
        self,
        org_id: str,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
        company_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create or update brand configuration for an organization

        Args:
            org_id: Organization ID
            logo_url: URL to logo image
            primary_color: Primary brand color (hex format, e.g., #FF5733)
            company_name: Company name for branding

        Returns:
            Dict with brand config and success status

        Raises:
            ValueError: If validation fails or tier is not enterprise
        """
        # Validate enterprise tier
        self._validate_enterprise_tier(org_id)

        # Validate inputs
        if logo_url:
            self._validate_url(logo_url)

        if primary_color:
            self._validate_color(primary_color)

        # Get existing config or create new
        existing = self._brand_configs.get(org_id)

        if existing:
            # Update existing config
            if logo_url is not None:
                existing.logo_url = logo_url
            if primary_color is not None:
                existing.primary_color = primary_color
            if company_name is not None:
                existing.company_name = company_name
            existing.updated_at = datetime.now()
            config = existing
            action = "updated"
        else:
            # Create new config
            config = BrandConfig(
                org_id=org_id,
                logo_url=logo_url,
                primary_color=primary_color,
                company_name=company_name,
            )
            self._brand_configs[org_id] = config
            action = "created"

        return {
            "success": True,
            "brand_config": config.to_dict(),
            "message": f"Brand configuration {action} successfully",
        }

    def get_brand_config(self, org_id: str) -> Dict[str, Any]:
        """
        Get brand configuration for an organization

        Args:
            org_id: Organization ID

        Returns:
            Dict with brand config or None if not found

        Raises:
            ValueError: If organization tier is not enterprise
        """
        # Validate enterprise tier
        self._validate_enterprise_tier(org_id)

        config = self._brand_configs.get(org_id)

        if not config:
            return {
                "success": True,
                "brand_config": None,
                "message": "No brand configuration found for this organization",
            }

        return {
            "success": True,
            "brand_config": config.to_dict(),
        }

    def delete_brand_config(self, org_id: str) -> Dict[str, Any]:
        """
        Delete brand configuration for an organization

        Args:
            org_id: Organization ID

        Returns:
            Dict with deletion status

        Raises:
            ValueError: If organization tier is not enterprise or config not found
        """
        # Validate enterprise tier
        self._validate_enterprise_tier(org_id)

        config = self._brand_configs.get(org_id)

        if not config:
            raise ValueError(f"No brand configuration found for organization: {org_id}")

        del self._brand_configs[org_id]

        return {
            "success": True,
            "message": f"Brand configuration deleted for organization {org_id}",
        }

    def list_all_configs(self) -> Dict[str, Any]:
        """
        List all brand configurations (admin only)

        Returns:
            Dict with all brand configs
        """
        configs = [config.to_dict() for config in self._brand_configs.values()]

        return {
            "success": True,
            "count": len(configs),
            "brand_configs": configs,
        }


# Global service instance
whitelabel_service = WhiteLabelService()

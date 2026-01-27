"""
License Service - Database operations for license management.

Handles persistence, retrieval, and activation tracking using Supabase.
"""
import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Tuple

from supabase import Client, create_client
from backend.core.licensing.models import License, LicenseStatus, LicensePlan
from backend.core.licensing.generator import LicenseGenerator
from backend.core.licensing.validator import LicenseValidator, ValidationResult

logger = logging.getLogger(__name__)

class LicenseService:
    """Service for managing licenses in Supabase."""

    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            # Fallback for dev/test if env vars not set, though ideally should raise
            logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. LicenseService may fail.")
            self.client = None
        else:
            self.client: Client = create_client(supabase_url, supabase_key)

        self.generator = LicenseGenerator()
        self.validator = LicenseValidator()

    def create_license(
        self,
        tenant_id: str,
        plan: LicensePlan = LicensePlan.SOLO,
        duration_days: int = 365,
        bound_domain: Optional[str] = None,
        hardware_fingerprint: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> License:
        """
        Generate and save a new license.
        """
        # Generate license object (in-memory)
        license_obj = self.generator.generate(
            tenant_id=tenant_id,
            plan=plan,
            duration_days=duration_days,
            bound_domain=bound_domain,
            hardware_fingerprint=hardware_fingerprint
        )

        if metadata:
            license_obj.metadata = metadata

        if not self.client:
            logger.warning("Supabase client not initialized. Returning ephemeral license.")
            return license_obj

        # Persist to DB
        try:
            data = license_obj.model_dump(mode="json")
            # Remove computed fields or fields not in DB if necessary
            # For now assuming DB columns match model fields roughly
            # adjustments: `status` enum, `plan` enum are strings in JSON

            # Insert
            result = self.client.table("licenses").insert(data).execute()
            if result.data:
                return license_obj
            else:
                raise Exception("Failed to insert license into database")
        except Exception as e:
            logger.error(f"Error creating license in DB: {e}")
            raise

    def get_license_by_key(self, license_key: str) -> Optional[License]:
        """
        Fetch license details from DB.
        """
        if not self.client:
            return None

        try:
            result = self.client.table("licenses").select("*").eq("license_key", license_key).execute()
            if result.data and len(result.data) > 0:
                return License(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching license {license_key}: {e}")
            return None

    def validate_license(
        self,
        license_key: str,
        domain: Optional[str] = None,
        hardware_fingerprint: Optional[str] = None
    ) -> ValidationResult:
        """
        Full validation pipeline:
        1. Format/Checksum check (Validator)
        2. DB Existence & Status check
        3. Hardware/Domain binding check
        4. Expiry check
        """
        # 1. Basic format/checksum validation (no DB needed)
        basic_result = self.validator.validate(license_key)
        if not basic_result.valid:
            return basic_result

        # 2. Fetch from DB
        license_obj = self.get_license_by_key(license_key)
        if not license_obj:
            return ValidationResult(False, "License not found in database")

        # 3. Full validation with DB object
        full_result = self.validator.validate(
            license_key,
            domain=domain,
            hardware_fingerprint=hardware_fingerprint,
            license_data=license_obj
        )

        return full_result

    def activate_license(
        self,
        license_key: str,
        fingerprint: str,
        hostname: Optional[str] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> Tuple[bool, str]:
        """
        Register an activation (seat) for a license.
        Checks against max_activations.
        """
        if not self.client:
            return False, "Database unavailable"

        # Fetch license
        license_obj = self.get_license_by_key(license_key)
        if not license_obj:
            return False, "License not found"

        # Check if already activated for this fingerprint
        try:
            # We need the license ID (UUID) for the activations table
            # Fetch raw data again to get ID, or assume we can query by license_key join?
            # Ideally License model should have ID, but the Pydantic model might not if it was generated fresh.
            # Let's fetch ID.
            lic_res = self.client.table("licenses").select("id").eq("license_key", license_key).execute()
            if not lic_res.data:
                return False, "License ID lookup failed"
            license_id = lic_res.data[0]['id']

            # Check existing activation
            existing = self.client.table("license_activations")\
                .select("*")\
                .eq("license_id", license_id)\
                .eq("fingerprint", fingerprint)\
                .execute()

            if existing.data:
                # Already activated, update check-in
                self.client.table("license_activations").update({
                    "last_check_in": datetime.utcnow().isoformat(),
                    "ip_address": ip_address,
                    "hostname": hostname
                }).eq("id", existing.data[0]['id']).execute()
                return True, "Activation refreshed"

            # Check limit
            # Enterprise unlimited logic handled by max_activations number (e.g. 9999)

            current_count_res = self.client.table("license_activations")\
                .select("id", count="exact")\
                .eq("license_id", license_id)\
                .execute()

            current_count = current_count_res.count or 0

            if current_count >= license_obj.max_activations:
                return False, f"Activation limit reached ({current_count}/{license_obj.max_activations})"

            # Create new activation
            self.client.table("license_activations").insert({
                "license_id": license_id,
                "fingerprint": fingerprint,
                "hostname": hostname,
                "ip_address": ip_address,
                "metadata": metadata or {}
            }).execute()

            return True, "Activated successfully"

        except Exception as e:
            logger.error(f"Activation error: {e}")
            return False, f"System error: {str(e)}"

    def deactivate_license(self, license_key: str, fingerprint: str) -> bool:
        """
        Remove an activation.
        """
        if not self.client:
            return False

        try:
            lic_res = self.client.table("licenses").select("id").eq("license_key", license_key).execute()
            if not lic_res.data:
                return False
            license_id = lic_res.data[0]['id']

            self.client.table("license_activations")\
                .delete()\
                .eq("license_id", license_id)\
                .eq("fingerprint", fingerprint)\
                .execute()
            return True
        except Exception as e:
            logger.error(f"Deactivation error: {e}")
            return False

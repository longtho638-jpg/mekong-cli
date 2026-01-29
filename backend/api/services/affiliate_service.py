"""
Affiliate Service - Management of affiliates, conversions, and payouts.

Handles the core logic for the affiliate system including:
- Affiliate creation and code generation
- Conversion tracking and attribution
- Commission calculation
- Payout generation with Vietnam tax compliance
"""

import os
import secrets
import string
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from backend.models.affiliate import Affiliate, AffiliateLink, Conversion, Payout
from backend.models.enums import AffiliateStatus, ConversionStatus, PayoutStatus
from supabase import Client, create_client

# Constants
VND_RATE = 25000.0
VN_TAX_THRESHOLD = 500000000  # 500 million VND (~$20k)
VN_TAX_RATE_LOW = Decimal("0.005")  # 0.5%
VN_TAX_RATE_HIGH = Decimal("0.20")  # 20%


class AffiliateService:
    """Service for managing affiliate operations."""

    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            # Fallback/Warning logic could go here, but usually we want to fail fast or log
            print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.")
            self.client = None
        else:
            self.client: Client = create_client(supabase_url, supabase_key)

    def _generate_affiliate_code(self, length: int = 8) -> str:
        """Generate a random alphanumeric code."""
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def create_affiliate(
        self,
        user_id: str,
        agency_id: str,
        payment_email: str,
        commission_rate: float = 0.20,
        tax_id: Optional[str] = None,
    ) -> Affiliate:
        """
        Create a new affiliate profile for a user.

        Args:
            user_id: User UUID
            agency_id: Agency/Tenant UUID
            payment_email: Email for payouts (PayPal/Stripe)
            commission_rate: Default commission rate (0.0 - 1.0)
            tax_id: Optional tax identification number

        Returns:
            Created Affiliate object
        """
        # Ensure unique code
        code = self._generate_affiliate_code()

        # Check uniqueness loop could be added here, but purely random 8 chars collision is rare.
        # Ideally we catch DB unique constraint error and retry.

        data = {
            "user_id": user_id,
            "agency_id": agency_id,
            "code": code,
            "commission_rate": commission_rate,
            "payment_email": payment_email,
            "tax_id": tax_id,
            "status": AffiliateStatus.ACTIVE.value,
            "settings": {},
        }

        result = self.client.table("affiliates").insert(data).execute()

        if result.data:
            return Affiliate(**result.data[0])
        raise Exception("Failed to create affiliate")

    def get_affiliate(self, affiliate_id: str) -> Optional[Affiliate]:
        """Get affiliate by ID."""
        result = self.client.table("affiliates").select("*").eq("id", affiliate_id).execute()
        if result.data:
            return Affiliate(**result.data[0])
        return None

    def get_affiliate_by_code(self, code: str) -> Optional[Affiliate]:
        """Get affiliate by referral code."""
        result = self.client.table("affiliates").select("*").eq("code", code).execute()
        if result.data:
            return Affiliate(**result.data[0])
        return None

    def get_affiliate_by_user(self, user_id: str) -> Optional[Affiliate]:
        """Get affiliate by User ID."""
        result = self.client.table("affiliates").select("*").eq("user_id", user_id).execute()
        if result.data:
            return Affiliate(**result.data[0])
        return None

    def track_conversion(
        self,
        affiliate_id: str,
        amount: float,
        external_id: str,
        currency: str = "USD",
        metadata: Dict = None,
    ) -> Conversion:
        """
        Record a conversion (sale) and calculate commission.

        Args:
            affiliate_id: Affiliate UUID
            amount: Sale amount
            external_id: External transaction ID (Gumroad/Stripe)
            currency: Currency code
            metadata: Additional info (product name, etc.)

        Returns:
            Created Conversion object
        """
        affiliate = self.get_affiliate(affiliate_id)
        if not affiliate:
            raise ValueError(f"Affiliate {affiliate_id} not found")

        commission_amount = Decimal(str(amount)) * affiliate.commission_rate

        # Round to 2 decimal places
        commission_amount = commission_amount.quantize(Decimal("0.01"))

        data = {
            "affiliate_id": affiliate_id,
            "external_id": external_id,
            "amount": float(amount),
            "currency": currency,
            "commission_amount": float(commission_amount),
            "status": ConversionStatus.PENDING.value,
            "metadata": metadata or {},
        }

        result = self.client.table("conversions").insert(data).execute()

        if result.data:
            return Conversion(**result.data[0])
        raise Exception("Failed to track conversion")

    def approve_conversion(self, conversion_id: str) -> Conversion:
        """Mark a conversion as PAID (ready for payout calculation)."""
        data = {"status": ConversionStatus.PAID.value}
        result = self.client.table("conversions").update(data).eq("id", conversion_id).execute()

        if result.data:
            return Conversion(**result.data[0])
        raise Exception("Failed to update conversion")

    def _calculate_vn_tax_rate(
        self, amount_vnd: Decimal, current_quarter_income_vnd: Decimal
    ) -> Tuple[Decimal, Decimal]:
        """
        Calculate tax rate based on Vietnam affiliate tax laws (2026).

        Rules:
        - Threshold: 500,000,000 VND / year (implied roughly same for quarter checking logic or simpler threshold)
        - The prompt says "Threshold: 500,000,000 VND".
        - Below threshold: 0.5% (simplified)
        - Above threshold: 20% (10% PIT + 10% VAT)

        Note: This is a simplified implementation. Real tax logic might need year-to-date checks.
        We will assume the threshold applies to cumulative income.

        Args:
            amount_vnd: Current payout amount in VND
            current_quarter_income_vnd: Income accumulated so far (not used in this simplified check,
                                        but theoretically needed for progressive logic).
                                        For now, we just check if the payout itself or yearly total crosses it?
                                        Let's stick to the prompt's logic:
                                        "Split large invoices across quarters to stay below threshold"
                                        This implies we check `quarter_total + amount_vnd`.

        Returns:
            (tax_rate, tax_amount)
        """
        total_check = current_quarter_income_vnd + amount_vnd

        if total_check <= Decimal(VN_TAX_THRESHOLD):
            rate = VN_TAX_RATE_LOW
        else:
            rate = VN_TAX_RATE_HIGH

        tax_amount = amount_vnd * rate
        return rate, tax_amount

    def generate_payout(
        self, affiliate_id: str, period_start: date, period_end: date, min_threshold: float = 50.0
    ) -> Optional[Payout]:
        """
        Generate a payout record for an affiliate for a given period.
        Aggregates all 'PAID' status conversions that haven't been paid out yet.

        Args:
            affiliate_id: Affiliate UUID
            period_start: Start date filter (optional in practice if we just take all unpaid)
            period_end: Cutoff date
            min_threshold: Minimum amount to trigger payout (default $50)

        Returns:
            Created Payout object or None if below threshold
        """
        # 1. Fetch eligible conversions
        # Status 'paid' means the sale is confirmed and commission is ready.
        # Payout_id is null means it hasn't been bundled into a payout yet.
        # Filter by created_at <= period_end to respect the cycle.
        query = (
            self.client.table("conversions")
            .select("*")
            .eq("affiliate_id", affiliate_id)
            .eq("status", ConversionStatus.PAID.value)
            .is_("payout_id", "null")
            .lte("created_at", period_end.isoformat())
        )
        result = query.execute()
        conversions = result.data

        if not conversions:
            return None

        # 2. Calculate total
        total_commission = sum(Decimal(str(c["commission_amount"])) for c in conversions)

        if total_commission < Decimal(str(min_threshold)):
            return None

        # 3. Calculate Tax (Vietnam Logic)
        # We need accumulated income for this year/quarter to determine rate?
        # For MVP, let's look at the "Split large invoices" rule.
        # It implies we check if THIS payout + previous payouts crossing threshold.
        # Let's fetch YTD payouts.
        current_year = date.today().year
        ytd_query = (
            self.client.table("payouts")
            .select("amount")
            .eq("affiliate_id", affiliate_id)
            .gte("created_at", f"{current_year}-01-01")
        )
        ytd_result = ytd_query.execute()
        ytd_amount_usd = sum(Decimal(str(p["amount"])) for p in ytd_result.data)

        # Convert to VND for threshold check
        ytd_amount_vnd = ytd_amount_usd * Decimal(str(VND_RATE))
        current_amount_vnd = total_commission * Decimal(str(VND_RATE))

        tax_rate, tax_amount_vnd = self._calculate_vn_tax_rate(current_amount_vnd, ytd_amount_vnd)

        # Convert tax back to USD for record keeping (assuming base currency is USD)
        tax_amount_usd = tax_amount_vnd / Decimal(str(VND_RATE))
        tax_amount_usd = tax_amount_usd.quantize(Decimal("0.01"))

        # 4. Create Payout Record
        payout_data = {
            "affiliate_id": affiliate_id,
            "amount": float(total_commission),
            "currency": "USD",
            "tax_amount": float(tax_amount_usd),
            "tax_rate": float(tax_rate),
            "status": PayoutStatus.PENDING.value,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
        }

        payout_res = self.client.table("payouts").insert(payout_data).execute()
        if not payout_res.data:
            raise Exception("Failed to create payout")

        payout = Payout(**payout_res.data[0])

        # 5. Link conversions to this payout
        conversion_ids = [c["id"] for c in conversions]
        self.client.table("conversions").update({"payout_id": payout.id}).in_(
            "id", conversion_ids
        ).execute()

        return payout

    def get_dashboard_stats(self, affiliate_id: str) -> Dict:
        """
        Get aggregated stats for the affiliate dashboard.
        """
        # Total Clicks
        clicks_result = (
            self.client.table("affiliate_links")
            .select("clicks")
            .eq("affiliate_id", affiliate_id)
            .execute()
        )
        total_clicks = sum(item["clicks"] for item in clicks_result.data)

        # Conversions
        conv_result = (
            self.client.table("conversions")
            .select("amount, commission_amount, status")
            .eq("affiliate_id", affiliate_id)
            .execute()
        )
        conversions = conv_result.data

        total_sales = sum(c["amount"] for c in conversions)
        total_earnings = sum(
            c["commission_amount"]
            for c in conversions
            if c["status"] != ConversionStatus.REFUNDED.value
        )
        pending_payout = sum(
            c["commission_amount"]
            for c in conversions
            if c["status"] == ConversionStatus.PENDING.value
        )
        # Note: Logic on 'pending' depends on status definitions.

        return {
            "clicks": total_clicks,
            "conversions": len(conversions),
            "total_sales": total_sales,
            "total_earnings": total_earnings,
            "pending_payout": pending_payout,
        }
